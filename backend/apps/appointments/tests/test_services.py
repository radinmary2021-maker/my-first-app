"""
Unit tests for AppointmentService.

Tests the service layer in isolation — no HTTP, no views.
"""

import pytest
from datetime import time

from apps.appointments.models import Appointment, AppointmentStatus, ACTIVE_STATUSES
from apps.appointments.services import AppointmentService, BookingError

from .conftest import SATURDAY, SLOT_9_00, SLOT_9_30, SLOT_10_00, book


# ──────────────────────────────────────────────────────────────────────────────
# create_appointment
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestCreateAppointment:

    def test_creates_appointment_with_correct_fields(
        self, customer, provider, service, working_hours
    ):
        appt = book(customer, provider, service)

        assert appt.pk is not None
        assert appt.customer == customer
        assert appt.provider == provider
        assert appt.business == provider.business
        assert appt.service == service
        assert appt.date == SATURDAY
        assert appt.start_time == SLOT_9_00
        assert appt.end_time == time(9, 30)           # 09:00 + 30 min
        assert appt.status == AppointmentStatus.PENDING
        assert appt.total_price == service.price

    def test_tracking_code_is_generated(self, customer, provider, service, working_hours):
        appt = book(customer, provider, service)
        assert appt.tracking_code.startswith('APT-')
        assert len(appt.tracking_code) == 10

    def test_tracking_codes_are_unique(self, customer, customer2, provider, service, working_hours):
        a1 = book(customer,  provider, service, SLOT_9_00)
        a2 = book(customer2, provider, service, SLOT_9_30)
        assert a1.tracking_code != a2.tracking_code

    def test_double_booking_same_slot_raises(
        self, customer, customer2, provider, service, working_hours
    ):
        book(customer, provider, service, SLOT_9_00)
        with pytest.raises(BookingError, match='رزرو شده'):
            book(customer2, provider, service, SLOT_9_00)

    def test_different_slots_can_be_booked(
        self, customer, customer2, provider, service, working_hours
    ):
        a1 = book(customer,  provider, service, SLOT_9_00)
        a2 = book(customer2, provider, service, SLOT_9_30)
        assert a1.pk != a2.pk

    def test_slot_outside_working_hours_raises(
        self, customer, provider, service, working_hours
    ):
        with pytest.raises(BookingError):
            book(customer, provider, service, time(8, 0))  # before 09:00

    def test_slot_after_closing_raises(
        self, customer, provider, service, working_hours
    ):
        with pytest.raises(BookingError):
            book(customer, provider, service, time(11, 30))  # after 11:00

    def test_cancelled_slot_can_be_rebooked(
        self, customer, customer2, provider, service, working_hours
    ):
        appt = book(customer, provider, service, SLOT_9_00)
        AppointmentService.cancel_appointment(appt, customer)
        new_appt = book(customer2, provider, service, SLOT_9_00)
        assert new_appt.pk is not None
        assert new_appt.status == AppointmentStatus.PENDING

    def test_denormalised_customer_phone_populated(
        self, customer, provider, service, working_hours
    ):
        """customer_phone mirrors user.phone at creation time."""
        appt = book(customer, provider, service)
        assert appt.customer_phone == customer.phone

    def test_appointment_persists_to_db(
        self, customer, provider, service, working_hours
    ):
        appt = book(customer, provider, service)
        from_db = Appointment.objects.get(pk=appt.pk)
        assert from_db.status == AppointmentStatus.PENDING


# ──────────────────────────────────────────────────────────────────────────────
# cancel_appointment
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestCancelAppointment:

    def test_customer_cancels_own_appointment(
        self, customer, provider, service, working_hours
    ):
        appt = book(customer, provider, service)
        result = AppointmentService.cancel_appointment(appt, customer)
        assert result.status == AppointmentStatus.CANCELLED

    def test_cancelled_by_is_recorded(
        self, customer, provider, service, working_hours
    ):
        appt = book(customer, provider, service)
        AppointmentService.cancel_appointment(appt, customer)
        appt.refresh_from_db()
        assert appt.cancelled_by == customer

    def test_status_persists_to_db(
        self, customer, provider, service, working_hours
    ):
        appt = book(customer, provider, service)
        AppointmentService.cancel_appointment(appt, customer)
        appt.refresh_from_db()
        assert appt.status == AppointmentStatus.CANCELLED

    def test_stranger_cannot_cancel(
        self, customer, customer2, provider, service, working_hours
    ):
        appt = book(customer, provider, service)
        with pytest.raises(BookingError, match='مجاز'):
            AppointmentService.cancel_appointment(appt, customer2)

    def test_staff_member_can_cancel(
        self, customer, provider, provider_user, service, working_hours, staff_member
    ):
        appt = book(customer, provider, service)
        result = AppointmentService.cancel_appointment(appt, provider_user)
        assert result.status == AppointmentStatus.CANCELLED

    def test_owner_can_cancel(
        self, customer, provider, owner_user, service, working_hours
    ):
        appt = book(customer, provider, service)
        result = AppointmentService.cancel_appointment(appt, owner_user)
        assert result.status == AppointmentStatus.CANCELLED

    def test_admin_can_cancel(
        self, customer, provider, admin_user, service, working_hours
    ):
        appt = book(customer, provider, service)
        result = AppointmentService.cancel_appointment(appt, admin_user)
        assert result.status == AppointmentStatus.CANCELLED

    def test_already_cancelled_raises(
        self, customer, provider, service, working_hours
    ):
        appt = book(customer, provider, service)
        AppointmentService.cancel_appointment(appt, customer)
        with pytest.raises(BookingError, match='فعال'):
            AppointmentService.cancel_appointment(appt, customer)

    def test_completed_appointment_cannot_be_cancelled(
        self, customer, provider, provider_user, service, working_hours, staff_member
    ):
        appt = book(customer, provider, service)
        appt.status = AppointmentStatus.CONFIRMED
        appt.save(update_fields=['status', 'updated_at'])
        AppointmentService.complete_appointment(appt, provider_user)
        with pytest.raises(BookingError, match='فعال'):
            AppointmentService.cancel_appointment(appt, customer)


