import pytest
from unittest.mock import patch

from apps.accounts.services import generate_otp
from apps.notifications.models import SMSLog, SMSStatus


@pytest.mark.django_db
class TestOTPSMSIntegration:
    def test_send_otp_api_triggers_sms(self, client):
        with patch('apps.notifications.kavenegar.requests.post') as mock_post:
            mock_post.return_value.json.return_value = {'return': {'status': 200}}
            res = client.post(
                '/api/auth/send-otp/',
                {'phone': '09120000099'},
                content_type='application/json',
            )

        assert res.status_code == 200
        log = SMSLog.objects.filter(phone='09120000099').first()
        assert log is not None
        assert log.status == SMSStatus.SENT

    def test_send_otp_api_sms_failure_still_returns_200(self, client):
        import requests as req
        with patch('apps.notifications.kavenegar.requests.post', side_effect=req.ConnectionError()):
            res = client.post(
                '/api/auth/send-otp/',
                {'phone': '09120000088'},
                content_type='application/json',
            )

        assert res.status_code == 200
        log = SMSLog.objects.filter(phone='09120000088').first()
        assert log.status == SMSStatus.FAILED
