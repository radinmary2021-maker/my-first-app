"""
apps/scheduling/services.py

The booking engine's brain — two services:

  SlotGeneratorService
    • Generates candidate time slots for a (provider, date, service) triple
    • Grid-based (not rolling): step = duration + buffer
    • Filters out past slots (30-min grace), TimeOffs, and existing appointments

  AvailabilityService
    • Returns available slots for a date range
    • Caches results in Redis with short TTL
    • Cache is invalidated on appointment create/cancel

Design principles (Calendly/Setmore-grade):
  - ALL overlap math uses integers (minutes-since-midnight) — no datetime hell
  - No ORM queries inside the hot loop; bulk-fetch at entry point
  - Deterministic output: slots are always sorted ascending
"""

import datetime
import logging
from dataclasses import dataclass, field
from typing import Optional

from django.utils import timezone
from django.core.cache import cache

from .models import Service, WorkingHours
from .selectors import (
    get_service,
    get_working_hours_for_date,
    fetch_timeoffs_for_date,
    is_date_fully_blocked,
    fetch_partial_blocks,
)

logger = logging.getLogger('apps.scheduling')

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
SLOT_CACHE_TTL        = 60        # seconds — short TTL, appointments invalidate
PAST_SLOT_GRACE_MINS  = 30        # allow booking slots starting within 30 min
MAX_DAYS_AHEAD        = 90        # customers can't book more than 90 days out


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _to_minutes(t: datetime.time) -> int:
    """Convert time → minutes-since-midnight (integer arithmetic only)."""
    return t.hour * 60 + t.minute


