import pytest
from django.core.exceptions import ValidationError
from datetime import time

from apps.doctors.models import Doctor, ExceptionType, ScheduleException, WeeklySchedule


@pytest.mark.django_db
class TestWeeklyScheduleValidation:
    def test_valid_schedule_passes(self, doctor):
        schedule = WeeklySchedule(
            doctor=doctor, weekday=0,
            start_time=time(9, 0), end_time=time(13, 0),
        )
        schedule.clean()  # should not raise

    def test_start_equals_end_raises(self, doctor):
        schedule = WeeklySchedule(
            doctor=doctor, weekday=0,
            start_time=time(9, 0), end_time=time(9, 0),
        )
        with pytest.raises(ValidationError, match='start_time'):
            schedule.clean()

    def test_start_after_end_raises(self, doctor):
        schedule = WeeklySchedule(
            doctor=doctor, weekday=0,
            start_time=time(14, 0), end_time=time(9, 0),
        )
        with pytest.raises(ValidationError):
            schedule.clean()

    def test_duration_less_than_visit_duration_raises(self, doctor):
        # visit_duration=20, but window is only 15 min
        schedule = WeeklySchedule(
            doctor=doctor, weekday=0,
            start_time=time(9, 0), end_time=time(9, 15),
        )
        with pytest.raises(ValidationError, match='مدت ویزیت'):
            schedule.clean()

    def test_duration_exactly_visit_duration_passes(self, doctor):
        schedule = WeeklySchedule(
            doctor=doctor, weekday=0,
            start_time=time(9, 0), end_time=time(9, 20),
        )
        schedule.clean()  # should not raise


@pytest.mark.django_db
class TestScheduleExceptionValidation:
    def test_holiday_without_times_passes(self, doctor):
        exc = ScheduleException(doctor=doctor, date='2024-01-01', type='HOLIDAY')
        exc.clean()

    def test_holiday_with_start_time_raises(self, doctor):
        exc = ScheduleException(
            doctor=doctor, date='2024-01-01', type='HOLIDAY',
            start_time=time(9, 0),
        )
        with pytest.raises(ValidationError, match='HOLIDAY'):
            exc.clean()

    def test_holiday_with_end_time_raises(self, doctor):
        exc = ScheduleException(
            doctor=doctor, date='2024-01-01', type='HOLIDAY',
            end_time=time(13, 0),
        )
        with pytest.raises(ValidationError):
            exc.clean()

    def test_custom_hours_valid_passes(self, doctor):
        exc = ScheduleException(
            doctor=doctor, date='2024-01-01', type='CUSTOM_HOURS',
            start_time=time(9, 0), end_time=time(12, 0),
        )
        exc.clean()

    def test_custom_hours_without_times_raises(self, doctor):
        exc = ScheduleException(doctor=doctor, date='2024-01-01', type='CUSTOM_HOURS')
        with pytest.raises(ValidationError, match='CUSTOM_HOURS'):
            exc.clean()

    def test_custom_hours_start_after_end_raises(self, doctor):
        exc = ScheduleException(
            doctor=doctor, date='2024-01-01', type='CUSTOM_HOURS',
            start_time=time(14, 0), end_time=time(9, 0),
        )
        with pytest.raises(ValidationError):
            exc.clean()

    def test_custom_hours_start_equals_end_raises(self, doctor):
        exc = ScheduleException(
            doctor=doctor, date='2024-01-01', type='CUSTOM_HOURS',
            start_time=time(9, 0), end_time=time(9, 0),
        )
        with pytest.raises(ValidationError):
            exc.clean()
