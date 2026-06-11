import time

from django.core.cache import cache
from django.conf import settings

PHONE_LIMIT = getattr(settings, 'OTP_RATE_PHONE_LIMIT', 3)
PHONE_WINDOW = getattr(settings, 'OTP_RATE_PHONE_WINDOW', 600)
IP_LIMIT = getattr(settings, 'OTP_RATE_IP_LIMIT', 10)
IP_WINDOW = getattr(settings, 'OTP_RATE_IP_WINDOW', 600)


def _phone_key(phone: str) -> str:
    return f'otp_rate:phone:{phone}'


def _ip_key(ip: str) -> str:
    return f'otp_rate:ip:{ip}'


def _expiry_key(base_key: str) -> str:
    return f'{base_key}:expiry'


def is_rate_limited(phone: str, ip: str) -> tuple[bool, int]:
    """
    Returns (is_blocked, retry_after_seconds).
    retry_after_seconds is the remaining wait time, or PHONE_WINDOW as fallback.
    """
    phone_count = cache.get(_phone_key(phone), 0)
    if phone_count >= PHONE_LIMIT:
        expiry = cache.get(_expiry_key(_phone_key(phone)))
        retry = max(1, int(expiry - time.time())) if expiry else PHONE_WINDOW
        return True, retry

    ip_count = cache.get(_ip_key(ip), 0)
    if ip_count >= IP_LIMIT:
        expiry = cache.get(_expiry_key(_ip_key(ip)))
        retry = max(1, int(expiry - time.time())) if expiry else IP_WINDOW
        return True, retry

    return False, 0


def increment_rate_counters(phone: str, ip: str) -> None:
    """Atomically increment OTP rate-limit counters using Redis SETNX + INCR."""
    phone_key = _phone_key(phone)
    ip_key = _ip_key(ip)
    now = time.time()

    # cache.add() is atomic (Redis SET NX): sets key=0 only if it does not exist.
    # cache.incr() is atomic. Together they yield a correct distributed counter.
    if cache.add(phone_key, 0, PHONE_WINDOW):
        # New window started — store expiry timestamp for retry_after calculation
        cache.set(_expiry_key(phone_key), now + PHONE_WINDOW, PHONE_WINDOW)
    cache.incr(phone_key)

    if cache.add(ip_key, 0, IP_WINDOW):
        cache.set(_expiry_key(ip_key), now + IP_WINDOW, IP_WINDOW)
    cache.incr(ip_key)