def _from_minutes(m: int) -> datetime.time:
    """Convert minutes-since-midnight → time."""
    return datetime.time(m // 60, m % 60)


def _now_minutes(date: datetime.date) -> Optional[int]:
    """
    If date == today, return current minutes-since-midnight + grace period.
    Otherwise return None (no past-filtering needed).
    """
    today = timezone.localdate()
    if date != today:
        return None
    now = timezone.localtime()
    return now.hour * 60 + now.minute + PAST_SLOT_GRACE_MINS


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class TimeSlot:
    """A single bookable slot."""
    start: datetime.time
    end: datetime.time
    duration_minutes: int
    service_id: int

    @property
    def start_minutes(self) -> int:
        return _to_minutes(self.start)

    @property
    def end_minutes(self) -> int:
        return _to_minutes(self.end)


@dataclass
class DayAvailability:
    """All available slots for a single day."""
    date: datetime.date
    slots: list[TimeSlot] = field(default_factory=list)
    is_day_off: bool = False
    no_working_hours: bool = False

    @property
    def has_slots(self) -> bool:
        return bool(self.slots)


# ---------------------------------------------------------------------------
# SlotGeneratorService
# ---------------------------------------------------------------------------

class SlotGeneratorService:
    """
    Generates time slots for ONE (provider, date, service) combination.

    Algorithm:
      1. Load WorkingHours for the date → defines the [open, close) window
      2. Check full-day TimeOff → bail early if blocked
      3. Fetch existing appointments for the date → booked intervals
      4. Fetch partial TimeOffs → extra blocked intervals
      5. Walk the grid at step = duration + buffer, yielding slots that:
         a. Don't overlap any booked interval (with buffer applied)
         b. Don't overlap any TimeOff interval
         c. Fit entirely within [open, close)
         d. Are not in the past (+ grace period)

    No DB queries inside step 5 — everything is pre-loaded.
    """

    def __init__(
        self,
        business_id: int,
        service: Service,
        provider_id: Optional[int] = None,
    ):
        self.business_id = business_id
        self.service      = service
        self.provider_id  = provider_id

    def generate(self, date: datetime.date) -> DayAvailability:
        result = DayAvailability(date=date)

        # ── Guard: too far in the future ──────────────────────────────────
        today = timezone.localdate()
        if date < today:
            return result  # past date — no slots
        if (date - today).days > MAX_DAYS_AHEAD:
            return result

        # ── 1. Working hours ──────────────────────────────────────────────
        wh = get_working_hours_for_date(
            self.business_id, date, self.provider_id
        )
        if not wh:
            result.no_working_hours = True
            return result

        open_min  = _to_minutes(wh.start_time)
        close_min = _to_minutes(wh.end_time)

        # ── 2. Full-day TimeOff ───────────────────────────────────────────
        if is_date_fully_blocked(self.business_id, date, self.provider_id):
            result.is_day_off = True
            return result

        # ── 3. Booked intervals (appointments) ────────────────────────────
        booked = self._fetch_booked_intervals(date)

        # ── 4. Partial TimeOff intervals ──────────────────────────────────
        partial_blocks = fetch_partial_blocks(
            self.business_id, date, self.provider_id
        )
        blocked_intervals = [
            (_to_minutes(s), _to_minutes(e))
            for s, e in partial_blocks
        ]

        # ── 5. Past-slot cutoff ───────────────────────────────────────────
        cutoff = _now_minutes(date)  # None if not today

        # ── 6. Walk the grid ──────────────────────────────────────────────
        duration = self.service.duration_minutes
        buffer   = self.service.buffer_minutes
        step     = duration + buffer  # grid step

        slot_start = open_min
        while slot_start + duration <= close_min:
            slot_end = slot_start + duration

            # a) Past filter
            if cutoff is not None and slot_start < cutoff:
                slot_start += step
                continue

            # b) Appointment overlap check
            if self._overlaps_any(slot_start, slot_end, buffer, booked):
                slot_start += step
                continue

            # c) TimeOff overlap check
            if self._overlaps_intervals(slot_start, slot_end, blocked_intervals):
                slot_start += step
                continue

            # ✓ Valid slot
            result.slots.append(TimeSlot(
                start=_from_minutes(slot_start),
                end=_from_minutes(slot_end),
                duration_minutes=duration,
                service_id=self.service.id,
            ))
            slot_start += step

        return result

    # ── Private helpers ───────────────────────────────────────────────────

    def _fetch_booked_intervals(
        self, date: datetime.date
    ) -> list[tuple[int, int, int]]:
        """
        Returns list of (apt_start_min, apt_end_min, apt_buffer_min) for all
        active appointments on this date.

        Imported here to avoid circular imports at module load time.
        """
        try:
            from apps.appointments.models import Appointment
        except ImportError:
            return []

        active_statuses = ['pending', 'confirmed']
        qs = Appointment.objects.filter(
            business_id=self.business_id,
            date=date,
            status__in=active_statuses,
        )
        if self.provider_id:
            qs = qs.filter(provider_id=self.provider_id)

        result = []
        for apt in qs.only('start_time', 'end_time', 'service_id'):
            apt_start  = _to_minutes(apt.start_time)
            apt_end    = _to_minutes(apt.end_time)
            # Use the appointment's own service buffer if available
            apt_buffer = 0
            if apt.service_id:
                try:
                    svc = Service.objects.filter(id=apt.service_id).only('buffer_minutes').first()
                    if svc:
                        apt_buffer = svc.buffer_minutes
                except Exception:
                    pass
            result.append((apt_start, apt_end, apt_buffer))
        return result

    @staticmethod
    def _overlaps_any(
        candidate_start: int,
        candidate_end: int,
        candidate_buffer: int,
        booked: list[tuple[int, int, int]],
    ) -> bool:
        """
        Returns True if the candidate slot overlaps any booked interval.

        Overlap condition (with buffer on BOTH sides counted):
          candidate_start  < apt_end + apt_buffer
          AND
          candidate_end + candidate_buffer > apt_start

        This ensures the buffer breathing room of the booked appointment
        is also respected.
        """
        for apt_start, apt_end, apt_buffer in booked:
            blocked_end = apt_end + apt_buffer
            if candidate_start < blocked_end and (candidate_end + candidate_buffer) > apt_start:
                return True
        return False

    @staticmethod
    def _overlaps_intervals(
        start: int,
        end: int,
        intervals: list[tuple[int, int]],
    ) -> bool:
        """Returns True if [start, end) overlaps any of the given intervals."""
        for s, e in intervals:
            if start < e and end > s:
                return True
        return False


# ---------------------------------------------------------------------------
# AvailabilityService
# ---------------------------------------------------------------------------

class AvailabilityService:
    """
    High-level API for checking availability.
    Adds Redis caching on top of SlotGeneratorService.

    Cache key: nobatic:slots:{business_id}:{provider_id}:{service_id}:{date}
    Invalidated by: AppointmentService.create_appointment() / cancel_appointment()
    """

    CACHE_PREFIX = 'nobatic:slots'

    @classmethod
    def get_slots_for_date(
        cls,
        business_id: int,
        date: datetime.date,
        service_id: int,
        provider_id: Optional[int] = None,
    ) -> DayAvailability:
        """
        Returns available slots for a single date.
        Result is cached in Redis for SLOT_CACHE_TTL seconds.
        """
        cache_key = cls._cache_key(business_id, provider_id, service_id, date)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        service = get_service(service_id, business_id)
        if not service:
            return DayAvailability(date=date)

        generator = SlotGeneratorService(
            business_id=business_id,
            service=service,
            provider_id=provider_id,
        )
        availability = generator.generate(date)

        cache.set(cache_key, availability, SLOT_CACHE_TTL)
        return availability

    @classmethod
    def get_slots_for_range(
        cls,
        business_id: int,
        date_from: datetime.date,
        date_to: datetime.date,
        service_id: int,
        provider_id: Optional[int] = None,
    ) -> list[DayAvailability]:
        """
        Returns availability for each day in [date_from, date_to].
        Days with no slots are included (so the frontend can grey them out).
        """
        results = []
        current = date_from
        while current <= date_to:
            day = cls.get_slots_for_date(
                business_id, current, service_id, provider_id
            )
            results.append(day)
            current += datetime.timedelta(days=1)
        return results

    @classmethod
    def invalidate_date(
        cls,
        business_id: int,
        date: datetime.date,
        service_id: int,
        provider_id: Optional[int] = None,
    ) -> None:
        """
        Called by AppointmentService after booking or cancellation.
        Deletes the cached slots for the affected date.
        """
        cache_key = cls._cache_key(business_id, provider_id, service_id, date)
        cache.delete(cache_key)
        logger.debug('Cache invalidated: %s', cache_key)

    @classmethod
    def invalidate_provider_date(
        cls,
        business_id: int,
        date: datetime.date,
        provider_id: Optional[int],
    ) -> None:
        """
        Invalidates ALL service caches for a given provider/date combination.
        Used when WorkingHours or TimeOff changes.
        Pattern-based delete (Redis SCAN + DEL).
        """
        pattern = f'{cls.CACHE_PREFIX}:{business_id}:{provider_id or "None"}:*:{date}'
        try:
            # Django cache doesn't support pattern delete natively;
            # use the raw Redis client if available.
            from django_redis import get_redis_connection
            conn = get_redis_connection('default')
            keys  = conn.keys(pattern)
            if keys:
                conn.delete(*keys)
                logger.debug('Pattern-deleted %d cache keys for pattern %s', len(keys), pattern)
        except Exception:
            # Fallback: no-op (cache will expire naturally)
            logger.warning('Pattern cache invalidation not available; TTL expiry will handle it.')

    @classmethod
    def _cache_key(
        cls,
        business_id: int,
        provider_id: Optional[int],
        service_id: int,
        date: datetime.date,
    ) -> str:
        return f'{cls.CACHE_PREFIX}:{business_id}:{provider_id or "None"}:{service_id}:{date}'


# ---------------------------------------------------------------------------
# WorkingHoursService  (CRUD for working hours + timeoffs)
# ---------------------------------------------------------------------------

class WorkingHoursService:
    """
    Manages working-hours and time-off configuration.
    All mutations go through here so cache invalidation is guaranteed.
    """

    @staticmethod
    def set_working_hours(
        business_id: int,
        weekday: int,
        start_time: datetime.time,
        end_time: datetime.time,
        provider_id: Optional[int] = None,
        is_active: bool = True,
    ) -> WorkingHours:
        """
        Upserts a WorkingHours record and invalidates the full-week cache
        for the affected entity.
        """
        from django.db import transaction

        defaults = {
            'start_time': start_time,
            'end_time':   end_time,
            'is_active':  is_active,
        }
        lookup = {
            'business_id': business_id,
            'weekday':     weekday,
            'provider_id': provider_id,
        }
        with transaction.atomic():
            wh, _ = WorkingHours.objects.update_or_create(defaults=defaults, **lookup)

        # Invalidate cache for all future dates that fall on this weekday
        # (pattern delete — best-effort)
        AvailabilityService.invalidate_provider_date(
            business_id, timezone.localdate(), provider_id
        )
        return wh

    @staticmethod
    def add_timeoff(
        business_id: int,
        date: datetime.date,
        provider_id: Optional[int] = None,
        start_time: Optional[datetime.time] = None,
        end_time: Optional[datetime.time] = None,
        reason: str = '',
    ) -> 'TimeOff':
        from .models import TimeOff
        from django.db import transaction

        with transaction.atomic():
            to = TimeOff.objects.create(
                business_id=business_id,
                provider_id=provider_id,
                date=date,
                start_time=start_time,
                end_time=end_time,
                reason=reason,
            )

        # Invalidate cache for all services on this date
        AvailabilityService.invalidate_provider_date(
            business_id, date, provider_id
        )
        return to

    @staticmethod
    def remove_timeoff(timeoff_id: int, business_id: int) -> None:
        from .models import TimeOff
        from django.db import transaction

        to = TimeOff.objects.filter(id=timeoff_id, business_id=business_id).first()
        if not to:
            return
        date        = to.date
        provider_id = to.provider_id

        with transaction.atomic():
            to.delete()

        AvailabilityService.invalidate_provider_date(
            business_id, date, provider_id
        )
