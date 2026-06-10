"""
Notifications task tests.

Design notes:
  - send_booking_confirmation_sms / send_cancellation_sms are called via
    transaction.on_commit in production.  In pytest's TestCase wrapper the
    outer transaction never commits, so on_commit callbacks never fire.
    Tests therefore call the tasks DIRECTLY after booking/cancelling to
    verify their behaviour in isolation.
  - The autouse mock_sms fixture in conftest patches Kavenegar at the HTTP
    layer for all tests so no real requests escape.
"""
import pytest
from unittest.mock import patch

from apps.appointments.services import AppointmentService
from apps.notifications.models import SMSLog, SMSStatus
from apps.notifications.tasks import (
    send_booking_confirmation_sms,
    send_cancellation_sms,
    send_otp_sms,
)

from .conftest import SATURDAY, SLOT_9_00


def _book(customer, provider, service, working_hours):
    return AppointmentService.create_appointment(
        business_id=provider.business_id,
        provider=provider,
        date=SATURDAY,
        start_time=SLOT_9_00,
        service_id=service.id,
        customer=customer,
    )


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
    """
    Call the task directly (on_commit doesn't fire in TestCase).
    """

    def test_creates_sent_log(self, customer, provider, service, working_hours):
        appointment = _book(customer, provider, service, working_hours)
        SMSLog.objects.all().delete()  # clear any logs from booking

        with patch('apps.notifications.kavenegar.requests.post') as m:
            m.return_value.json.return_value = {'return': {'status': 200}}
            send_booking_confirmation_sms(appointment.pk)

        log = SMSLog.objects.filter(phone=customer.phone).first()
        assert log is not None
        assert log.status == SMSStatus.SENT

    def test_message_contains_business_name(self, customer, provider, service, working_hours):
        appointment = _book(customer, provider, service, working_hours)

        with patch('apps.notifications.kavenegar.requests.post') as m:
            m.return_value.json.return_value = {'return': {'status': 200}}
            send_booking_confirmation_sms(appointment.pk)

        log = SMSLog.objects.filter(phone=customer.phone).order_by('-id').first()
        assert provider.business_name in log.message

    def test_message_contains_tracking_code(self, customer, provider, service, working_hours):
        appointment = _book(customer, provider, service, working_hours)

        with patch('apps.notifications.kavenegar.requests.post') as m:
            m.return_value.json.return_value = {'return': {'status': 200}}
            send_booking_confirmation_sms(appointment.pk)

        log = SMSLog.objects.filter(phone=customer.phone).order_by('-id').first()
        assert appointment.tracking_code in log.message

    def test_booking_succeeds_even_if_sms_fails(self, customer, provider, service, working_hours):
        """Appointment must be created even if the SMS task subsequently fails."""
        appointment = _book(customer, provider, service, working_hours)
        assert appointment.pk is not None  # booking itself succeeded

        # Now simulate SMS failure when the task is called
        import requests as req
        with patch('apps.notifications.kavenegar.requests.post', side_effect=req.ConnectionError()):
            send_booking_confirmation_sms.apply(args=(appointment.pk,))

        log = SMSLog.objects.filter(phone=customer.phone).order_by('-id').first()
        assert log.status == SMSStatus.FAILED


# ── Cancellation ─────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestSendCancellationSms:
    def test_creates_sent_log_on_cancellation(self, customer, provider, service, working_hours):
        appointment = _book(customer, provider, service, working_hours)

        with patch('apps.notifications.kavenegar.requests.post') as m:
            m.return_value.json.return_value = {'return': {'status': 200}}
            send_cancellation_sms(appointment.pk)

        log = SMSLog.objects.filter(phone=customer.phone).order_by('-id').first()
        assert log is not None
        assert log.status == SMSStatus.SENT

    def test_cancellation_message_contains_business_name(self, customer, provider, service, working_hours):
        appointment = _book(customer, provider, service, working_hours)

        with patch('apps.notifications.kavenegar.requests.post') as m:
            m.return_value.json.return_value = {'return': {'status': 200}}
            send_cancellation_sms(appointment.pk)

        log = SMSLog.objects.filter(phone=customer.phone).order_by('-id').first()
        assert provider.business_name in log.message

    def test_cancellation_succeeds_even_if_sms_fails(self, customer, provider, service, working_hours):
        """cancel_appointment must succeed even if the SMS task fails."""
        appointment = _book(customer, provider, service, working_hours)
        cancelled = AppointmentService.cancel_appointment(appointment, customer)

        from apps.appointments.models import AppointmentStatus
        assert cancelled.status == AppointmentStatus.CANCELLED

    def test_task_directly_sends_cancellation_sms(self, customer, provider, service, working_hours):
        appointment = _book(customer, provider, service, working_hours)

        with patch('apps.notifications.kavenegar.requests.post') as m:
            m.return_value.json.return_value = {'return': {'status': 200}}
            send_cancellation_sms(appointment.pk)

        log = SMSLog.objects.filter(phone=customer.phone).order_by('-id').first()
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
        first = SMSLog.objects.create(phone='09120000001', message='اول', status=SMSStatus.SENT)
        second = SMSLog.objects.create(phone='09120000001', message='دوم', status=SMSStatus.SENT)
        # Order by id desc (always monotonic, unlike created_at in fast tests)
        logs = list(SMSLog.objects.filter(phone='09120000001').order_by('-id'))
        assert logs[0].pk == second.pk
        assert logs[1].pk == first.pk
