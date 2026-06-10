"""
Tests for appointment expiration logic.

After migration to multi-tenant architecture:
  - AppointmentStatus.PENDING_PAYMENT is gone; replaced by PENDING
  - get_available_slots(doctor, date) → AvailabilityService.get_slots_for_date(...)
  - book_appointment(patient, doctor, ...) → AppointmentService.create_appointment(...)
"""
import pytest
from datetime import timedelta
from unittest.mock import patch

from django.utils import timezone

from apps.appointments.models import Appointment, AppointmentStatus
from apps.appointments.services import AppointmentService
from apps.payments.services import PaymentError, _is_expired, initiate_payment
from apps.payments.tasks import expire_pending_appointments
from apps.scheduling.services import AvailabilityService

from .conftest import SATURDAY, SLOT_9_00


def _slot_times(business_id, service_id, provider_id):
    avail = AvailabilityService.get_slots_for_date(
        business_id=business_id,
        date=SATURDAY,
        service_id=service_id,
        provider_id=provider_id,
    )
    return {s.start for s in avail.slots}


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
    def test_slot_available_after_expiration_cancel(
        self, customer, provider, service, working_hours, pending_appointment
    ):
        # Slot is booked — not in available list
        slots_before = _slot_times(provider.business_id, service.id, provider.id)
        assert SLOT_9_00 not in slots_before

        # Expire the appointment
        pending_appointment.created_at = timezone.now() - timedelta(minutes=16)
        pending_appointment.save(update_fields=['created_at'])
        try:
            initiate_payment(pending_appointment, 'http://cb.test/')
        except PaymentError:
            pass

        # Slot must reopen
        slots_after = _slot_times(provider.business_id, service.id, provider.id)
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
        assert pending_appointment.status == AppointmentStatus.PENDING

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

    def test_task_cancels_multiple_expired(
        self, customer, provider, service, working_hours
    ):
        from datetime import time as dtime
        from apps.scheduling.models import WorkingHours as WH
        # Add a second slot at 09:30 to allow two bookings
        appt1 = AppointmentService.create_appointment(
            business_id=provider.business_id, provider=provider,
            date=SATURDAY, start_time=SLOT_9_00,
            service_id=service.id, customer=customer,
        )
        appt2 = AppointmentService.create_appointment(
            business_id=provider.business_id, provider=provider,
            date=SATURDAY, start_time=dtime(9, 30),
            service_id=service.id, customer=customer,
        )

        old_time = timezone.now() - timedelta(minutes=20)
        Appointment.objects.filter(pk__in=[appt1.pk, appt2.pk]).update(created_at=old_time)

        count = expire_pending_appointments()
        assert count == 2

    def test_slot_available_after_cleanup_task(
        self, customer, provider, service, working_hours, pending_appointment
    ):
        slots_before = _slot_times(provider.business_id, service.id, provider.id)
        assert SLOT_9_00 not in slots_before

        pending_appointment.created_at = timezone.now() - timedelta(minutes=16)
        pending_appointment.save(update_fields=['created_at'])
        expire_pending_appointments()

        slots_after = _slot_times(provider.business_id, service.id, provider.id)
        assert SLOT_9_00 in slots_after
