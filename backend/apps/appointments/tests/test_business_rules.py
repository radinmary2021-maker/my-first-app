"""
Business rule enforcement tests.

Covers edge cases that protect data consistency:
  - Past appointments cannot be cancelled
  - Status transition rules (complete/no-show require CONFIRMED)
  - Cross-business isolation (provider from biz A cannot act on biz B appointments)
"""

import pytest
from datetime import date, time

from apps.appointments.models import Appointment, AppointmentStatus
from apps.appointments.services import AppointmentService, BookingError
from apps.businesses.models import Business, BusinessCategory, BusinessMember, MemberRole
from apps.providers.models import Provider

from .conftest import SATURDAY, SLOT_9_00, book


# ──────────────────────────────────────────────────────────────────────────────
# Past appointment cancellation guard
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestCancelPastAppointment:

    def _make_past_appointment(self, customer, provider, service, working_hours):
        appt = book(customer, provider, service)
        # Force-push the date into the past (bypasses the service layer date check)
        appt.date = date(2020, 1, 4)
        appt.save(update_fields=['date'])
        return appt

    def test_past_pending_appointment_cannot_be_cancelled(
        self, customer, provider, service, working_hours
    ):
        appt = self._make_past_appointment(customer, provider, service, working_hours)
        with pytest.raises(BookingError, match='گذشته'):
            AppointmentService.cancel_appointment(appt, customer)

    def test_past_confirmed_appointment_cannot_be_cancelled(
        self, customer, provider, service, working_hours
    ):
        appt = self._make_past_appointment(customer, provider, service, working_hours)
        appt.status = AppointmentStatus.CONFIRMED
        appt.save(update_fields=['status'])
        with pytest.raises(BookingError, match='گذشته'):
            AppointmentService.cancel_appointment(appt, customer)

    def test_status_check_fires_before_date_check(
        self, customer, provider, service, working_hours
    ):
        """
        COMPLETED appointments should raise 'فعال' (not 'گذشته')
        because the active-status check must run first.
        """
        appt = self._make_past_appointment(customer, provider, service, working_hours)
        appt.status = AppointmentStatus.COMPLETED
        appt.save(update_fields=['status'])
        with pytest.raises(BookingError, match='فعال'):
            AppointmentService.cancel_appointment(appt, customer)

    def test_future_appointment_can_be_cancelled(
        self, customer, provider, service, working_hours
    ):
        appt = book(customer, provider, service)
        result = AppointmentService.cancel_appointment(appt, customer)
        assert result.status == AppointmentStatus.CANCELLED


# ──────────────────────────────────────────────────────────────────────────────
# Status transition rules
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestStatusTransitions:

    def test_cannot_complete_pending_appointment(
        self, customer, provider, provider_user, service, working_hours, staff_member
    ):
        appt = book(customer, provider, service)
        assert appt.status == AppointmentStatus.PENDING
        with pytest.raises(BookingError, match='تأیید شده'):
            AppointmentService.complete_appointment(appt, provider_user)

    def test_cannot_no_show_pending_appointment(
        self, customer, provider, provider_user, service, working_hours, staff_member
    ):
        appt = book(customer, provider, service)
        with pytest.raises(BookingError, match='تأیید شده'):
            AppointmentService.mark_no_show(appt, provider_user)

    def test_cannot_no_show_cancelled_appointment(
        self, customer, provider, provider_user, service, working_hours, staff_member
    ):
        appt = book(customer, provider, service)
        AppointmentService.cancel_appointment(appt, customer)
        with pytest.raises(BookingError):
            AppointmentService.mark_no_show(appt, provider_user)

    def test_confirm_then_complete(
        self, customer, provider, provider_user, service, working_hours, staff_member
    ):
        appt = book(customer, provider, service)
        AppointmentService.confirm_appointment(appt, provider_user)
        assert appt.status == AppointmentStatus.CONFIRMED
        AppointmentService.complete_appointment(appt, provider_user)
        appt.refresh_from_db()
        assert appt.status == AppointmentStatus.COMPLETED


# ──────────────────────────────────────────────────────────────────────────────
# Cross-business isolation
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestCrossBusinessIsolation:

    @pytest.fixture
    def second_business(self, db):
        """A completely separate business with its own owner."""
        owner2 = from_accounts = __import__(
            'apps.accounts.models', fromlist=['User']
        ).User.objects.create_user(phone='09130000010', role='owner')
        biz2 = Business.objects.create(
            owner=owner2, name='کسب‌وکار دوم', slug='biz-two',
            category=BusinessCategory.LEGAL,
        )
        BusinessMember.objects.create(business=biz2, user=owner2, role=MemberRole.OWNER)
        return biz2, owner2

    def test_owner_of_other_business_cannot_cancel(
        self, customer, provider, service, working_hours, second_business
    ):
        appt = book(customer, provider, service)
        _, owner2 = second_business
        with pytest.raises(BookingError, match='مجاز'):
            AppointmentService.cancel_appointment(appt, owner2)

    def test_owner_of_other_business_cannot_complete(
        self, customer, provider, service, working_hours, second_business
    ):
        appt = book(customer, provider, service)
        appt.status = AppointmentStatus.CONFIRMED
        appt.save(update_fields=['status', 'updated_at'])
        _, owner2 = second_business
        with pytest.raises(BookingError, match='مجاز'):
            AppointmentService.complete_appointment(appt, owner2)


# ──────────────────────────────────────────────────────────────────────────────
# Data consistency after status changes
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestDataConsistency:

    def test_booking_creates_exactly_one_row(
        self, customer, provider, service, working_hours
    ):
        book(customer, provider, service, SLOT_9_00)
        assert Appointment.objects.filter(
            provider=provider, date=SATURDAY, start_time=SLOT_9_00
        ).count() == 1

    def test_cancel_does_not_delete_row(
        self, customer, provider, service, working_hours
    ):
        appt = book(customer, provider, service)
        AppointmentService.cancel_appointment(appt, customer)
        # Row must still exist (soft cancel, not delete)
        assert Appointment.objects.filter(pk=appt.pk).exists()

    def test_tracking_code_immutable_after_cancel(
        self, customer, provider, service, working_hours
    ):
        appt = book(customer, provider, service)
        original_code = appt.tracking_code
        AppointmentService.cancel_appointment(appt, customer)
        appt.refresh_from_db()
        assert appt.tracking_code == original_code

    def test_business_id_always_set_on_appointment(
        self, customer, provider, service, working_hours
    ):
        appt = book(customer, provider, service)
        assert appt.business_id == provider.business_id

    def test_customer_phone_denormalised_at_booking(
        self, customer, provider, service, working_hours
    ):
        """customer_phone must be captured at booking time."""
        appt = book(customer, provider, service)
        assert appt.customer_phone == customer.phone
        # Changing user's phone after the fact must NOT change the appointment
        customer.phone = '09199999999'
        customer.save(update_fields=['phone'])
        appt.refresh_from_db()
        assert appt.customer_phone != '09199999999'
