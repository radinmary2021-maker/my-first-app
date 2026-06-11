"""
apps/providers/services.py

Two layers of service logic live here:

1. ProviderService  — business-owner CRUD for provider management
                      (new, used by /api/v1/businesses/me/providers/)

2. Legacy slot shims — kept for backward-compat; delegate to scheduling engine.
"""

import logging
from decimal import Decimal
from typing import TYPE_CHECKING

from django.db import transaction

from common.exceptions import ProviderAlreadyExistsError

if TYPE_CHECKING:
    from datetime import date, time
    from apps.businesses.models import Business
    from .models import Provider

logger = logging.getLogger('apps.providers')


# ──────────────────────────────────────────────────────────────────────────────
# ProviderService  (owner-facing CRUD)
# ──────────────────────────────────────────────────────────────────────────────

class ProviderService:
    """
    All business-logic for managing Providers within a Business.

    Rules enforced here (not in views):
      - A User can only have ONE Provider profile across the whole platform
        (Provider.user is a OneToOneField).
      - Creating a Provider automatically adds the user as a BusinessMember
        with role=STAFF if they aren't already a member.
      - Deleting (deactivating) a Provider is a soft operation: is_active=False.
        The BusinessMember record is left intact.
    """

    @staticmethod
    @transaction.atomic
    def create_provider(
        business: 'Business',
        phone: str,
        full_name: str = '',
        specialty: str = '',
        bio: str = '',
        address: str = '',
        service_fee: Decimal = Decimal('0'),
        slot_duration: int = 30,
        category: str = '',
    ) -> 'Provider':
        """
        Creates a Provider record for a user identified by phone number.

        Steps:
          1. Find or create the User by phone.
          2. Set full_name on newly created users (skip for existing users).
          3. Upgrade User.role to PROVIDER if currently CUSTOMER (needed for dashboard access).
          4. Guard against duplicate OneToOne profiles.
          5. Create Provider record.
          6. Ensure the user has an active BusinessMember(role=STAFF) record.

        Raises:
          ProviderAlreadyExistsError — if the user already has a provider profile.
        """
        from apps.accounts.models import User, UserRole
        from apps.businesses.models import BusinessMember, MemberRole
        from .models import Provider

        # ── 1. Resolve user ────────────────────────────────────────────────────
        try:
            user = User.objects.get(phone=phone)
            user_is_new = False
        except User.DoesNotExist:
            user = User.objects.create_user(
                phone=phone,
                full_name=full_name,
                role=UserRole.PROVIDER,
            )
            user_is_new = True

        # ── 2. Set full_name only for newly created accounts ───────────────────
        if user_is_new and full_name:
            User.objects.filter(pk=user.pk).update(full_name=full_name)
            user.full_name = full_name

        # ── 3. Upgrade role if the user is a plain customer ────────────────────
        #
        # A provider user needs isBusinessUser(role) == True on the frontend
        # so they can reach the dashboard. PROVIDER is the current legacy role
        # for this. When a dedicated STAFF role is added to UserRole, update here.
        if not user_is_new and user.role == UserRole.CUSTOMER:
            User.objects.filter(pk=user.pk).update(role=UserRole.PROVIDER)
            user.role = UserRole.PROVIDER

        # ── 4. Guard against duplicate provider profiles ───────────────────────
        existing = Provider.objects.filter(user=user).first()
        if existing is not None:
            if existing.business_id == business.id:
                raise ProviderAlreadyExistsError(
                    'این کاربر قبلاً در این کسب‌وکار به عنوان ارائه‌دهنده ثبت شده است.'
                )
            raise ProviderAlreadyExistsError(
                'این کاربر پروفایل ارائه‌دهنده در کسب‌وکار دیگری دارد. '
                'هر کاربر می‌تواند در یک کسب‌وکار ارائه‌دهنده باشد.'
            )

        # ── 5. Create Provider ────────────────────────────────────────────────
        provider = Provider.objects.create(
            user=user,
            business=business,
            business_name=business.name,       # legacy field — mirrors business
            category=category or business.category,
            specialty=specialty,
            bio=bio,
            address=address,
            service_fee=service_fee,
            slot_duration=slot_duration,
            is_active=True,
        )

        # ── 6. Ensure user is an active BusinessMember (staff level) ──────────
        existing_member = BusinessMember.objects.filter(
            business=business,
            user=user,
        ).first()

        if existing_member is None:
            BusinessMember.objects.create(
                business=business,
                user=user,
                role=MemberRole.STAFF,
                is_active=True,
            )
        elif not existing_member.is_active:
            # Re-activate a previously deactivated membership
            existing_member.is_active = True
            existing_member.save(update_fields=['is_active', 'updated_at'])

        logger.info(
            'Provider created: pk=%s business=%s user=%s new_user=%s',
            provider.pk, business.pk, user.pk, user_is_new,
        )
        return provider

    @staticmethod
    @transaction.atomic
    def update_provider(provider: 'Provider', **fields) -> 'Provider':
        """
        Partial update of a Provider's fields.

        Protected fields that cannot be changed via this method:
          user, business, business_id, id

        Note: business_name is kept in sync with the Business name automatically
        on the public API; don't expose it as user-editable input.
        """
        _PROTECTED = {'user', 'user_id', 'business', 'business_id', 'id'}
        safe = {k: v for k, v in fields.items() if k not in _PROTECTED}

        if not safe:
            return provider

        for attr, value in safe.items():
            setattr(provider, attr, value)

        # Provider does not extend TimeStampedModel — no updated_at field
        provider.save(update_fields=list(safe.keys()))

        logger.info(
            'Provider updated: pk=%s fields=%s',
            provider.pk, list(safe.keys()),
        )
        return provider

    @staticmethod
    @transaction.atomic
    def deactivate_provider(provider: 'Provider') -> None:
        """
        Soft-deactivates a provider (is_active=False).

        The linked BusinessMember record is left intact so the user can still
        log in and see historical data. Re-activation is possible via PATCH.
        """
        if not provider.is_active:
            return  # idempotent

        provider.is_active = False
        provider.save(update_fields=['is_active'])

        logger.info('Provider deactivated: pk=%s', provider.pk)


