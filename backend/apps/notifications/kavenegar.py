"""
Kavenegar SMS gateway client.
All HTTP calls are isolated here so they can be mocked in tests.
"""
import requests
from django.conf import settings


class KavenegarError(Exception):
    pass


class KavenegarClient:
    _BASE_URL = 'https://api.kavenegar.com/v1/{api_key}/sms/send.json'

    def __init__(self):
        self._api_key = settings.KAVENEGAR_API_KEY

    def send_sms(self, phone: str, message: str) -> None:
        url = self._BASE_URL.format(api_key=self._api_key)
        try:
            resp = requests.post(
                url,
                data={'receptor': phone, 'message': message},
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()
        except requests.RequestException as e:
            raise KavenegarError(f'خطا در اتصال به کاوه‌نگار: {e}')

        if data.get('return', {}).get('status') != 200:
            raise KavenegarError(f'خطای کاوه‌نگار: {data}')
