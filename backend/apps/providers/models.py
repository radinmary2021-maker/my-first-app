from django.core.exceptions import ValidationError
from django.db import models

from apps.accounts.models import User

# BusinessCategory has moved to apps.businesses.models.
# Re-export here for backward compatibility while the migration is in progress.
from apps.businesses.models import BusinessCategory  # noqa: F401


class Weekday(models.IntegerChoices):
    SATURDAY  = 0, 'شنبه'
    SUNDAY    = 1, 'یکشنبه'
    MONDAY    = 2, 'دوشنبه'
    TUESDAY   = 3, 'سه‌شنبه'
    WEDNESDAY = 4, 'چهارشنبه'
    THURSDAY  = 5, 'پنجشنبه'
    FRIDAY    = 6, 'جمعه'


class ExceptionType(models.TextChoices):
    HOLIDAY      = 'HOLIDAY',      'تعطیل'
    CUSTOM_HOURS = 'CUSTOM_HOURS', 'ساعت سفارشی'


class Provider(models.Model):
    """
    A Provider is a staff member / specialist within a Business.

    Transition notes (SaaS refactor):
      - `business` FK is being introduced in migration 0002.
      - After migration 0003 it becomes non-nullable.
      - `business_name`, `category`, `address`, `bio` are kept for backward
        compatibility until the booking engine is fully migrated to use
        Business-level data.
    """
    # ── New tenant link ────────────────────────────────────────────────────
    business      = models.ForeignKey(
        'businesses.Business',
        on_delete=models.CASCADE,
        related_name='providers',
        null=True,       # nullable until data migration runs
        blank=True,
        verbose_name='کسب‌وکار',
    )
    # ── Legacy fields (kept for transition period) ─────────────────────────
    user          = models.OneToOneField(User, on_delete=models.CASCADE, related_name='provider_profile')
    business_name = models.CharField(max_length=150, verbose_name='نام کسب‌وکار')
    category      = models.CharField(
        max_length=30,
        choices=BusinessCategory.choices,
        default=BusinessCategory.OTHER,
        verbose_name='دسته‌بندی',
    )
    specialty     = models.CharField(max_length=100, blank=True, verbose_name='تخصص / عنوان شغلی')
    bio           = models.TextField(blank=True, verbose_name='معرفی')
    address       = models.CharField(max_length=300, blank=True, verbose_name='آدرس')
    slot_duration = models.PositiveSmallIntegerField(default=30, verbose_name='مدت هر نوبت (دقیقه)')
    service_fee   = models.DecimalField(max_digits=10, decimal_places=0, verbose_name='هزینه خدمت (تومان)')
    is_active     = models.BooleanField(default=True)
    avatar        = models.FileField(
        upload_to='provider_avatars/',
        blank=True,
        null=True,
        verbose_name='عکس پروفایل',
    )

    class Meta:
        db_table = 'providers'

    def __str__(self):
        return f'{self.business_name} ({self.get_category_display()})'


class ProviderService(models.Model):
    provider         = models.ForeignKey(Provider, on_delete=models.CASCADE, related_name='provider_services')
    name             = models.CharField(max_length=100, verbose_name='نام خدمت')
    price            = models.PositiveIntegerField(default=0, verbose_name='قیمت (تومان)')
    duration_minutes = models.PositiveSmallIntegerField(default=30, verbose_name='مدت (دقیقه)')
    is_active        = models.BooleanField(default=True)

    class Meta:
        db_table = 'provider_services'
        ordering = ['name']

    def __str__(self):
        return f'{self.name} — {self.provider.user.full_name}'


# WeeklySchedule and ScheduleException have been replaced by:
#   apps.scheduling.WorkingHours  (weekly availability grid)
#   apps.scheduling.TimeOff       (date-specific exceptions)
#
# These classes are kept here ONLY as tombstones so that
# providers/migrations/0004_drop_old_schedule.py can reference them.
# DO NOT add any new code that depends on them.

# WeeklySchedule and ScheduleException were removed in migration 0004.
# The classes are deleted from this file — Django now treats them as gone.
