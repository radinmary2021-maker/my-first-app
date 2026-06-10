"""
Availability integration tests.

Verifies that booked/cancelled/completed slots appear correctly
in AvailabilityService output — the source of truth for the booking calendar.
"""

import pytest
from datetime import time

from apps.appointments.models import AppointmentStatus
from apps.appointments.services import AppointmentService
from apps.scheduling.services import AvailabilityService

from .conftest import SATURDAY, SLOT_9_00, SLOT_9_30, SLOT_10_00, SLOT_10_30, book


def _slot_times(business_id, service_id, provider_id, date=SATURDAY):
    avail = AvailabilityService.get_slots_for_date(
        business_id=business_id,
        date=date,
        service_id=service_id,
        provider_id=provider_id,
    )
    return {s.start for s in avail.slots}


@pytest.mark.django_db
class TestAvailabilityMatchesSchedule:

    def test_all_four_slots_available_when_none_booked(
        self, provider, service, working_hours
    ):
        slots = _slot_times(provider.business_id, service.id, provider.id)
        assert slots == {SLOT_9_00, SLOT_9_30, SLOT_10_00, SLOT_10_30}

    def test_no_slots_when_no_working_hours(self, provider, service):
        """No WorkingHours record → DayAvailability.no_working_hours = True."""
        avail = AvailabilityService.get_slots_for_date(
            business_id=provider.business_id,
            date=SATURDAY,
            service_id=service.id,
            provider_id=provider.id,
        )
        assert avail.no_working_hours is True
        assert avail.slots == []


@pytest.mark.django_db
class TestBookedSlotDisappears:

    def test_booked_slot_not_in_available(
        self, customer, provider, service, working_hours
    ):
        book(customer, provider, service, SLOT_9_00)
        slots = _slot_times(provider.business_id, service.id, provider.id)
        assert SLOT_9_00 not in slots

    def test_other_slots_still_available_after_booking(
        self, customer, provider, service, working_hours
    ):
        book(customer, provider, service, SLOT_9_00)
        slots = _slot_times(provider.business_id, service.id, provider.id)
        assert SLOT_9_30 in slots
        assert SLOT_10_00 in slots
        assert SLOT_10_30 in slots

    def test_confirmed_appointment_also_blocks_slot(
        self, customer, provider, service, working_hours
    ):
        appt = book(customer, provider, service, SLOT_9_00)
        appt.status = AppointmentStatus.CONFIRMED
        appt.save(update_fields=['status', 'updated_at'])

        # Must clear cache because the mutation bypassed the service layer
        AvailabilityService.invalidate_date(
            provider.business_id, SATURDAY, service.id, provider.id
        )
        slots = _slot_times(provider.business_id, service.id, provider.id)
        assert SLOT_9_00 not in slots


@pytest.mark.django_db
class TestCancelledSlotReopens:

    def test_slot_reappears_after_cancel(
        self, customer, provider, service, working_hours
    ):
        appt = book(customer, provider, service, SLOT_9_00)
        AppointmentService.cancel_appointment(appt, customer)
        # cancel_appointment calls invalidate_date internally
        slots = _slot_times(provider.business_id, service.id, provider.id)
        assert SLOT_9_00 in slots

    def test_completed_slot_reappears(
        self, customer, provider, provider_user, service, working_hours, staff_member
    ):
        appt = book(customer, provider, service, SLOT_9_00)
        appt.status = AppointmentStatus.CONFIRMED
        appt.save(update_fields=['status', 'updated_at'])
        AvailabilityService.invalidate_date(
            provider.business_id, SATURDAY, service.id, provider.id
        )

        AppointmentService.complete_appointment(appt, provider_user)

        # Completed slot is no longer active → should reopen
        AvailabilityService.invalidate_date(
            provider.business_id, SATURDAY, service.id, provider.id
        )
        slots = _slot_times(provider.business_id, service.id, provider.id)
        assert SLOT_9_00 in slots


@pytest.mark.django_db
class TestTimeOffBlocksSlots:

    def test_full_day_timeoff_returns_no_slots(
        self, provider, service, working_hours
    ):
        from apps.scheduling.models import TimeOff
        TimeOff.objects.create(
            business=provider.business,
            provider=provider,
            date=SATURDAY,
        )
        avail = AvailabilityService.get_slots_for_date(
            business_id=provider.business_id,
            date=SATURDAY,
            service_id=service.id,
            provider_id=provider.id,
        )
        assert avail.is_day_off is True
        assert avail.slots == []

    def test_partial_timeoff_blocks_overlapping_slots(
        self, provider, service, working_hours
    ):
        """TimeOff 09:00-10:00 should block the 09:00 and 09:30 slots."""
        from apps.scheduling.models import TimeOff
        TimeOff.objects.create(
            business=provider.business,
            provider=provider,
            date=SATURDAY,
            start_time=time(9, 0),
            end_time=time(10, 0),
        )
        slots = _slot_times(provider.business_id, service.id, provider.id)
        assert SLOT_9_00 not in slots
        assert SLOT_9_30 not in slots
        assert SLOT_10_00 in slots
        assert SLOT_10_30 in slots
