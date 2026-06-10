"""
apps/appointments/selectors.py

Read-only query helpers for the appointments domain.
All DB reads go through these functions — never directly in views or services.
"""

import datetime
from typing import Optional

from django.db.models import QuerySet

from .models import Appointment, AppointmentStatus, ACTIVE_STATUSES


def get_appointment_by_id(
    appointment_id: int,
    business_id: Optional[int] = None,
) -> Optional[Appointment]:
    qs = Appointment.objects.select_related('provider', 'service', 'customer')
    if business_id:
        qs = qs.filter(business_id=business_id)
    return qs.filter(id=appointment_id).first()


def get_appointment_by_tracking_code(code: str) -> Optional[Appointment]:
    return (
        Appointment.objects
        .select_related('provider', 'service', 'customer', 'business')
        .filter(tracking_code=code)
        .first()
    )


def list_appointments_for_customer(
    customer_id: int,
    status: Optional[str] = None,
    upcoming_only: bool = False,
) -> QuerySet:
    qs = (
        Appointment.objects
        .filter(customer_id=customer_id)
        .select_related('provider', 'service', 'business')
        .order_by('-date', '-start_time')
    )
    if status:
        qs = qs.filter(status=status)
    if upcoming_only:
        qs = qs.filter(
            date__gte=datetime.date.today(),
            status__in=ACTIVE_STATUSES,
        )
    return qs


def list_appointments_for_provider(
    provider_id: int,
    business_id: int,
    date: Optional[datetime.date] = None,
    status: Optional[str] = None,
    date_from: Optional[datetime.date] = None,
    date_to: Optional[datetime.date] = None,
) -> QuerySet:
    qs = (
        Appointment.objects
        .filter(provider_id=provider_id, business_id=business_id)
        .select_related('customer', 'service')
        .order_by('date', 'start_time')
    )
    if date:
        qs = qs.filter(date=date)
    if date_from:
        qs = qs.filter(date__gte=date_from)
    if date_to:
        qs = qs.filter(date__lte=date_to)
    if status:
        qs = qs.filter(status=status)
    return qs


def list_appointments_for_business(
    business_id: int,
    date: Optional[datetime.date] = None,
    status: Optional[str] = None,
    provider_id: Optional[int] = None,
) -> QuerySet:
    qs = (
        Appointment.objects
        .filter(business_id=business_id)
        .select_related('customer', 'provider', 'service')
        .order_by('-date', '-start_time')
    )
    if date:
        qs = qs.filter(date=date)
    if provider_id:
        qs = qs.filter(provider_id=provider_id)
    if status:
        qs = qs.filter(status=status)
    return qs


def count_active_appointments_for_slot(
    provider_id: int,
    date: datetime.date,
    start_time: datetime.time,
) -> int:
    """Used for pre-lock validation — not a substitute for SELECT FOR UPDATE."""
    return Appointment.objects.filter(
        provider_id=provider_id,
        date=date,
        start_time=start_time,
        status__in=ACTIVE_STATUSES,
    ).count()
