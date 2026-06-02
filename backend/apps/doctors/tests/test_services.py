import pytest
from datetime import date, time

from apps.doctors.models import ScheduleException, WeeklySchedule
from apps.doctors.services import get_available_slots, _date_to_weekday


@pytest.mark.django_db
class TestDateToWeekday:
    def test_saturday(self):
        # 2024-01-06 is Saturday
        assert _date_to_weekday(date(2024, 1, 6)) == 0

    def test_sunday(self):
        assert _date_to_weekday(date(2024, 1, 7)) == 1

    def test_friday(self):
        # 2024-01-12 is Friday
        assert _date_to_weekday(date(2024, 1, 12)) == 6


@pytest.mark.django_db
class TestGetAvailableSlots:
    def _make_schedule(self, doctor, weekday, start, end):
        return WeeklySchedule.objects.create(
            doctor=doctor, weekday=weekday,
            start_time=start, end_time=end,
        )

    def test_no_schedule_returns_empty(self, doctor):
        # Saturday با هیچ برنامه‌ای
        result = get_available_slots(doctor, date(2024, 1, 6))
        assert result == []

    def test_basic_slot_generation(self, doctor):
        # 9:00 تا 10:00 با ویزیت 20 دقیقه → 3 اسلات
        self._make_schedule(doctor, weekday=0, start=time(9, 0), end=time(10, 0))
        slots = get_available_slots(doctor, date(2024, 1, 6))  # Saturday
        assert slots == [time(9, 0), time(9, 20), time(9, 40)]

    def test_exact_fit_one_slot(self, doctor):
        self._make_schedule(doctor, weekday=0, start=time(9, 0), end=time(9, 20))
        slots = get_available_slots(doctor, date(2024, 1, 6))
        assert slots == [time(9, 0)]

    def test_partial_slot_not_included(self, doctor):
        # 9:00 تا 9:30 با ویزیت 20 دقیقه → فقط 9:00 (9:20→9:40 جا ندارد)
        self._make_schedule(doctor, weekday=0, start=time(9, 0), end=time(9, 30))
        slots = get_available_slots(doctor, date(2024, 1, 6))
        assert slots == [time(9, 0)]

    def test_inactive_schedule_returns_empty(self, doctor):
        self._make_schedule(doctor, weekday=0, start=time(9, 0), end=time(13, 0))
        WeeklySchedule.objects.filter(doctor=doctor).update(is_active=False)
        slots = get_available_slots(doctor, date(2024, 1, 6))
        assert slots == []

    def test_holiday_exception_returns_empty(self, doctor):
        self._make_schedule(doctor, weekday=0, start=time(9, 0), end=time(13, 0))
        ScheduleException.objects.create(
            doctor=doctor, date=date(2024, 1, 6), type='HOLIDAY'
        )
        slots = get_available_slots(doctor, date(2024, 1, 6))
        assert slots == []

    def test_custom_hours_overrides_weekly_schedule(self, doctor):
        # برنامه هفتگی: 9-13، Exception: 10-11
        self._make_schedule(doctor, weekday=0, start=time(9, 0), end=time(13, 0))
        ScheduleException.objects.create(
            doctor=doctor, date=date(2024, 1, 6), type='CUSTOM_HOURS',
            start_time=time(10, 0), end_time=time(11, 0),
        )
        slots = get_available_slots(doctor, date(2024, 1, 6))
        assert slots == [time(10, 0), time(10, 20), time(10, 40)]

    def test_custom_hours_without_weekly_schedule(self, doctor):
        ScheduleException.objects.create(
            doctor=doctor, date=date(2024, 1, 6), type='CUSTOM_HOURS',
            start_time=time(14, 0), end_time=time(15, 0),
        )
        slots = get_available_slots(doctor, date(2024, 1, 6))
        assert slots == [time(14, 0), time(14, 20), time(14, 40)]

    def test_different_weekday_has_no_slots(self, doctor):
        # برنامه فقط برای شنبه (0)، بررسی یکشنبه (1)
        self._make_schedule(doctor, weekday=0, start=time(9, 0), end=time(13, 0))
        slots = get_available_slots(doctor, date(2024, 1, 7))  # Sunday
        assert slots == []

    def test_slots_count_for_four_hour_window(self, doctor):
        # 9:00 تا 13:00 با ویزیت 20 دقیقه → 12 اسلات
        self._make_schedule(doctor, weekday=0, start=time(9, 0), end=time(13, 0))
        slots = get_available_slots(doctor, date(2024, 1, 6))
        assert len(slots) == 12

    def test_slot_start_times_are_correct(self, doctor):
        self._make_schedule(doctor, weekday=0, start=time(9, 0), end=time(10, 0))
        slots = get_available_slots(doctor, date(2024, 1, 6))
        assert slots[0] == time(9, 0)
        assert slots[1] == time(9, 20)
        assert slots[2] == time(9, 40)
