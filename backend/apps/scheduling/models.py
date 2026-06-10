"""
apps/scheduling/models.py

Three models that power the booking engine:
  Service      — what a business offers (duration drives slot size)
  WorkingHours — when a provider is available on a weekly basis
  TimeOff      — exceptions: full-day or partial-day unavailability

Design:
  • All models carry business_id for tenant isolation.
  • WorkingHours.provider == null  → business-wide default hours.
  • TimeOff.provider == null       → business-wide closure.
  • Provider-level records override business-level ones.
"""

from django.conf import settings
from django.db import models
from django.core.exceptions import ValidationError

from common.models import TimeStampedModel


# ──────────────────────────────────────────────────────────────────────────────
# Weekday choices  (Iranian week: 0 = Saturday … 6 = Friday)
# ──────────────────────────────────────────────────────────────────────────────

class Weekday(models.IntegerChoices):
    SATURDAY  = 0, 'شنبه'
    SUNDAY    = 1, 'یکشنبه'
    MONDAY    = 2, 'دوشنبه'
    TUESDAY   = 3, 'سه‌شنبه'
    WEDNESDAY = 4, 'چهارشنبه'
    THURSDAY  = 5, 'پنجشنبه'
    FRIDAY    = 6, 'جمعه'


# Python date.weekday() → Iranian weekday mapping
# Python: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
PYTHON_WEEKDAY_TO_IRANIAN = {5: 0, 6: 1, 0: 2, 1: 3, 2: 4, 3: 5, 4: 6}


def date_to_iranian_weekday(d) -> int:
    """Convert a Python date object to the Iranian weekday integer (0-6)."""
    return PYTHON_WEEKDAY_TO_IRANIAN[d.weekday()]


# ──────────────────────────────────────────────────────────────────────────────
# Service
# ──────────────────────────────────────────────────────────────────────────────

class Service(TimeStampedModel):
    """
    A bookable service offered by a business.

    duration_minutes drives the slot grid width.
    buffer_minutes adds breathing room AFTER each appointment in the grid.
    """

    business         = models.ForeignKey(
        'businesses.Business',
        on_delete=models.CASCADE,
        related_name='services',
        verbose_name='کسب‌وکار',
    )
    name             = models.CharField(max_length=150, verbose_name='نام خدمت')
    description      = models.TextField(blank=True, verbose_name='توضیحات')
    duration_minutes = models.PositiveSmallIntegerField(
        default=30,
        verbose_name='مدت (دقیقه)',
    )
    buffer_minutes   = models.PositiveSmallIntegerField(
        default=0,
        verbose_name='فاصله بعد از نوبت (دقیقه)',
        help_text='زمان آماده‌سازی بین دو نوبت متوالی',
    )
    price            = models.DecimalField(
        max_digits=10,
        decimal_places=0,
        default=0,
        verbose_name='قیمت (تومان)',
    )
    color            = models.CharField(
        max_length=7,
        default='#06B6D4',
        blank=True,
        verbose_name='رنگ تقویم',
    )
    is_active        = models.BooleanField(default=True, verbose_name='فعال')

    class Meta:
        db_table         = 'services'
        verbose_name     = 'خدمت'
        verbose_name_plural = 'خدمات'
        ordering         = ['name']
        indexes = [
            models.Index(fields=['business', 'is_active']),
        ]

    def __str__(self):
        return f'{self.name} ({self.duration_minutes}min) — {self.business}'

    def clean(self):
        if self.duration_minutes < 5:
            raise ValidationError('مدت خدمت باید حداقل ۵ دقیقه باشد.')

    @property
    def total_minutes(self) -> int:
        """Duration + buffer = total block in the schedule grid."""
        return self.duration_minutes + self.buffer_minutes


# ──────────────────────────────────────────────────────────────────────────────
# WorkingHours
# ──────────────────────────────────────────────────────────────────────────────