# ──────────────────────────────────────────────────────────────────────────────
# complete_appointment
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestCompleteAppointment:

    def _confirmed(self, customer, provider, service, working_hours):
        appt = book(customer, provider, service)
        appt.status = AppointmentStatus.CONFIRMED
        appt.save(update_fields=['status', 'updated_at'])
        return appt

    def test_staff_can_complete(
        self, customer, provider, provider_user, service, working_hours, staff_member
    ):
        appt = self._confirmed(customer, provider, service, working_hours)
        result = AppointmentService.complete_appointment(appt, provider_user)
        assert result.status == AppointmentStatus.COMPLETED

    def test_owner_can_complete(
        self, customer, provider, owner_user, service, working_hours
    ):
        appt = self._confirmed(customer, provider, service, working_hours)
        result = AppointmentService.complete_appointment(appt, owner_user)
        assert result.status == AppointmentStatus.COMPLETED

    def test_admin_can_complete(
        self, customer, provider, admin_user, service, working_hours
    ):
        appt = self._confirmed(customer, provider, service, working_hours)
        result = AppointmentService.complete_appointment(appt, admin_user)
        assert result.status == AppointmentStatus.COMPLETED

    def test_customer_cannot_complete(
        self, customer, provider, service, working_hours
    ):
        appt = self._confirmed(customer, provider, service, working_hours)
        with pytest.raises(BookingError, match='مجاز'):
            AppointmentService.complete_appointment(appt, customer)

    def test_pending_cannot_be_completed(
        self, customer, provider, provider_user, service, working_hours, staff_member
    ):
        appt = book(customer, provider, service)  # still PENDING
        with pytest.raises(BookingError, match='تأیید شده'):
            AppointmentService.complete_appointment(appt, provider_user)

    def test_complete_persists_to_db(
        self, customer, provider, provider_user, service, working_hours, staff_member
    ):
        appt = self._confirmed(customer, provider, service, working_hours)
        AppointmentService.complete_appointment(appt, provider_user)
        appt.refresh_from_db()
        assert appt.status == AppointmentStatus.COMPLETED


# ──────────────────────────────────────────────────────────────────────────────
# mark_no_show
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestMarkNoShow:

    def _confirmed(self, customer, provider, service, working_hours):
        appt = book(customer, provider, service)
        appt.status = AppointmentStatus.CONFIRMED
        appt.save(update_fields=['status', 'updated_at'])
        return appt

    def test_staff_can_mark_no_show(
        self, customer, provider, provider_user, service, working_hours, staff_member
    ):
        appt = self._confirmed(customer, provider, service, working_hours)
        result = AppointmentService.mark_no_show(appt, provider_user)
        assert result.status == AppointmentStatus.NO_SHOW

    def test_customer_cannot_mark_no_show(
        self, customer, provider, service, working_hours
    ):
        appt = self._confirmed(customer, provider, service, working_hours)
        with pytest.raises(BookingError, match='مجاز'):
            AppointmentService.mark_no_show(appt, customer)

    def test_pending_appointment_cannot_be_no_show(
        self, customer, provider, provider_user, service, working_hours, staff_member
    ):
        appt = book(customer, provider, service)
        with pytest.raises(BookingError, match='تأیید شده'):
            AppointmentService.mark_no_show(appt, provider_user)

    def test_no_show_persists_to_db(
        self, customer, provider, provider_user, service, working_hours, staff_member
    ):
        appt = self._confirmed(customer, provider, service, working_hours)
        AppointmentService.mark_no_show(appt, provider_user)
        appt.refresh_from_db()
        assert appt.status == AppointmentStatus.NO_SHOW
