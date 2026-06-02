from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.appointments.models import Appointment, AppointmentStatus

from .models import Payment, PaymentStatus
from .zarinpal import ZarinpalError, request_payment, verify_payment

PAYMENT_EXPIRY_MINUTES = getattr(settings, 'PAYMENT_EXPIRY_MINUTES', 15)


class PaymentError(Exception):
    pass


def _is_expired(appointment: Appointment) -> bool:
    deadline = appointment.created_at + timedelta(minutes=PAYMENT_EXPIRY_MINUTES)
    return timezone.now() > deadline


def initiate_payment(appointment: Appointment, callback_url: str) -> dict:
    """
    Creates a Payment record and returns the Zarinpal redirect URL.
    Raises PaymentError if appointment is expired or not pending_payment.
    """
    if appointment.status != AppointmentStatus.PENDING_PAYMENT:
        raise PaymentError('این نوبت در انتظار پرداخت نیست.')

    if _is_expired(appointment):
        appointment.status = AppointmentStatus.CANCELLED
        appointment.save(update_fields=['status', 'updated_at'])
        raise PaymentError('مهلت پرداخت این نوبت منقضی شده است.')

    payment, _ = Payment.objects.get_or_create(
        appointment=appointment,
        defaults={
            'amount': appointment.doctor.consultation_fee,
            'status': PaymentStatus.PENDING,
        },
    )

    amount_rials = int(appointment.doctor.consultation_fee)

    try:
        result = request_payment(
            amount=amount_rials,
            description=f'رزرو نوبت {appointment.tracking_code}',
            callback_url=callback_url,
        )
    except ZarinpalError as e:
        raise PaymentError(str(e))

    payment.authority = result['authority']
    payment.save(update_fields=['authority'])

    return {'gate_url': result['gate_url'], 'tracking_code': appointment.tracking_code}


def confirm_payment(authority: str) -> Payment:
    """
    Called from the Zarinpal callback. Verifies and confirms the payment.
    Transitions Appointment → confirmed on success.
    """
    try:
        payment = Payment.objects.select_related('appointment__doctor').get(authority=authority)
    except Payment.DoesNotExist:
        raise PaymentError('پرداخت یافت نشد.')

    appointment = payment.appointment

    if payment.status == PaymentStatus.PAID:
        return payment

    if _is_expired(appointment):
        appointment.status = AppointmentStatus.CANCELLED
        appointment.save(update_fields=['status', 'updated_at'])
        payment.status = PaymentStatus.FAILED
        payment.save(update_fields=['status'])
        raise PaymentError('مهلت پرداخت منقضی شده است.')

    amount_rials = int(appointment.doctor.consultation_fee)

    try:
        ref_id = verify_payment(authority, amount_rials)
    except ZarinpalError as e:
        payment.status = PaymentStatus.FAILED
        payment.save(update_fields=['status'])
        raise PaymentError(str(e))

    with transaction.atomic():
        payment.ref_id = ref_id
        payment.status = PaymentStatus.PAID
        payment.save(update_fields=['ref_id', 'status'])

        appointment.status = AppointmentStatus.CONFIRMED
        appointment.save(update_fields=['status', 'updated_at'])

    return payment