class WorkingHours(TimeStampedModel):
    """
    Regular weekly availability for a provider (or the whole business).

    Lookup order when generating slots:
      1. Provider-level WorkingHours (provider IS NOT NULL)
      2. Business-level WorkingHours (provider IS NULL)

    UniqueConstraints prevent duplicate weekday entries at both levels.
    """

    business   = models.ForeignKey(
        'businesses.Business',
        on_delete=models.CASCADE,
        related_name='working_hours',
        verbose_name='کسب‌وکار',
    )
    provider   = models.ForeignKey(
        'providers.Provider',
        on_delete=models.CASCADE,
        related_name='working_hours',
        null=True,
        blank=True,
        verbose_name='ارائه‌دهنده',
        help_text='خالی = ساعت پیش‌فرض کسب‌وکار',
    )
    weekday    = models.PositiveSmallIntegerField(
        choices=Weekday.choices,
        verbose_name='روز هفته',
    )
    start_time = models.TimeField(verbose_name='ساعت شروع')
    end_time   = models.TimeField(verbose_name='ساعت پایان')
    is_active  = models.BooleanField(default=True, verbose_name='فعال')

    class Meta:
        db_table         = 'working_hours'
        verbose_name     = 'ساعت کاری'
        verbose_name_plural = 'ساعات کاری'
        constraints = [
            # One entry per weekday per provider
            models.UniqueConstraint(
                fields=['provider', 'weekday'],
                condition=models.Q(provider__isnull=False),
                name='unique_provider_weekday_hours',
            ),
            # One entry per weekday at business level
            models.UniqueConstraint(
                fields=['business', 'weekday'],
                condition=models.Q(provider__isnull=True),
                name='unique_business_weekday_hours',
            ),
        ]
        indexes = [
            models.Index(fields=['provider', 'weekday', 'is_active']),
            models.Index(fields=['business', 'weekday', 'is_active']),
        ]

    def __str__(self):
        target = str(self.provider) if self.provider_id else str(self.business)
        return f'{target} — {self.get_weekday_display()} {self.start_time}–{self.end_time}'

    def clean(self):
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError('ساعت شروع باید قبل از ساعت پایان باشد.')


# ──────────────────────────────────────────────────────────────────────────────
# TimeOff
# ──────────────────────────────────────────────────────────────────────────────

class TimeOff(TimeStampedModel):
    """
    A specific date (or partial date) where the provider is NOT available.

    Full-day:    start_time = end_time = None  → entire day is blocked.
    Partial:     start_time + end_time set     → only that range is blocked.

    Multiple partial TimeOffs on the same date are allowed (e.g., lunch break
    every day is modelled as recurring partial TimeOffs — future feature).
    """

    business   = models.ForeignKey(
        'businesses.Business',
        on_delete=models.CASCADE,
        related_name='timeoffs',
        verbose_name='کسب‌وکار',
    )
    provider   = models.ForeignKey(
        'providers.Provider',
        on_delete=models.CASCADE,
        related_name='timeoffs',
        null=True,
        blank=True,
        verbose_name='ارائه‌دهنده',
        help_text='خالی = تعطیلی کل کسب‌وکار',
    )
    date       = models.DateField(verbose_name='تاریخ')
    start_time = models.TimeField(
        null=True, blank=True,
        verbose_name='از ساعت',
        help_text='خالی = تمام روز',
    )
    end_time   = models.TimeField(
        null=True, blank=True,
        verbose_name='تا ساعت',
    )
    reason     = models.CharField(max_length=200, blank=True, verbose_name='دلیل')

    class Meta:
        db_table         = 'timeoffs'
        verbose_name     = 'مرخصی / تعطیلی'
        verbose_name_plural = 'مرخصی‌ها و تعطیلی‌ها'
        indexes = [
            models.Index(fields=['provider', 'date']),
            models.Index(fields=['business', 'date']),
        ]

    def __str__(self):
        target = str(self.provider) if self.provider_id else str(self.business)
        suffix = f' {self.start_time}–{self.end_time}' if self.start_time else ' (تمام روز)'
        return f'{target} — {self.date}{suffix}'

    def clean(self):
        if bool(self.start_time) != bool(self.end_time):
            raise ValidationError(
                'start_time و end_time باید هر دو خالی (تمام روز) یا هر دو پر باشند.'
            )
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError('ساعت شروع باید قبل از ساعت پایان باشد.')

    @property
    def is_full_day(self) -> bool:
        return self.start_time is None
