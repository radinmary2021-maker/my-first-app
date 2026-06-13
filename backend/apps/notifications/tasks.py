import logging

from celery import shared_task
from django.conf import settings

from .kavenegar import KavenegarClient, KavenegarError
from .models import SMSLog, SMSStatus

logger = logging.getLogger(__name__)

_RETRY_KWARGS = dict(
    bind=True,
    autoretry_for=(KavenegarError,),
    retry_backoff=True,
    max_retries=3,
)


def _send(phone: str, message: str) -> None:
    """Calls Kavenegar. Raises KavenegarError on failure."""
    KavenegarClient().send_sms(phone, message)


def _log_failure(phone: str, message: str) -> None:
    SMSLog.objects.create(phone=phone, message=message, status=SMSStatus.FAILED)


def _log_success(phone: str, message: str) -> None:
    SMSLog.objects.create(phone=phone, message=message, status=SMSStatus.SENT)


@shared_task(name='notifications.send_otp_sms', **_RETRY_KWARGS)
def send_otp_sms(self, phone: str, code: str) -> None:
    message = f'کد تأیید شما: {code}'
    if not settings.KAVENEGAR_API_KEY:
        if settings.DEBUG:
            logger.info(f"Development OTP for {phone}: {code}")
        # TODO: when DEBUG=False and no KAVENEGAR_API_KEY, OTP is silently dropped — add a warning log here
        _log_success(phone, message)
        return
    try:
        _send(phone, message)
        _log_success(phone, message)
    except KavenegarError:
        if self.request.retries >= self.max_retries:
            _log_failure(phone, message)
        raise


@shared_task(name='notifications.send_booking_confirmation_sms', **_RETRY_KWARGS)
def send_booking_confirmation_sms(self, appointment_id: int) -> None:
    from apps.appointments.models import Appointment

    appointment = Appointment.objects.select_related(
        'provider', 'customer'
    ).get(pk=appointment_id)

    message = (
        f'نوبت شما با {appointment.provider.business_name} '
        f'در تاریخ {appointment.date} ساعت {appointment.start_time.strftime("%H:%M")} '
        f'با کد پیگیری {appointment.tracking_code} ثبت شد.'
    )
    phone = appointment.contact_phone  # handles guest + authenticated customers
    if not phone:
        return  # no phone available — skip silently
    try:
        _send(phone, message)
        _log_success(phone, message)
    except KavenegarError:
        if self.request.retries >= self.max_retries:
            _log_failure(phone, message)
        raise


@shared_task(name='notifications.send_appointment_reminders')
def send_appointment_reminders() -> None:
    from datetime import date, timedelta
    from apps.appointments.models import Appointment, AppointmentStatus

    tomorrow = date.today() + timedelta(days=1)
    appointments = (
        Appointment.objects
        .filter(date=tomorrow, status=AppointmentStatus.CONFIRMED)
        .select_related('provider', 'customer')
    )
    for appointment in appointments:
        phone = appointment.contact_phone
        if not phone:
            continue  # no phone on record — skip
        message = (
            f'یادآوری: نوبت شما با {appointment.provider.business_name} '
            f'فردا ساعت {appointment.start_time.strftime("%H:%M")} است. '
            f'کد پیگیری: {appointment.tracking_code}'
        )
        try:
            _send(phone, message)
            _log_success(phone, message)
        except KavenegarError:
            _log_failure(phone, message)


@shared_task(name='notifications.send_cancellation_sms', **_RETRY_KWARGS)
def send_cancellation_sms(self, appointment_id: int) -> None:
    from apps.appointments.models import Appointment

    appointment = Appointment.objects.select_related(
        'provider', 'customer'
    ).get(pk=appointment_id)

    message = (
        f'نوبت شما با {appointment.provider.business_name} '
        f'در تاریخ {appointment.date} ساعت {appointment.start_time.strftime("%H:%M")} '
        f'لغو شد.'
    )
    phone = appointment.contact_phone
    if not phone:
        return  # no phone available — skip silently
    try:
        _send(phone, message)
        _log_success(phone, message)
    except KavenegarError:
        if self.request.retries >= self.max_retries:
            _log_failure(phone, message)
        raise
