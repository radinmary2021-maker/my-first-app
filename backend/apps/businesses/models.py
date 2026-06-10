"""
apps/businesses/models.py
Core tenant models: Business, BusinessMember, Branch.

Design principles:
  - Business is the root tenant entity — every downstream model carries business_id.
  - BusinessMember is the M2M bridge between User and Business with a role.
  - Branch is optional (only used by Enterprise plan); a business always has at
    least an implicit "main branch".
  - SoftDeleteModel on Business ensures historical data is preserved when a
    business is deleted.
"""

import logging

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify

from common.models import SoftDeleteModel, TimeStampedModel

logger = logging.getLogger('apps.businesses')


# ──────────────────────────────────────────────────────────────────────────────
# Choices
# ──────────────────────────────────────────────────────────────────────────────

class BusinessCategory(models.TextChoices):
    MEDICAL       = 'medical',       'پزشکی و سلامت'
    BEAUTY        = 'beauty',        'آرایشگاه و زیبایی'
    LEGAL         = 'legal',         'وکالت و مشاوره حقوقی'
    FINANCIAL     = 'financial',     'مشاوره مالی'
    PSYCHOLOGICAL = 'psychological', 'روانشناسی و مشاوره'
    FITNESS       = 'fitness',       'ورزش و تناسب‌اندام'
    EDUCATION     = 'education',     'آموزش و تدریس'
    VETERINARY    = 'veterinary',    'دامپزشکی'
    AUTOMOTIVE    = 'automotive',    'تعمیرگاه و خودرو'
    OTHER         = 'other',         'سایر'


class MemberRole(models.TextChoices):
    OWNER = 'owner', 'مالک'
    STAFF = 'staff', 'کارمند'


# ──────────────────────────────────────────────────────────────────────────────
# Business (Tenant root)
# ──────────────────────────────────────────────────────────────────────────────

class Business(SoftDeleteModel):
    """
    The root tenant entity.

    One Business = one isolated workspace.  Every downstream model (providers,
    services, appointments, …) carries a ForeignKey to this model.

    Slug is used as the public booking URL: /book/{slug}/
    """

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='owned_businesses',
        verbose_name='مالک',
    )
    name        = models.CharField(max_length=150, verbose_name='نام کسب‌وکار')
    slug        = models.SlugField(
        max_length=100,
        unique=True,
        allow_unicode=True,
        verbose_name='شناسه URL',
        help_text='آدرس صفحه رزرو: nobatic.ir/book/{slug}',
    )
    category    = models.CharField(
        max_length=30,
        choices=BusinessCategory.choices,
        default=BusinessCategory.OTHER,
        verbose_name='دسته‌بندی',
    )
    description = models.TextField(blank=True, verbose_name='توضیحات')
    phone       = models.CharField(max_length=15, blank=True, verbose_name='تلفن')
    address     = models.TextField(blank=True, verbose_name='آدرس')
    logo        = models.FileField(
        upload_to='business_logos/',
        null=True,
        blank=True,
        verbose_name='لوگو',
    )
    timezone    = models.CharField(
        max_length=50,
        default='Asia/Tehran',
        verbose_name='منطقه زمانی',
    )
    is_active   = models.BooleanField(default=True, verbose_name='فعال')

    class Meta:
        db_table         = 'businesses'
        verbose_name     = 'کسب‌وکار'
        verbose_name_plural = 'کسب‌وکارها'
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['owner', 'is_active']),
            models.Index(fields=['category', 'is_active']),
        ]

    def __str__(self):
        return self.name

    # ── Lifecycle ─────────────────────────────────────────────────────────────

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_unique_slug()
        super().save(*args, **kwargs)

    def _generate_unique_slug(self) -> str:
        base = slugify(self.name, allow_unicode=True)
        if not base:
            # All-numeric or untranslatable name — fall back to timestamp
            base = f'business-{int(timezone.now().timestamp())}'

        slug    = base
        counter = 1
        # Check against all_objects to avoid reusing slugs of deleted businesses
        while Business.all_objects.filter(slug=slug).exists():
            slug     = f'{base}-{counter}'
            counter += 1
        return slug

    # ── Domain helpers ────────────────────────────────────────────────────────

    def get_active_subscription(self):
        """Returns the active Subscription or None (evaluated lazily)."""
        try:
            from apps.subscriptions.models import Subscription
            return (
                self.subscriptions
                    .filter(status=Subscription.Status.ACTIVE, ends_at__gt=timezone.now())
                    .select_related('plan')
                    .first()
            )
        except Exception:
            return None

    def get_active_plan(self):
        """Returns the active SubscriptionPlan or None."""
        sub = self.get_active_subscription()
        return sub.plan if sub else None


# ──────────────────────────────────────────────────────────────────────────────
# BusinessMember  (User ↔ Business bridge)
# ──────────────────────────────────────────────────────────────────────────────

class BusinessMember(TimeStampedModel):
    """
    Connects a User to a Business with a role.

    Rules:
      - One user can be a member of multiple businesses (future use).
      - Each (business, user) pair is unique.
      - The owner is always a member with role=OWNER.
      - Removing a member sets is_active=False (soft-remove).
    """

    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name='members',
        verbose_name='کسب‌وکار',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='business_memberships',
        verbose_name='کاربر',
    )
    role      = models.CharField(
        max_length=20,
        choices=MemberRole.choices,
        default=MemberRole.STAFF,
        verbose_name='نقش',
    )
    is_active = models.BooleanField(default=True, verbose_name='فعال')

    class Meta:
        db_table         = 'business_members'
        verbose_name     = 'عضو کسب‌وکار'
        verbose_name_plural = 'اعضای کسب‌وکار'
        unique_together  = [('business', 'user')]
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['business', 'role']),
            models.Index(fields=['business', 'is_active']),
        ]

    def __str__(self):
        return f'{self.user} @ {self.business} [{self.role}]'

    @property
    def is_owner(self) -> bool:
        return self.role == MemberRole.OWNER

    @property
    def is_staff(self) -> bool:
        return self.role == MemberRole.STAFF


# ──────────────────────────────────────────────────────────────────────────────
# Branch  (Enterprise feature — scoped within a Business)
# ──────────────────────────────────────────────────────────────────────────────

class Branch(TimeStampedModel):
    """
    A physical or logical branch of a Business.

    Single-branch businesses do not need an explicit Branch record;
    the business itself acts as the implicit branch.
    Multi-branch is an Enterprise plan feature.
    """

    business  = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name='branches',
        verbose_name='کسب‌وکار',
    )
    name      = models.CharField(max_length=150, verbose_name='نام شعبه')
    address   = models.TextField(blank=True, verbose_name='آدرس')
    phone     = models.CharField(max_length=15, blank=True, verbose_name='تلفن')
    is_active = models.BooleanField(default=True, verbose_name='فعال')

    class Meta:
        db_table     = 'branches'
        verbose_name = 'شعبه'
        verbose_name_plural = 'شعبه‌ها'
        indexes = [
            models.Index(fields=['business', 'is_active']),
        ]

    def __str__(self):
        return f'{self.business} — {self.name}'
