from celery import shared_task

from .kavenegar import KavenegarClient, KavenegarError
from .models import SMSLog, SMSStatus

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
        'doctor__user', 'patient'
    ).get(pk=appointment_id)

    message = (
        f'نوبت شما با دکتر {appointment.doctor.user.full_name} '
        f'در تاریخ {appointment.date} ساعت {appointment.start_time.strftime("%H:%M")} '
        f'با کد پیگیری {appointment.tracking_code} ثبت شد.'
    )
    phone = appointment.patient.phone
    try:
        _send(phone, message)
        _log_success(phone, message)
    except KavenegarError:
        if self.request.retries >= self.max_retries:
            _log_failure(phone, message)
        raise


@shared_task(name='notifications.send_cancellation_sms', **_RETRY_KWARGS)
def send_cancellation_sms(self, appointment_id: int) -> None:
    from apps.appointments.models import Appointment

    appointment = Appointment.objects.select_related(
        'doctor__user', 'patient'
    ).get(pk=appointment_id)

    message = (
        f'نوبت شما با دکتر {appointment.doctor.user.full_name} '
        f'در تاریخ {appointment.date} ساعت {appointment.start_time.strftime("%H:%M")} '
        f'لغو شد.'
    )
    phone = appointment.patient.phone
    try:
        _send(phone, message)
        _log_success(phone, message)
    except KavenegarError:
        if self.request.retries >= self.max_retries:
            _log_failure(phone, message)
        raise
