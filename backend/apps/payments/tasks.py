from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.utils import timezone

PAYMENT_EXPIRY_MINUTES = getattr(settings, 'PAYMENT_EXPIRY_MINUTES', 15)


@shared_task(name='payments.expire_pending_appointments')
def expire_pending_appointments():
    """
    Cancels pending_payment appointments older than PAYMENT_EXPIRY_MINUTES.
    Run every 5 minutes via Celery Beat.
    Returns count of cancelled appointments.
    """
    from apps.appointments.models import Appointment, AppointmentStatus

    deadline = timezone.now() - timedelta(minutes=PAYMENT_EXPIRY_MINUTES)

    updated = Appointment.objects.filter(
        status=AppointmentStatus.PENDING_PAYMENT,
        created_at__lt=deadline,
    ).update(
        status=AppointmentStatus.CANCELLED,
        updated_at=timezone.now(),
    )

    return updated
