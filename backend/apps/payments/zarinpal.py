"""
Zarinpal payment gateway integration.
All HTTP calls are isolated here so they can be mocked in tests.
"""
import requests
from django.conf import settings

ZARINPAL_REQUEST_URL = 'https://api.zarinpal.com/pg/v4/payment/request.json'
ZARINPAL_VERIFY_URL = 'https://api.zarinpal.com/pg/v4/payment/verify.json'
ZARINPAL_GATE_URL = 'https://www.zarinpal.com/pg/StartPay/{authority}'

SANDBOX_REQUEST_URL = 'https://sandbox.zarinpal.com/pg/v4/payment/request.json'
SANDBOX_VERIFY_URL = 'https://sandbox.zarinpal.com/pg/v4/payment/verify.json'
SANDBOX_GATE_URL = 'https://sandbox.zarinpal.com/pg/StartPay/{authority}'


def _is_sandbox() -> bool:
    return getattr(settings, 'ZARINPAL_SANDBOX', True)


def _request_url() -> str:
    return SANDBOX_REQUEST_URL if _is_sandbox() else ZARINPAL_REQUEST_URL


def _verify_url() -> str:
    return SANDBOX_VERIFY_URL if _is_sandbox() else ZARINPAL_VERIFY_URL


def _gate_url(authority: str) -> str:
    base = SANDBOX_GATE_URL if _is_sandbox() else ZARINPAL_GATE_URL
    return base.format(authority=authority)


def request_payment(amount: int, description: str, callback_url: str) -> dict:
    """
    Returns {'authority': str, 'gate_url': str} on success.
    Raises ZarinpalError on failure.
    """
    payload = {
        'merchant_id': settings.ZARINPAL_MERCHANT_ID,
        'amount': amount,
        'description': description,
        'callback_url': callback_url,
    }
    try:
        resp = requests.post(_request_url(), json=payload, timeout=10)
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        raise ZarinpalError(f'خطا در اتصال به درگاه پرداخت: {e}')

    if data.get('data', {}).get('code') != 100:
        raise ZarinpalError(f'خطای زرین‌پال: {data}')

    authority = data['data']['authority']
    return {'authority': authority, 'gate_url': _gate_url(authority)}


def verify_payment(authority: str, amount: int) -> str:
    """
    Returns ref_id string on success.
    Raises ZarinpalError on failure or already-verified (code 101).
    """
    payload = {
        'merchant_id': settings.ZARINPAL_MERCHANT_ID,
        'authority': authority,
        'amount': amount,
    }
    try:
        resp = requests.post(_verify_url(), json=payload, timeout=10)
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        raise ZarinpalError(f'خطا در تأیید پرداخت: {e}')

    code = data.get('data', {}).get('code')
    if code not in (100, 101):
        raise ZarinpalError(f'پرداخت تأیید نشد: {data}')

    return str(data['data']['ref_id'])


class ZarinpalError(Exception):
    pass
