import pytest
from django.urls import reverse

from apps.accounts.services import generate_otp


@pytest.mark.django_db
class TestSendOTPEndpoint:
    def test_valid_phone_returns_success(self, client):
        res = client.post('/api/auth/send-otp/', {'phone': '09121234567'}, content_type='application/json')
        assert res.status_code == 200
        assert res.json()['success'] is True

    def test_debug_mode_returns_dev_code(self, client, settings):
        settings.DEBUG = True
        res = client.post('/api/auth/send-otp/', {'phone': '09121234567'}, content_type='application/json')
        assert 'dev_code' in res.json()
        assert len(res.json()['dev_code']) == 6

    def test_invalid_phone_rejected(self, client):
        res = client.post('/api/auth/send-otp/', {'phone': '1234'}, content_type='application/json')
        assert res.status_code == 400

    def test_missing_phone_rejected(self, client):
        res = client.post('/api/auth/send-otp/', {}, content_type='application/json')
        assert res.status_code == 400

    def test_non_mobile_phone_rejected(self, client):
        res = client.post('/api/auth/send-otp/', {'phone': '02112345678'}, content_type='application/json')
        assert res.status_code == 400


@pytest.mark.django_db
class TestVerifyOTPEndpoint:
    def test_valid_otp_returns_tokens(self, client, settings):
        settings.DEBUG = True
        send_res = client.post('/api/auth/send-otp/', {'phone': '09121234567'}, content_type='application/json')
        code = send_res.json()['dev_code']

        res = client.post('/api/auth/verify-otp/', {'phone': '09121234567', 'otp': code}, content_type='application/json')
        assert res.status_code == 200
        data = res.json()
        assert 'access' in data
        assert 'refresh' in data
        assert data['user']['phone'] == '09121234567'

    def test_wrong_otp_returns_400(self, client):
        generate_otp('09121234567')
        res = client.post('/api/auth/verify-otp/', {'phone': '09121234567', 'otp': '000000'}, content_type='application/json')
        assert res.status_code == 400

    def test_invalid_otp_format_rejected(self, client):
        res = client.post('/api/auth/verify-otp/', {'phone': '09121234567', 'otp': 'abcdef'}, content_type='application/json')
        assert res.status_code == 400

    def test_expired_otp_returns_400(self, client):
        from datetime import timedelta
        from django.utils import timezone
        from apps.accounts.models import OTPCode

        generate_otp('09121234567')
        otp = OTPCode.objects.get(phone='09121234567', is_used=False)
        otp.expires_at = timezone.now() - timedelta(seconds=1)
        otp.save()

        res = client.post('/api/auth/verify-otp/', {'phone': '09121234567', 'otp': '123456'}, content_type='application/json')
        assert res.status_code == 400


@pytest.mark.django_db
class TestMeEndpoint:
    def test_unauthenticated_returns_401(self, client):
        res = client.get('/api/auth/me/')
        assert res.status_code == 401

    def test_authenticated_returns_user(self, client, settings):
        settings.DEBUG = True
        send_res = client.post('/api/auth/send-otp/', {'phone': '09121234567'}, content_type='application/json')
        code = send_res.json()['dev_code']
        verify_res = client.post('/api/auth/verify-otp/', {'phone': '09121234567', 'otp': code}, content_type='application/json')
        token = verify_res.json()['access']

        res = client.get('/api/auth/me/', HTTP_AUTHORIZATION=f'Bearer {token}')
        assert res.status_code == 200
        assert res.json()['phone'] == '09121234567'


@pytest.mark.django_db
class TestRefreshEndpoint:
    def test_valid_refresh_returns_new_access(self, client, settings):
        settings.DEBUG = True
        send_res = client.post('/api/auth/send-otp/', {'phone': '09121234567'}, content_type='application/json')
        code = send_res.json()['dev_code']
        verify_res = client.post('/api/auth/verify-otp/', {'phone': '09121234567', 'otp': code}, content_type='application/json')
        refresh = verify_res.json()['refresh']

        res = client.post('/api/auth/refresh/', {'refresh': refresh}, content_type='application/json')
        assert res.status_code == 200
        assert 'access' in res.json()
