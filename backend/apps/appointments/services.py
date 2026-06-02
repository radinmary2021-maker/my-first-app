from datetime import date, datetime, timedelta

from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.doctors.models import Doctor
from apps.doctors.services import get_schedule_slots

from .models import Appointment, AppointmentStatus, ACTIVE_STATUSES

_STAFF_ROLES = ('doctor', 'secretary', 'admin')


class BookingError(Exception):
    pass


def book_appointment(patient: User, doctor: Doctor, appt_date: date, start_time) -> Appointment:
    """
    Reserves a slot for the patient. Raises BookingError on any invalid state.
    Uses select_for_update to prevent concurrent double-booking.
    """
    with transaction.atomic():
        # Lock competing rows for this doctor/date/slot before checking
        Appointment.objects.select_for_update().filter(
            doctor=doctor,
            date=appt_date,
            start_time=start_time,
            status__in=ACTIVE_STATUSES,
        )

        # اعتبارسنجی: اسلات در برنامه پزشک وجود دارد (بدون توجه به رزروها)
        schedule_slots = get_schedule_slots(doctor, appt_date)
        if start_time not in schedule_slots:
            raise BookingError('این اسلات در برنامه پزشک وجود ندارد.')

        # اعتبارسنجی: اسلات قبلاً رزرو نشده
        already_booked = Appointment.objects.filter(
            doctor=doctor,
            date=appt_date,
            start_time=start_time,
            status__in=ACTIVE_STATUSES,
        ).exists()

        if already_booked:
            raise BookingError('این اسلات قبلاً رزرو شده است.')

        duration = timedelta(minutes=doctor.visit_duration)
        end_time = (datetime.combine(appt_date, start_time) + duration).time()

        appointment = Appointment.objects.create(
            patient=patient,
            doctor=doctor,
            date=appt_date,
            start_time=start_time,
            end_time=end_time,
            status=AppointmentStatus.PENDING_PAYMENT,
        )

    from apps.notifications.tasks import send_booking_confirmation_sms
    send_booking_confirmation_sms.delay(appointment.pk)

    return appointment


def cancel_appointment(appointment: Appointment, user: User) -> Appointment:
    """
    Cancels an appointment.
    - Only the patient, secretary, or admin may cancel.
    - Only future appointments with an active status may be cancelled.
    """
    if appointment.patient_id != user.id and user.role not in ('secretary', 'admin'):
        raise BookingError('شما مجاز به لغو این نوبت نیستید.')

    if appointment.status not in ACTIVE_STATUSES:
        raise BookingError('فقط نوبت‌های فعال قابل لغو هستند.')

    if appointment.date < timezone.localdate():
        raise BookingError('نوبت‌های گذشته قابل لغو نیستند.')

    appointment.status = AppointmentStatus.CANCELLED
    appointment.save(update_fields=['status', 'updated_at'])

    from apps.notifications.tasks import send_cancellation_sms
    send_cancellation_sms.delay(appointment.pk)

    return appointment


def complete_appointment(appointment: Appointment, user: User) -> Appointment:
    """
    Marks a confirmed appointment as completed.
    Only doctor, secretary, and admin may call this.
    """
    if user.role not in _STAFF_ROLES:
        raise BookingError('شما مجاز به ثبت تکمیل نوبت نیستید.')

    if appointment.status != AppointmentStatus.CONFIRMED:
        raise BookingError('فقط نوبت‌های تأیید شده قابل تکمیل هستند.')

    appointment.status = AppointmentStatus.COMPLETED
    appointment.save(update_fields=['status', 'updated_at'])
    return appointment


def mark_as_no_show(appointment: Appointment, user: User) -> Appointment:
    """
    Marks a confirmed appointment as no-show.
    Only doctor, secretary, and admin may call this.
    """
    if user.role not in _STAFF_ROLES:
        raise BookingError('شما مجاز به ثبت غیبت نیستید.')

    if appointment.status != AppointmentStatus.CONFIRMED:
        raise BookingError('فقط نوبت‌های تأیید شده قابل ثبت غیبت هستند.')

    appointment.status = AppointmentStatus.NO_SHOW
    appointment.save(update_fields=['status', 'updated_at'])
    return appointment
