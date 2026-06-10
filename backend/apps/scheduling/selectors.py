"""
apps/scheduling/selectors.py

Read-only query helpers for the scheduling domain.
All database reads for slots/availability go through here — never in views.

Naming convention:
  get_*   → returns a single object or None
  list_*  → returns a QuerySet (lazy)
  fetch_* → returns a fully evaluated list (used when we need it in memory)
"""

import datetime
from typing import Optional

from django.db.models import QuerySet, Prefetch

from .models import Service, WorkingHours, TimeOff


# ──────────────────────────────────────────────────────────────────────────────
# Service selectors
# ──────────────────────────────────────────────────────────────────────────────

def list_services(business_id: int, active_only: bool = True) -> QuerySet:
    qs = Service.objects.filter(business_id=business_id)
    if active_only:
        qs = qs.filter(is_active=True)
    return qs.order_by('name')


def get_service(service_id: int, business_id: int) -> Optional[Service]:
    return Service.objects.filter(id=service_id, business_id=business_id).first()


# ──────────────────────────────────────────────────────────────────────────────
# WorkingHours selectors
# ──────────────────────────────────────────────────────────────────────────────

def list_working_hours(
    business_id: int,
    provider_id: Optional[int] = None,
    active_only: bool = True,
) -> QuerySet:
    """
    Returns WorkingHours for a provider (provider_id set) or
    for the whole business (provider_id=None).
    """
    qs = WorkingHours.objects.filter(business_id=business_id)
    if provider_id is not None:
        qs = qs.filter(provider_id=provider_id)
    else:
        qs = qs.filter(provider__isnull=True)
    if active_only:
        qs = qs.filter(is_active=True)
    return qs


def get_working_hours_for_date(
    business_id: int,
    date: datetime.date,
    provider_id: Optional[int] = None,
) -> Optional[WorkingHours]:
    """
    Returns the WorkingHours record that covers the given date's weekday.

    Priority:
      1. Provider-level hours (if provider_id given)
      2. Business-level hours
    Returns None if the entity doesn't work on that weekday.
    """
    from .models import date_to_iranian_weekday
    weekday = date_to_iranian_weekday(date)

    if provider_id is not None:
        provider_wh = WorkingHours.objects.filter(
            business_id=business_id,
            provider_id=provider_id,
            weekday=weekday,
            is_active=True,
        ).first()
        if provider_wh:
            return provider_wh

    return WorkingHours.objects.filter(
        business_id=business_id,
        provider__isnull=True,
        weekday=weekday,
        is_active=True,
    ).first()


def fetch_working_hours_map(
    business_id: int,
    provider_id: Optional[int] = None,
) -> dict[int, WorkingHours]:
    """
    Returns {weekday: WorkingHours} for fast O(1) access during slot generation.
    Provider-level entries take precedence over business-level ones.
    """
    result: dict[int, WorkingHours] = {}

    # Load business-level first (lower priority)
    for wh in WorkingHours.objects.filter(
        business_id=business_id,
        provider__isnull=True,
        is_active=True,
    ):
        result[wh.weekday] = wh

    # Override with provider-level (higher priority)
    if provider_id is not None:
        for wh in WorkingHours.objects.filter(
            business_id=business_id,
            provider_id=provider_id,
            is_active=True,
        ):
            result[wh.weekday] = wh

    return result


# ──────────────────────────────────────────────────────────────────────────────
# TimeOff selectors
# ──────────────────────────────────────────────────────────────────────────────

def list_timeoffs(
    business_id: int,
    provider_id: Optional[int] = None,
    date_from: Optional[datetime.date] = None,
    date_to: Optional[datetime.date] = None,
) -> QuerySet:
    qs = TimeOff.objects.filter(business_id=business_id)
    if provider_id is not None:
        qs = qs.filter(provider_id=provider_id)
    else:
        qs = qs.filter(provider__isnull=True)
    if date_from:
        qs = qs.filter(date__gte=date_from)
    if date_to:
        qs = qs.filter(date__lte=date_to)
    return qs.order_by('date', 'start_time')


def fetch_timeoffs_for_date(
    business_id: int,
    date: datetime.date,
    provider_id: Optional[int] = None,
) -> list[TimeOff]:
    """
    Returns all TimeOff entries that apply on a given date.
    Includes both provider-level AND business-level timeoffs.
    """
    from django.db.models import Q
    if provider_id is not None:
        # Provider-level OR business-level closures both block this provider
        qs = TimeOff.objects.filter(
            Q(business_id=business_id, date=date, provider_id=provider_id) |
            Q(business_id=business_id, date=date, provider__isnull=True)
        )
    else:
        qs = TimeOff.objects.filter(
            business_id=business_id,
            date=date,
            provider__isnull=True,
        )
    return list(qs)


def is_date_fully_blocked(
    business_id: int,
    date: datetime.date,
    provider_id: Optional[int] = None,
) -> bool:
    """Returns True if ANY full-day TimeOff exists for this entity on this date."""
    timeoffs = fetch_timeoffs_for_date(business_id, date, provider_id)
    return any(to.is_full_day for to in timeoffs)


def fetch_partial_blocks(
    business_id: int,
    date: datetime.date,
    provider_id: Optional[int] = None,
) -> list[tuple[datetime.time, datetime.time]]:
    """
    Returns list of (start_time, end_time) tuples for partial TimeOffs on a date.
    Full-day entries are excluded (they're handled by is_date_fully_blocked).
    """
    timeoffs = fetch_timeoffs_for_date(business_id, date, provider_id)
    return [
        (to.start_time, to.end_time)
        for to in timeoffs
        if not to.is_full_day
    ]
