from datetime import date, datetime, time, timedelta

from .models import Doctor, ExceptionType, ScheduleException, Weekday


# weekday() در Python: 0=Monday. در سیستم ما: 0=Saturday.
# تبدیل: Saturday=5, Sunday=6, Monday=0, ..., Friday=4
_PYTHON_TO_SHAMSI = {5: 0, 6: 1, 0: 2, 1: 3, 2: 4, 3: 5, 4: 6}


def _date_to_weekday(d: date) -> int:
    return _PYTHON_TO_SHAMSI[d.weekday()]


def _generate_slots(start: time, end: time, duration_minutes: int) -> list[time]:
    slots = []
    current = datetime.combine(date.today(), start)
    end_dt = datetime.combine(date.today(), end)
    step = timedelta(minutes=duration_minutes)
    while current + step <= end_dt:
        slots.append(current.time())
        current += step
    return slots


def get_available_slots(doctor: Doctor, target_date: date) -> list[time]:
    """
    Returns list of available start times for a doctor on a given date.
    Checks ScheduleException first, then falls back to WeeklySchedule.
    Does NOT check Appointments (that is Sprint 3's responsibility).
    """
    # بررسی Exception
    exception = ScheduleException.objects.filter(
        doctor=doctor, date=target_date
    ).first()

    if exception:
        if exception.type == ExceptionType.HOLIDAY:
            return []
        # CUSTOM_HOURS: جایگزین برنامه هفتگی
        return _generate_slots(exception.start_time, exception.end_time, doctor.visit_duration)

    # بررسی برنامه هفتگی
    weekday = _date_to_weekday(target_date)
    schedule = doctor.schedules.filter(weekday=weekday, is_active=True).first()

    if not schedule:
        return []

    return _generate_slots(schedule.start_time, schedule.end_time, doctor.visit_duration)
