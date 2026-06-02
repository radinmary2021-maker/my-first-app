from celery import shared_task

from .kavenegar import KavenegarClient, KavenegarError
from .models import SMSLog, SMSStatus


def _send_and_log(phone: str, message: str) -> None:
    client = KavenegarClient()
    try:
        client.send_sms(phone, message)
        SMSLog.objects.create(phone=phone, message=message, status=SMSStatus.SENT)
    except KavenegarError:
        SMSLog.objects.create(phone=phone, message=message, status=SMSStatus.FAILED)


@shared_task(name='notifications.send_otp_sms')
def send_otp_sms(phone: str, code: str) -> None:
    _send_and_log(phone, f'کد تأیید شما: {code}')


@shared_task(name='notifications.send_booking_confirmation_sms')
def send_booking_confirmation_sms(appointment_id: int) -> None:
    from apps.appointments.models import Appointment

    appointment = Appointment.objects.select_related(
        'doctor__user', 'patient'
    ).get(pk=appointment_id)

    message = (
        f'نوبت شما با دکتر {appointment.doctor.user.full_name} '
        f'در تاریخ {appointment.date} ساعت {appointment.start_time.strftime("%H:%M")} '
        f'با کد پیگیری {appointment.tracking_code} ثبت شد.'
    )
    _send_and_log(appointment.patient.phone, message)


@shared_task(name='notifications.send_cancellation_sms')
def send_cancellation_sms(appointment_id: int) -> None:
    from apps.appointments.models import Appointment

    appointment = Appointment.objects.select_related(
        'doctor__user', 'patient'
    ).get(pk=appointment_id)

    message = (
        f'نوبت شما با دکتر {appointment.doctor.user.full_name} '
        f'در تاریخ {appointment.date} ساعت {appointment.start_time.strftime("%H:%M")} '
        f'لغو شد.'
    )
    _send_and_log(appointment.patient.phone, message)
