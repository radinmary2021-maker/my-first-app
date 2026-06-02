import random
import string
from datetime import timedelta

from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from .models import OTPCode, User
from django.conf import settings


def _generate_otp_code() -> str:
    return ''.join(random.choices(string.digits, k=6))


def generate_otp(phone: str) -> str:
    """
    Invalidate previous OTPs for this phone, create a new one.
    Returns the plain code (caller decides whether to send it or log it).
    """
    OTPCode.objects.filter(phone=phone, is_used=False).update(is_used=True)

    code = _generate_otp_code()
    expiry = timezone.now() + timedelta(seconds=settings.OTP_EXPIRY_SECONDS)

    OTPCode.objects.create(
        phone=phone,
        otp_hash=make_password(code),
        expires_at=expiry,
    )
    return code


def verify_otp(phone: str, code: str) -> bool:
    """
    Returns True if OTP is valid and marks it used.
    Increments attempt counter and invalidates after max attempts.
    """
    try:
        otp = OTPCode.objects.get(
            phone=phone,
            is_used=False,
            expires_at__gt=timezone.now(),
        )
    except OTPCode.DoesNotExist:
        return False

    if otp.attempts >= settings.OTP_MAX_ATTEMPTS:
        otp.is_used = True
        otp.save(update_fields=['is_used'])
        return False

    if not check_password(code, otp.otp_hash):
        otp.attempts += 1
        if otp.attempts >= settings.OTP_MAX_ATTEMPTS:
            otp.is_used = True
        otp.save(update_fields=['attempts', 'is_used'])
        return False

    otp.is_used = True
    otp.save(update_fields=['is_used'])
    return True


def get_or_create_user(phone: str) -> tuple[User, bool]:
    """Returns (user, created)."""
    user, created = User.objects.get_or_create(
        phone=phone,
        defaults={'role': 'patient'},
    )
    return user, created


def issue_jwt_tokens(user: User) -> dict:
    """Returns access and refresh token strings."""
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }
