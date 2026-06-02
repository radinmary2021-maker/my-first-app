from datetime import timedelta
from unittest.mock import patch

import pytest
from django.contrib.auth.hashers import make_password
from django.utils import timezone

from apps.accounts.models import OTPCode, User
from apps.accounts.services import (
    generate_otp,
    get_or_create_user,
    issue_jwt_tokens,
    verify_otp,
)


@pytest.mark.django_db
class TestGenerateOTP:
    def test_creates_otp_record(self):
        generate_otp('09121234567')
        assert OTPCode.objects.filter(phone='09121234567', is_used=False).exists()

    def test_otp_is_six_digits(self):
        code = generate_otp('09121234567')
        assert len(code) == 6
        assert code.isdigit()

    def test_previous_otp_invalidated(self):
        generate_otp('09121234567')
        generate_otp('09121234567')
        active = OTPCode.objects.filter(phone='09121234567', is_used=False).count()
        assert active == 1

    def test_otp_has_expiry(self):
        generate_otp('09121234567')
        otp = OTPCode.objects.get(phone='09121234567', is_used=False)
        assert otp.expires_at > timezone.now()

    def test_otp_stored_as_hash(self):
        code = generate_otp('09121234567')
        otp = OTPCode.objects.get(phone='09121234567', is_used=False)
        assert otp.otp_hash != code


@pytest.mark.django_db
class TestVerifyOTP:
    def test_valid_otp_returns_true(self):
        code = generate_otp('09121234567')
        assert verify_otp('09121234567', code) is True

    def test_valid_otp_marked_used(self):
        code = generate_otp('09121234567')
        verify_otp('09121234567', code)
        assert OTPCode.objects.get(phone='09121234567').is_used is True

    def test_wrong_code_returns_false(self):
        generate_otp('09121234567')
        assert verify_otp('09121234567', '000000') is False

    def test_wrong_code_increments_attempts(self):
        generate_otp('09121234567')
        verify_otp('09121234567', '000000')
        otp = OTPCode.objects.get(phone='09121234567', is_used=False)
        assert otp.attempts == 1

    def test_expired_otp_returns_false(self):
        generate_otp('09121234567')
        otp = OTPCode.objects.get(phone='09121234567', is_used=False)
        otp.expires_at = timezone.now() - timedelta(seconds=1)
        otp.save()
        assert verify_otp('09121234567', 'any') is False

    def test_max_attempts_invalidates_otp(self):
        code = generate_otp('09121234567')
        for _ in range(5):
            verify_otp('09121234567', '000000')
        assert verify_otp('09121234567', code) is False
        assert OTPCode.objects.get(phone='09121234567').is_used is True

    def test_reuse_returns_false(self):
        code = generate_otp('09121234567')
        verify_otp('09121234567', code)
        assert verify_otp('09121234567', code) is False

    def test_wrong_phone_returns_false(self):
        code = generate_otp('09121234567')
        assert verify_otp('09009999999', code) is False


@pytest.mark.django_db
class TestGetOrCreateUser:
    def test_creates_new_user(self):
        user, created = get_or_create_user('09121234567')
        assert created is True
        assert user.phone == '09121234567'
        assert user.role == 'patient'

    def test_returns_existing_user(self):
        get_or_create_user('09121234567')
        user, created = get_or_create_user('09121234567')
        assert created is False

    def test_user_count_stays_one(self):
        get_or_create_user('09121234567')
        get_or_create_user('09121234567')
        assert User.objects.filter(phone='09121234567').count() == 1


@pytest.mark.django_db
class TestIssueJWTTokens:
    def test_returns_access_and_refresh(self):
        user, _ = get_or_create_user('09121234567')
        tokens = issue_jwt_tokens(user)
        assert 'access' in tokens
        assert 'refresh' in tokens

    def test_tokens_are_strings(self):
        user, _ = get_or_create_user('09121234567')
        tokens = issue_jwt_tokens(user)
        assert isinstance(tokens['access'], str)
        assert isinstance(tokens['refresh'], str)
