import pytest
from datetime import timedelta
from unittest.mock import patch

from django.utils import timezone

from apps.appointments.models import Appointment, AppointmentStatus
from apps.appointments.services import book_appointment
from apps.doctors.services import get_available_slots
from apps.payments.services import PaymentError, _is_expired, initiate_payment
from apps.payments.tasks import expire_pending_appointments

from .conftest import SATURDAY, SLOT_9_00


@pytest.mark.django_db
class TestIsExpired:
    def test_fresh_appointment_not_expired(self, pending_appointment):
        assert _is_expired(pending_appointment) is False

    def test_old_appointment_is_expired(self, pending_appointment):
        pending_appointment.created_at = timezone.now() - timedelta(minutes=16)
        pending_appointment.save(update_fields=['created_at'])
        assert _is_expired(pending_appointment) is True

    def test_exactly_at_boundary_not_expired(self, pending_appointment):
        pending_appointment.created_at = timezone.now() - timedelta(minutes=14, seconds=59)
        pending_appointment.save(update_fields=['created_at'])
        assert _is_expired(pending_appointment) is False


@pytest.mark.django_db
class TestInitiatePaymentExpiration:
    def test_expired_appointment_raises_payment_error(self, pending_appointment):
        pending_appointment.created_at = timezone.now() - timedelta(minutes=16)
        pending_appointment.save(update_fields=['created_at'])

        with pytest.raises(PaymentError, match='منقضی'):
            initiate_payment(pending_appointment, 'http://cb.test/')

    def test_expired_appointment_gets_cancelled(self, pending_appointment):
        pending_appointment.created_at = timezone.now() - timedelta(minutes=16)
        pending_appointment.save(update_fields=['created_at'])

        try:
            initiate_payment(pending_appointment, 'http://cb.test/')
        except PaymentError:
            pass

        pending_appointment.refresh_from_db()
        assert pending_appointment.status == AppointmentStatus.CANCELLED

    def test_already_cancelled_appointment_raises(self, pending_appointment):
        pending_appointment.status = AppointmentStatus.CANCELLED
        pending_appointment.save(update_fields=['status'])

        with pytest.raises(PaymentError, match='انتظار پرداخت'):
            initiate_payment(pending_appointment, 'http://cb.test/')

    def test_confirmed_appointment_raises(self, pending_appointment):
        pending_appointment.status = AppointmentStatus.CONFIRMED
        pending_appointment.save(update_fields=['status'])

        with pytest.raises(PaymentError, match='انتظار پرداخت'):
            initiate_payment(pending_appointment, 'http://cb.test/')


@pytest.mark.django_db
class TestExpiredSlotBecomesAvailable:
    def test_slot_available_after_expiration_cancel(self, patient, doctor, schedule, pending_appointment):
        # اسلات رزرو شده — در دسترس نیست
        slots_before = get_available_slots(doctor, SATURDAY)
        assert SLOT_9_00 not in slots_before

        # منقضی می‌شود و cancelled می‌شود
        pending_appointment.created_at = timezone.now() - timedelta(minutes=16)
        pending_appointment.save(update_fields=['created_at'])
        try:
            initiate_payment(pending_appointment, 'http://cb.test/')
        except PaymentError:
            pass

        # اسلات دوباره آزاد است
        slots_after = get_available_slots(doctor, SATURDAY)
        assert SLOT_9_00 in slots_after


@pytest.mark.django_db
class TestCleanupTask:
    def test_task_cancels_expired_appointments(self, pending_appointment):
        pending_appointment.created_at = timezone.now() - timedelta(minutes=16)
        pending_appointment.save(update_fields=['created_at'])

        count = expire_pending_appointments()

        assert count == 1
        pending_appointment.refresh_from_db()
        assert pending_appointment.status == AppointmentStatus.CANCELLED

    def test_task_does_not_cancel_fresh_appointments(self, pending_appointment):
        count = expire_pending_appointments()
        assert count == 0
        pending_appointment.refresh_from_db()
        assert pending_appointment.status == AppointmentStatus.PENDING_PAYMENT

    def test_task_does_not_touch_confirmed(self, pending_appointment):
        pending_appointment.status = AppointmentStatus.CONFIRMED
        pending_appointment.created_at = timezone.now() - timedelta(minutes=30)
        pending_appointment.save(update_fields=['status', 'created_at'])

        count = expire_pending_appointments()
        assert count == 0
        pending_appointment.refresh_from_db()
        assert pending_appointment.status == AppointmentStatus.CONFIRMED

    def test_task_does_not_touch_already_cancelled(self, pending_appointment):
        pending_appointment.status = AppointmentStatus.CANCELLED
        pending_appointment.created_at = timezone.now() - timedelta(minutes=30)
        pending_appointment.save(update_fields=['status', 'created_at'])

        count = expire_pending_appointments()
        assert count == 0

    def test_task_cancels_multiple_expired(self, patient, doctor, schedule):
        from datetime import time
        from apps.doctors.models import WeeklySchedule

        # دو اسلات مختلف، هر دو منقضی
        slot2 = time(9, 20)
        appt1 = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        appt2 = book_appointment(patient, doctor, SATURDAY, slot2)

        old_time = timezone.now() - timedelta(minutes=20)
        Appointment.objects.filter(pk__in=[appt1.pk, appt2.pk]).update(created_at=old_time)

        count = expire_pending_appointments()
        assert count == 2

    def test_slot_available_after_cleanup_task(self, patient, doctor, schedule, pending_appointment):
        slots_before = get_available_slots(doctor, SATURDAY)
        assert SLOT_9_00 not in slots_before

        pending_appointment.created_at = timezone.now() - timedelta(minutes=16)
        pending_appointment.save(update_fields=['created_at'])
        expire_pending_appointments()

        slots_after = get_available_slots(doctor, SATURDAY)
        assert SLOT_9_00 in slots_after
