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


def get_schedule_slots(doctor: Doctor, target_date: date) -> list[time]:
    """
    Returns all slots from the doctor's schedule for a date (ignoring bookings).
    Used internally by booking service to validate a slot exists.
    """
    exception = ScheduleException.objects.filter(doctor=doctor, date=target_date).first()

    if exception:
        if exception.type == ExceptionType.HOLIDAY:
            return []
        return _generate_slots(exception.start_time, exception.end_time, doctor.visit_duration)

    weekday = _date_to_weekday(target_date)
    schedule = doctor.schedules.filter(weekday=weekday, is_active=True).first()
    if not schedule:
        return []
    return _generate_slots(schedule.start_time, schedule.end_time, doctor.visit_duration)


def get_available_slots(doctor: Doctor, target_date: date) -> list[time]:
    """
    Returns slots from the doctor's schedule minus already-booked active slots.
    Used by the public API endpoint.
    """
    all_slots = get_schedule_slots(doctor, target_date)
    if not all_slots:
        return []
    return _exclude_booked_slots(doctor, target_date, all_slots)


def _exclude_booked_slots(doctor: Doctor, target_date: date, slots: list[time]) -> list[time]:
    # import داخلی برای جلوگیری از circular import با appointments app
    from apps.appointments.models import ACTIVE_STATUSES, Appointment

    booked = set(
        Appointment.objects.filter(
            doctor=doctor,
            date=target_date,
            status__in=ACTIVE_STATUSES,
        ).values_list('start_time', flat=True)
    )
    return [s for s in slots if s not in booked]