# ──────────────────────────────────────────────────────────────────────────────
# Legacy slot shims  (DEPRECATED — kept for backward-compat)
# ──────────────────────────────────────────────────────────────────────────────

# weekday() in Python: 0=Monday. Our system: 0=Saturday.
_PYTHON_TO_IRANIAN = {5: 0, 6: 1, 0: 2, 1: 3, 2: 4, 3: 5, 4: 6}


def get_schedule_slots(provider: 'Provider', target_date: 'date', service_id: int | None = None) -> 'list[time]':
    """
    DEPRECATED — use AvailabilityService.get_slots_for_date() instead.

    Returns start times from the schedule (ignores existing bookings).
    Kept for backward compatibility with old appointment booking flow.
    """
    if not provider.business_id:
        return []

    from apps.scheduling.services import AvailabilityService
    from apps.scheduling.selectors import list_services
    from apps.scheduling.models import Service

    if service_id is not None:
        try:
            svc = Service.objects.get(pk=service_id, business_id=provider.business_id, is_active=True)
        except Service.DoesNotExist:
            return []
        resolved_service_id = svc.id
    else:
        first_service = list_services(provider.business_id).first()
        if not first_service:
            return []
        resolved_service_id = first_service.id

    avail = AvailabilityService.get_slots_for_date(
        business_id=provider.business_id,
        date=target_date,
        service_id=resolved_service_id,
        provider_id=provider.id,
    )
    return [slot.start for slot in avail.slots]


def get_available_slots(provider: 'Provider', target_date: 'date', service_id: int | None = None) -> 'list[time]':
    """
    DEPRECATED — use AvailabilityService.get_slots_for_date() instead.

    Returns available (not yet booked) start times.
    """
    return get_schedule_slots(provider, target_date, service_id=service_id)
