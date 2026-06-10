from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.utils import timezone

PAYMENT_EXPIRY_MINUTES = getattr(settings, 'PAYMENT_EXPIRY_MINUTES', 15)


@shared_task(name='payments.expire_pending_appointments')
def expire_pending_appointments():
    """
    Cancels PENDING appointments older than PAYMENT_EXPIRY_MINUTES and
    invalidates their slot caches so the freed slots become bookable again.
    Run every 5 minutes via Celery Beat.
    Returns count of cancelled appointments.
    """
    from apps.appointments.models import Appointment, AppointmentStatus
    from apps.scheduling.services import AvailabilityService

    deadline = timezone.now() - timedelta(minutes=PAYMENT_EXPIRY_MINUTES)

    # Fetch before updating so we can invalidate per-appointment caches
    expired = list(
        Appointment.objects
        .filter(status=AppointmentStatus.PENDING, created_at__lt=deadline)
        .values('id', 'business_id', 'date', 'service_id', 'provider_id')
    )

    if not expired:
        return 0

    ids = [e['id'] for e in expired]
    updated = Appointment.objects.filter(pk__in=ids).update(
        status=AppointmentStatus.CANCELLED,
        updated_at=timezone.now(),
    )

    # Invalidate slot caches so freed slots become available immediately
    for appt in expired:
        if appt['service_id']:
            AvailabilityService.invalidate_date(
                appt['business_id'],
                appt['date'],
                appt['service_id'],
                appt['provider_id'],
            )

    return updated
