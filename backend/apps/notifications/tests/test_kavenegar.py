import pytest
from unittest.mock import patch, MagicMock

from apps.notifications.kavenegar import KavenegarClient, KavenegarError


class TestKavenegarClient:
    def test_send_sms_success(self):
        client = KavenegarClient()
        mock_resp = MagicMock()
        mock_resp.json.return_value = {'return': {'status': 200, 'message': 'تایید شد'}}

        with patch('apps.notifications.kavenegar.requests.post', return_value=mock_resp):
            client.send_sms('09120000001', 'پیام تست')

        mock_resp.raise_for_status.assert_called_once()

    def test_send_sms_api_error_raises(self):
        client = KavenegarClient()
        mock_resp = MagicMock()
        mock_resp.json.return_value = {'return': {'status': 400, 'message': 'خطا'}}

        with patch('apps.notifications.kavenegar.requests.post', return_value=mock_resp):
            with pytest.raises(KavenegarError, match='کاوه‌نگار'):
                client.send_sms('09120000001', 'پیام تست')

    def test_send_sms_network_error_raises(self):
        import requests as req
        client = KavenegarClient()

        with patch('apps.notifications.kavenegar.requests.post', side_effect=req.ConnectionError('timeout')):
            with pytest.raises(KavenegarError, match='اتصال'):
                client.send_sms('09120000001', 'پیام تست')

    def test_send_sms_posts_to_correct_url(self):
        client = KavenegarClient()
        mock_resp = MagicMock()
        mock_resp.json.return_value = {'return': {'status': 200}}

        with patch('apps.notifications.kavenegar.requests.post', return_value=mock_resp) as mock_post:
            client.send_sms('09120000001', 'پیام')

        call_url = mock_post.call_args[0][0]
        assert 'kavenegar.com' in call_url
        assert 'test-key' in call_url
