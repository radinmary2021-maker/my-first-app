"""
Sprint 5.5 — SMS retry behaviour tests.
Tasks use autoretry_for + retry_backoff + max_retries=3.
"""
import pytest
from unittest.mock import patch

from apps.notifications.kavenegar import KavenegarError
from apps.notifications.models import SMSLog, SMSStatus
from apps.notifications.tasks import send_otp_sms, send_booking_confirmation_sms


# ── Configuration assertions ──────────────────────────────────────────────────

class TestTaskConfiguration:
    def test_send_otp_sms_max_retries(self):
        assert send_otp_sms.max_retries == 3

    def test_send_otp_sms_autoretry_for_kavenegar_error(self):
        assert KavenegarError in send_otp_sms.autoretry_for

    def test_send_otp_sms_retry_backoff_enabled(self):
        assert send_otp_sms.retry_backoff is True

    def test_send_booking_confirmation_max_retries(self):
        assert send_booking_confirmation_sms.max_retries == 3


# ── Eager-mode retry integration (full retry cycle) ───────────────────────────

@pytest.mark.django_db
class TestSendOtpSmsRetry:
    def test_success_creates_sent_log(self):
        with patch('apps.notifications.kavenegar.requests.post') as m:
            m.return_value.json.return_value = {'return': {'status': 200}}
            send_otp_sms.apply(args=('09120000001', '123456'))

        log = SMSLog.objects.get(phone='09120000001')
        assert log.status == SMSStatus.SENT

    def test_all_retries_exhausted_creates_failed_log(self):
        """
        In eager mode with autoretry_for, Celery retries synchronously.
        After max_retries exhausted, FAILED log must be created.
        """
        import requests as req
        with patch('apps.notifications.kavenegar.requests.post', side_effect=req.ConnectionError()):
            send_otp_sms.apply(args=('09120000001', '123456'))

        log = SMSLog.objects.get(phone='09120000001')
        assert log.status == SMSStatus.FAILED

    def test_failed_log_contains_code(self):
        import requests as req
        with patch('apps.notifications.kavenegar.requests.post', side_effect=req.ConnectionError()):
            send_otp_sms.apply(args=('09120000001', '777666'))

        log = SMSLog.objects.get(phone='09120000001')
        assert '777666' in log.message

    def test_no_log_before_final_retry(self):
        """Intermediate retry (retries < max_retries) must NOT create a log."""
        import requests as req
        # Push a fake request with retries=1 (not yet at max_retries=3)
        send_otp_sms.push_request(retries=1)
        try:
            with patch('apps.notifications.kavenegar.requests.post', side_effect=req.ConnectionError()):
                with pytest.raises(KavenegarError):
                    send_otp_sms.run('09120000001', '123456')
        finally:
            send_otp_sms.pop_request()

        assert not SMSLog.objects.filter(phone='09120000001').exists()

    def test_log_created_at_final_retry(self):
        """Simulate being exactly at max_retries — FAILED log must be created."""
        import requests as req
        send_otp_sms.push_request(retries=send_otp_sms.max_retries)
        try:
            with patch('apps.notifications.kavenegar.requests.post', side_effect=req.ConnectionError()):
                with pytest.raises(KavenegarError):
                    send_otp_sms.run('09120000001', '123456')
        finally:
            send_otp_sms.pop_request()

        log = SMSLog.objects.get(phone='09120000001')
        assert log.status == SMSStatus.FAILED


# ── Booking SMS retry ─────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestBookingSmRetry:
    def _book(self, patient, doctor, schedule):
        from apps.appointments.services import book_appointment
        from .conftest import SATURDAY, SLOT_9_00
        with patch('apps.notifications.kavenegar.requests.post') as m:
            m.return_value.json.return_value = {'return': {'status': 200}}
            return book_appointment(patient, doctor, SATURDAY, SLOT_9_00)

    def test_all_retries_exhausted_creates_failed_log(self, patient, doctor, schedule):
        import requests as req
        appt = self._book(patient, doctor, schedule)
        SMSLog.objects.all().delete()

        with patch('apps.notifications.kavenegar.requests.post', side_effect=req.ConnectionError()):
            send_booking_confirmation_sms.apply(args=(appt.pk,))

        log = SMSLog.objects.get(phone=patient.phone)
        assert log.status == SMSStatus.FAILED

    def test_no_log_before_final_retry(self, patient, doctor, schedule):
        import requests as req
        appt = self._book(patient, doctor, schedule)
        SMSLog.objects.all().delete()

        send_booking_confirmation_sms.push_request(retries=2)
        try:
            with patch('apps.notifications.kavenegar.requests.post', side_effect=req.ConnectionError()):
                with pytest.raises(KavenegarError):
                    send_booking_confirmation_sms.run(appt.pk)
        finally:
            send_booking_confirmation_sms.pop_request()

        assert not SMSLog.objects.filter(phone=patient.phone).exists()
