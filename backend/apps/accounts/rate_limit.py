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


def is_rate_limited(phone: str, ip: str) -> bool:
    """Returns True if the request should be blocked."""
    phone_count = cache.get(_phone_key(phone), 0)
    if phone_count >= PHONE_LIMIT:
        return True

    ip_count = cache.get(_ip_key(ip), 0)
    if ip_count >= IP_LIMIT:
        return True

    return False


def increment_rate_counters(phone: str, ip: str) -> None:
    """Atomically increment OTP rate-limit counters using Redis SETNX + INCR."""
    phone_key = _phone_key(phone)
    ip_key = _ip_key(ip)

    # cache.add() is atomic (Redis SET NX): sets key=0 only if it does not exist.
    # cache.incr() is atomic. Together they yield a correct distributed counter.
    cache.add(phone_key, 0, PHONE_WINDOW)
    cache.incr(phone_key)

    cache.add(ip_key, 0, IP_WINDOW)
    cache.incr(ip_key)
