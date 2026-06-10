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
    if appointment.status != AppointmentStatus.PENDING:
        raise PaymentError('این نوبت در انتظار پرداخت نیست.')

    if _is_expired(appointment):
        appointment.status = AppointmentStatus.CANCELLED
        appointment.save(update_fields=['status', 'updated_at'])
        # Reopen the slot so another customer can book it
        if appointment.service_id:
            from apps.scheduling.services import AvailabilityService
            AvailabilityService.invalidate_date(
                appointment.business_id,
                appointment.date,
                appointment.service_id,
                appointment.provider_id,
            )
        raise PaymentError('مهلت پرداخت این نوبت منقضی شده است.')

    payment, _ = Payment.objects.get_or_create(
        appointment=appointment,
        defaults={
            'amount': appointment.provider.service_fee,
            'status': PaymentStatus.PENDING,
        },
    )

    amount_rials = int(appointment.provider.service_fee)

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
    Uses select_for_update to prevent concurrent double-verification.
    """
    import logging
    logger = logging.getLogger('apps.payments')

    with transaction.atomic():
        try:
            # select_for_update prevents two simultaneous callbacks from both verifying
            payment = (
                Payment.objects
                .select_for_update()
                .select_related('appointment__provider')
                .get(authority=authority)
            )
        except Payment.DoesNotExist:
            logger.warning('confirm_payment: unknown authority=%s', authority)
            raise PaymentError('پرداخت یافت نشد.')

        appointment = payment.appointment

        # Idempotency guard — already processed
        if payment.status == PaymentStatus.PAID:
            logger.info('confirm_payment: already paid, authority=%s ref_id=%s', authority, payment.ref_id)
            return payment

        if _is_expired(appointment):
            appointment.status = AppointmentStatus.CANCELLED
            appointment.save(update_fields=['status', 'updated_at'])
            payment.status = PaymentStatus.FAILED
            payment.save(update_fields=['status'])
            logger.warning('confirm_payment: expired, authority=%s', authority)
            raise PaymentError('مهلت پرداخت منقضی شده است.')

        amount_rials = int(appointment.provider.service_fee)

    # Verify with Zarinpal OUTSIDE the DB transaction (network call)
    try:
        ref_id = verify_payment(authority, amount_rials)
    except ZarinpalError as e:
        logger.error('confirm_payment: zarinpal verify failed, authority=%s error=%s', authority, e)
        with transaction.atomic():
            Payment.objects.filter(authority=authority).update(status=PaymentStatus.FAILED)
        raise PaymentError(str(e))

    # Commit the verified payment and appointment together atomically
    with transaction.atomic():
        updated = Payment.objects.filter(
            authority=authority,
            status=PaymentStatus.PENDING,  # second guard against race
        ).update(ref_id=ref_id, status=PaymentStatus.PAID)

        if updated == 0:
            # Already processed by a concurrent request — fetch and return
            logger.info('confirm_payment: concurrent confirmation detected, authority=%s', authority)
            return Payment.objects.select_related('appointment').get(authority=authority)

        Appointment.objects.filter(pk=appointment.pk).update(
            status=AppointmentStatus.CONFIRMED,
            updated_at=timezone.now(),
        )

    payment.refresh_from_db()
    logger.info(
        'confirm_payment: success, authority=%s ref_id=%s tracking=%s',
        authority, ref_id, appointment.tracking_code,
    )
    return payment
