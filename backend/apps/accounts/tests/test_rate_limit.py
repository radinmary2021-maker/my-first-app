import pytest
from django.core.cache import cache

from apps.accounts.rate_limit import (
    increment_rate_counters,
    is_rate_limited,
    PHONE_LIMIT,
    IP_LIMIT,
)


@pytest.mark.django_db
class TestPhoneRateLimit:
    def test_under_limit_not_blocked(self):
        for _ in range(PHONE_LIMIT - 1):
            increment_rate_counters('09121234567', '1.2.3.4')
        assert is_rate_limited('09121234567', '1.2.3.4') is False

    def test_at_limit_is_blocked(self):
        for _ in range(PHONE_LIMIT):
            increment_rate_counters('09121234567', '1.2.3.4')
        assert is_rate_limited('09121234567', '1.2.3.4') is True

    def test_different_phone_not_affected(self):
        for _ in range(PHONE_LIMIT):
            increment_rate_counters('09121234567', '1.2.3.4')
        assert is_rate_limited('09129999999', '1.2.3.4') is False

    def test_phone_limit_via_api(self, client, settings):
        settings.DEBUG = True
        for _ in range(PHONE_LIMIT):
            client.post('/api/auth/send-otp/', {'phone': '09121234567'}, content_type='application/json')
        res = client.post('/api/auth/send-otp/', {'phone': '09121234567'}, content_type='application/json')
        assert res.status_code == 429
        assert res.json()['success'] is False

    def test_phone_limit_response_shape(self, client, settings):
        settings.DEBUG = True
        for _ in range(PHONE_LIMIT + 1):
            res = client.post('/api/auth/send-otp/', {'phone': '09121234567'}, content_type='application/json')
        assert 'message' in res.json()


@pytest.mark.django_db
class TestIPRateLimit:
    def test_ip_limit_blocks_different_phones(self, client, settings):
        settings.DEBUG = True
        phones = [f'0912123{str(i).zfill(4)}' for i in range(IP_LIMIT)]
        for phone in phones:
            client.post(
                '/api/auth/send-otp/', {'phone': phone},
                content_type='application/json',
                REMOTE_ADDR='5.6.7.8',
            )
        # یک شماره جدید از همان IP
        res = client.post(
            '/api/auth/send-otp/', {'phone': '09127777777'},
            content_type='application/json',
            REMOTE_ADDR='5.6.7.8',
        )
        assert res.status_code == 429

    def test_different_ip_not_blocked(self, client, settings):
        settings.DEBUG = True
        phones = [f'0912123{str(i).zfill(4)}' for i in range(IP_LIMIT)]
        for phone in phones:
            client.post(
                '/api/auth/send-otp/', {'phone': phone},
                content_type='application/json',
                REMOTE_ADDR='5.6.7.8',
            )
        res = client.post(
            '/api/auth/send-otp/', {'phone': '09127777777'},
            content_type='application/json',
            REMOTE_ADDR='9.9.9.9',
        )
        assert res.status_code == 200


@pytest.mark.django_db
class TestNormalRequestsWork:
    def test_first_request_succeeds(self, client, settings):
        settings.DEBUG = True
        res = client.post('/api/auth/send-otp/', {'phone': '09121234567'}, content_type='application/json')
        assert res.status_code == 200
        assert res.json()['success'] is True

    def test_up_to_limit_all_succeed(self, client, settings):
        settings.DEBUG = True
        for i in range(PHONE_LIMIT):
            res = client.post('/api/auth/send-otp/', {'phone': '09121234567'}, content_type='application/json')
            assert res.status_code == 200, f'request {i+1} failed unexpectedly'


@pytest.mark.django_db
class TestRateLimitReset:
    def test_counter_resets_after_cache_clear(self, client, settings):
        settings.DEBUG = True
        for _ in range(PHONE_LIMIT):
            client.post('/api/auth/send-otp/', {'phone': '09121234567'}, content_type='application/json')

        # شبیه‌سازی پایان پنجره زمانی
        cache.clear()

        res = client.post('/api/auth/send-otp/', {'phone': '09121234567'}, content_type='application/json')
        assert res.status_code == 200
