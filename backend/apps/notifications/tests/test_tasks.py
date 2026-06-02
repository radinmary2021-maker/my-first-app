import pytest
from unittest.mock import patch

from apps.appointments.services import book_appointment, cancel_appointment
from apps.notifications.models import SMSLog, SMSStatus
from apps.notifications.tasks import (
    send_booking_confirmation_sms,
    send_cancellation_sms,
    send_otp_sms,
)

from .conftest import SATURDAY, SLOT_9_00


# ── OTP ──────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestSendOtpSms:
    def test_creates_sent_log(self):
        with patch('apps.notifications.kavenegar.requests.post') as mock_post:
            mock_post.return_value.json.return_value = {'return': {'status': 200}}
            send_otp_sms('09120000001', '123456')

        log = SMSLog.objects.get(phone='09120000001')
        assert log.status == SMSStatus.SENT
        assert '123456' in log.message

    def test_message_contains_code(self):
        with patch('apps.notifications.kavenegar.requests.post') as mock_post:
            mock_post.return_value.json.return_value = {'return': {'status': 200}}
            send_otp_sms('09120000001', '654321')

        log = SMSLog.objects.get(phone='09120000001')
        assert '654321' in log.message

    def test_failed_sms_creates_failed_log(self):
        # Use .apply() so the full retry cycle runs in eager mode
        import requests as req
        with patch('apps.notifications.kavenegar.requests.post', side_effect=req.ConnectionError()):
            send_otp_sms.apply(args=('09120000001', '999999'))

        log = SMSLog.objects.get(phone='09120000001')
        assert log.status == SMSStatus.FAILED

    def test_failed_sms_does_not_raise(self):
        import requests as req
        with patch('apps.notifications.kavenegar.requests.post', side_effect=req.ConnectionError()):
            send_otp_sms.apply(args=('09120000001', '000000'))  # should not raise


# ── Booking Confirmation ──────────────────────────────────────────────────────

@pytest.mark.django_db
class TestSendBookingConfirmationSms:
    def test_creates_sent_log(self, patient, doctor, schedule):
        with patch('apps.notifications.kavenegar.requests.post') as mock_post:
            mock_post.return_value.json.return_value = {'return': {'status': 200}}
            appointment = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)

        log = SMSLog.objects.filter(phone=patient.phone).first()
        assert log is not None
        assert log.status == SMSStatus.SENT

    def test_message_contains_doctor_name(self, patient, doctor, schedule):
        with patch('apps.notifications.kavenegar.requests.post') as mock_post:
            mock_post.return_value.json.return_value = {'return': {'status': 200}}
            appointment = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)

        log = SMSLog.objects.filter(phone=patient.phone).first()
        assert doctor.user.full_name in log.message

    def test_message_contains_tracking_code(self, patient, doctor, schedule):
        with patch('apps.notifications.kavenegar.requests.post') as mock_post:
            mock_post.return_value.json.return_value = {'return': {'status': 200}}
            appointment = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)

        log = SMSLog.objects.filter(phone=patient.phone).first()
        assert appointment.tracking_code in log.message

    def test_booking_succeeds_even_if_sms_fails(self, patient, doctor, schedule):
        import requests as req
        with patch('apps.notifications.kavenegar.requests.post', side_effect=req.ConnectionError()):
            appointment = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)

        assert appointment.pk is not None
        log = SMSLog.objects.filter(phone=patient.phone).first()
        assert log.status == SMSStatus.FAILED

    def test_task_directly_sends_sms(self, patient, doctor, schedule):
        with patch('apps.notifications.kavenegar.requests.post') as mock_post:
            mock_post.return_value.json.return_value = {'return': {'status': 200}}
            appointment = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
            send_booking_confirmation_sms(appointment.pk)

        assert SMSLog.objects.filter(phone=patient.phone).count() >= 1


# ── Cancellation ─────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestSendCancellationSms:
    def _book(self, patient, doctor, schedule):
        with patch('apps.notifications.kavenegar.requests.post') as mock_post:
            mock_post.return_value.json.return_value = {'return': {'status': 200}}
            return book_appointment(patient, doctor, SATURDAY, SLOT_9_00)

    def test_creates_sent_log_on_cancellation(self, patient, doctor, schedule):
        appointment = self._book(patient, doctor, schedule)

        with patch('apps.notifications.kavenegar.requests.post') as mock_post:
            mock_post.return_value.json.return_value = {'return': {'status': 200}}
            cancel_appointment(appointment, patient)

        logs = SMSLog.objects.filter(phone=patient.phone, status=SMSStatus.SENT)
        assert logs.count() >= 1

    def test_cancellation_message_contains_doctor_name(self, patient, doctor, schedule):
        appointment = self._book(patient, doctor, schedule)

        with patch('apps.notifications.kavenegar.requests.post') as mock_post:
            mock_post.return_value.json.return_value = {'return': {'status': 200}}
            cancel_appointment(appointment, patient)

        log = SMSLog.objects.filter(phone=patient.phone).order_by('-created_at').first()
        assert doctor.user.full_name in log.message

    def test_cancellation_succeeds_even_if_sms_fails(self, patient, doctor, schedule):
        import requests as req
        appointment = self._book(patient, doctor, schedule)

        with patch('apps.notifications.kavenegar.requests.post', side_effect=req.ConnectionError()):
            cancelled = cancel_appointment(appointment, patient)

        from apps.appointments.models import AppointmentStatus
        assert cancelled.status == AppointmentStatus.CANCELLED

    def test_task_directly_sends_cancellation_sms(self, patient, doctor, schedule):
        appointment = self._book(patient, doctor, schedule)

        with patch('apps.notifications.kavenegar.requests.post') as mock_post:
            mock_post.return_value.json.return_value = {'return': {'status': 200}}
            send_cancellation_sms(appointment.pk)

        log = SMSLog.objects.filter(phone=patient.phone).order_by('-created_at').first()
        assert log is not None
        assert log.status == SMSStatus.SENT


# ── SMSLog model ─────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestSMSLog:
    def test_smslog_str(self):
        log = SMSLog.objects.create(
            phone='09120000001', message='تست', status=SMSStatus.SENT
        )
        assert '09120000001' in str(log)
        assert 'sent' in str(log)

    def test_smslog_ordering_newest_first(self):
        SMSLog.objects.create(phone='09120000001', message='اول', status=SMSStatus.SENT)
        SMSLog.objects.create(phone='09120000001', message='دوم', status=SMSStatus.SENT)
        logs = list(SMSLog.objects.filter(phone='09120000001'))
        assert logs[0].message == 'دوم'
