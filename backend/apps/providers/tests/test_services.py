"""
Provider service tests.

Old tests covered get_available_slots/date_to_weekday from apps.doctors.services.
Now we test the scheduling engine via the providers.services shim and directly.
"""
import pytest
from datetime import date, time

from apps.providers.services import get_available_slots
from apps.scheduling.services import AvailabilityService
from apps.scheduling.models import WorkingHours


# ── Iranian weekday mapping ───────────────────────────────────────────────────

class TestIranianWeekdayMapping:
    """Verify the Python→Iranian weekday mapping is correct."""

    def test_saturday_is_0(self):
        # 2024-01-06 is a Saturday (Python weekday 5 → Iranian 0)
        from apps.scheduling.models import PYTHON_WEEKDAY_TO_IRANIAN
        assert PYTHON_WEEKDAY_TO_IRANIAN[5] == 0

    def test_friday_is_6(self):
        # Python weekday 4 = Friday → Iranian 6
        from apps.scheduling.models import PYTHON_WEEKDAY_TO_IRANIAN
        assert PYTHON_WEEKDAY_TO_IRANIAN[4] == 6

    def test_monday_is_2(self):
        # Python weekday 0 = Monday → Iranian 2
        from apps.scheduling.models import PYTHON_WEEKDAY_TO_IRANIAN
        assert PYTHON_WEEKDAY_TO_IRANIAN[0] == 2


# ── Provider shim: get_available_slots ────────────────────────────────────────

@pytest.mark.django_db
class TestGetAvailableSlots:
    """Tests for the providers.services.get_available_slots shim."""

    def test_no_service_returns_empty(self, provider):
        """Provider has no service defined → shim returns []."""
        result = get_available_slots(provider, date(2026, 12, 12))
        assert result == []

    def test_no_working_hours_returns_empty(self, provider, service):
        """Service exists but no working hours → no slots."""
        result = get_available_slots(provider, date(2026, 12, 12))
        assert result == []

    def test_returns_slots_for_scheduled_day(self, provider, service, working_hours):
        """Saturday schedule → returns slot start times."""
        slots = get_available_slots(provider, date(2026, 12, 12))  # Saturday
        assert time(9, 0) in slots
        assert time(9, 30) in slots

    def test_returns_empty_for_unscheduled_day(self, provider, service, working_hours):
        """No schedule on Sunday → empty."""
        sunday = date(2026, 12, 13)  # Sunday after the Saturday
        result = get_available_slots(provider, sunday)
        assert result == []

    def test_inactive_working_hours_returns_empty(self, provider, service, working_hours):
        working_hours.is_active = False
        working_hours.save()
        result = get_available_slots(provider, date(2026, 12, 12))
        assert result == []


# ── AvailabilityService directly ─────────────────────────────────────────────

@pytest.mark.django_db
class TestAvailabilityServiceSlotCount:
    """Grid-based slot generation: step = duration + buffer."""

    def test_four_slots_in_two_hour_window(self, business, provider, service, working_hours):
        # 09:00–11:00, duration=30, buffer=0 → slots at 09:00, 09:30, 10:00, 10:30
        avail = AvailabilityService.get_slots_for_date(
            business_id=business.id,
            date=date(2026, 12, 12),
            service_id=service.id,
            provider_id=provider.id,
        )
        assert len(avail.slots) == 4
        assert avail.slots[0].start == time(9, 0)
        assert avail.slots[-1].start == time(10, 30)

    def test_no_slots_for_different_weekday(self, business, provider, service, working_hours):
        # Working hours are only on Saturday; Sunday should have none
        avail = AvailabilityService.get_slots_for_date(
            business_id=business.id,
            date=date(2026, 12, 13),   # Sunday
            service_id=service.id,
            provider_id=provider.id,
        )
        assert avail.no_working_hours is True
        assert len(avail.slots) == 0

    def test_buffer_reduces_slot_count(self, business, provider):
        """With buffer=10 and duration=30, step=40 → fewer slots in same window."""
        from apps.scheduling.models import Service as Svc
        buffered_service = Svc.objects.create(
            business=business,
            name='خدمت با بافر',
            duration_minutes=30,
            buffer_minutes=10,
            price=0,
        )
        WorkingHours.objects.create(
            business=business, provider=provider,
            weekday=0, start_time=time(9, 0), end_time=time(11, 0), is_active=True,
        )
        avail = AvailabilityService.get_slots_for_date(
            business_id=business.id,
            date=date(2026, 12, 12),
            service_id=buffered_service.id,
            provider_id=provider.id,
        )
        # step=40 min: 09:00, 09:40, 10:20 → 3 slots in 2-hour window
        assert len(avail.slots) == 3
