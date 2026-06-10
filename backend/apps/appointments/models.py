"""
apps/appointments/models.py

Multi-tenant Appointment model.

Key changes from v1:
  • business FK  — tenant isolation (required)
  • service FK   — nullable for backward-compat; drives slot size
  • customer FK  — nullable (guest bookings use customer_name + customer_phone)
  • cancelled_by — records who cancelled for analytics
  • total_price / deposit_paid — financial fields
  • status 'pending' replaces 'pending_payment' (kept in choices for BC)

Constraint:
  Partial UniqueConstraint prevents double-booking:
    (provider, date, start_time) must be unique among ACTIVE statuses.
  This is the last line of defence; SELECT FOR UPDATE in the service layer
  is the first.
"""

import random
import string

from django.conf import settings
from django.db import models

from common.models import TimeStampedModel


# ──────────────────────────────────────────────────────────────────────────────
# Status choices
# ──────────────────────────────────────────────────────────────────────────────

class AppointmentStatus(models.TextChoices):
    PENDING   = 'pending',   'در انتظار تأیید'
    CONFIRMED = 'confirmed', 'تأیید شده'
    CANCELLED = 'cancelled', 'لغو شده'
    COMPLETED = 'completed', 'انجام شده'
    NO_SHOW   = 'no_show',   'غیبت'


# Statuses that occupy the slot (block new bookings)
ACTIVE_STATUSES = [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]


# ──────────────────────────────────────────────────────────────────────────────
# Tracking code helpers
# ──────────────────────────────────────────────────────────────────────────────

def _generate_tracking_code() -> str:
    chars  = string.ascii_uppercase + string.digits
    suffix = ''.join(random.choices(chars, k=6))
    return f'APT-{suffix}'


def _unique_tracking_code() -> str:
    """Loops until a code not already in DB is found (collision probability ~0)."""
    for _ in range(10):
        code = _generate_tracking_code()
        if not Appointment.objects.filter(tracking_code=code).exists():
            return code
    # Extreme fallback — add timestamp entropy
    import time
    return f'APT-{int(time.time() * 1000) % 1_000_000:06X}'


# ──────────────────────────────────────────────────────────────────────────────
# Appointment
# ──────────────────────────────────────────────────────────────────────────────

class Appointment(TimeStampedModel):
    """
    A single booked time slot.

    Relationships:
      business  — tenant root (always required)
      provider  — the staff member delivering the service (required)
      service   — the service being booked (nullable for legacy rows)
      customer  — authenticated user (nullable for guest bookings)

    For guest bookings (customer IS NULL):
      customer_name + customer_phone must be provided.
    For authenticated bookings:
      customer_name / customer_phone mirror user profile and are populated
      at creation time for denormalization (SMS sends don't need a JOIN).
    """

    # ── Tenant + participants ─────────────────────────────────────────────────
    business = models.ForeignKey(
        'businesses.Business',
        on_delete=models.CASCADE,
        related_name='appointments',
        verbose_name='کسب‌وکار',
    )
    provider = models.ForeignKey(
        'providers.Provider',
        on_delete=models.PROTECT,
        related_name='appointments',
        verbose_name='ارائه‌دهنده',
    )
    service = models.ForeignKey(
        'scheduling.Service',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='appointments',
        verbose_name='خدمت',
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='appointments',
        verbose_name='مشتری',
    )

    # ── Denormalised customer info (guest-safe) ───────────────────────────────
    customer_name  = models.CharField(max_length=100, blank=True, verbose_name='نام مشتری')
    customer_phone = models.CharField(max_length=15, blank=True, verbose_name='موبایل مشتری')

    # ── Slot ─────────────────────────────────────────────────────────────────
    date       = models.DateField(verbose_name='تاریخ')
    start_time = models.TimeField(verbose_name='ساعت شروع')
    end_time   = models.TimeField(verbose_name='ساعت پایان')

    # ── Status ───────────────────────────────────────────────────────────────
    status = models.CharField(
        max_length=20,
        choices=AppointmentStatus.choices,
        default=AppointmentStatus.PENDING,
        verbose_name='وضعیت',
        db_index=True,
    )
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cancelled_appointments',
        verbose_name='لغوکننده',
    )

    # ── Financial ────────────────────────────────────────────────────────────
    total_price   = models.DecimalField(
        max_digits=10, decimal_places=0, default=0,
        verbose_name='قیمت کل (تومان)',
    )
    deposit_paid  = models.BooleanField(default=False, verbose_name='پیش‌پرداخت شده')

    # ── Misc ─────────────────────────────────────────────────────────────────
    notes         = models.TextField(blank=True, verbose_name='یادداشت')
    tracking_code = models.CharField(
        max_length=12, unique=True, db_index=True, verbose_name='کد پیگیری'
    )

    class Meta:
        db_table         = 'appointments'
        verbose_name     = 'نوبت'
        verbose_name_plural = 'نوبت‌ها'
        ordering         = ['-date', '-start_time']
        indexes = [
            models.Index(fields=['business', 'date']),
            models.Index(fields=['business', 'status']),
            models.Index(fields=['provider', 'date', 'status']),
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['tracking_code']),
        ]
        constraints = [
            # Hard DB-level double-booking guard.
            # SELECT FOR UPDATE in AppointmentService is the first defence.
            models.UniqueConstraint(
                fields=['provider', 'date', 'start_time'],
                condition=models.Q(status__in=ACTIVE_STATUSES),
                name='unique_active_appointment_slot',
            ),
        ]

    def __str__(self):
        name = self.customer_name or str(self.customer)
        return f'{self.tracking_code} — {name} @ {self.provider} [{self.date}]'

    def save(self, *args, **kwargs):
        if not self.tracking_code:
            self.tracking_code = _unique_tracking_code()
        super().save(*args, **kwargs)

    # ── Convenience properties ────────────────────────────────────────────────

    @property
    def is_active(self) -> bool:
        return self.status in ACTIVE_STATUSES

    @property
    def contact_phone(self) -> str:
        """Best-effort phone for SMS — prefers denormalised field."""
        if self.customer_phone:
            return self.customer_phone
        if self.customer_id and hasattr(self.customer, 'phone'):
            return self.customer.phone
        return ''
