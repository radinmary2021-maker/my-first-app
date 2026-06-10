"""
apps/businesses/services.py
Business domain logic — pure Python, no HTTP concerns.

All public functions are @staticmethod on BusinessService to keep the
namespace clear.  Views call these functions; they never touch ORM directly.
"""

import logging

from django.db import transaction

from common.exceptions import (
    CannotRemoveOwnerError,
    MemberAlreadyExistsError,
)
from apps.accounts.models import User, UserRole
from .models import Business, BusinessCategory, BusinessMember, MemberRole

logger = logging.getLogger('apps.businesses')


class BusinessService:
    """Encapsulates all business / member mutation logic."""

    # ── Business lifecycle ─────────────────────────────────────────────────

    @staticmethod
    @transaction.atomic
    def create_business(
        owner: User,
        name: str,
        category: str = BusinessCategory.OTHER,
        **kwargs,
    ) -> Business:
        """
        Creates a Business and automatically:
          1. Generates a unique slug from the name.
          2. Creates a BusinessMember(role=OWNER) for the owner.
          3. Elevates the user's global role to OWNER if not already elevated.

        Raises:
          ValueError: if name is blank or category is invalid.
        """
        name = name.strip()
        if not name:
            raise ValueError('نام کسب‌وکار نمی‌تواند خالی باشد.')

        if category not in BusinessCategory.values:
            raise ValueError(f'دسته‌بندی نامعتبر: {category}')

        business = Business.objects.create(
            owner=owner,
            name=name,
            category=category,
            **kwargs,
        )

        BusinessMember.objects.create(
            business=business,
            user=owner,
            role=MemberRole.OWNER,
            is_active=True,
        )

        # Elevate global role so JWTs reflect the new responsibility
        if owner.role not in (UserRole.OWNER, UserRole.ADMIN):
            User.objects.filter(pk=owner.pk).update(role=UserRole.OWNER)
            owner.role = UserRole.OWNER  # update in-memory object too

        logger.info('Business created: pk=%s slug=%s owner=%s', business.pk, business.slug, owner.pk)
        return business

    @staticmethod
    @transaction.atomic
    def update_business(business: Business, **fields) -> Business:
        """
        Partial update of business fields.
        Excludes protected fields: owner, slug, is_deleted.
        """
        protected = {'owner', 'slug', 'is_deleted', 'deleted_at'}
        safe_fields = {k: v for k, v in fields.items() if k not in protected}

        for attr, value in safe_fields.items():
            setattr(business, attr, value)

        update_fields = list(safe_fields.keys()) + ['updated_at']
        business.save(update_fields=update_fields)
        return business

    # ── Member management ──────────────────────────────────────────────────

    @staticmethod
    def get_active_member(user: User, business: Business) -> BusinessMember | None:
        """Returns the active membership or None."""
        return BusinessMember.objects.filter(
            user=user,
            business=business,
            is_active=True,
        ).first()

    @staticmethod
    def get_user_primary_business(user: User) -> Business | None:
        """
        Returns the user's primary (first) business.
        Future: support ?business_id= to switch between businesses.
        """
        member = (
            BusinessMember.objects
            .select_related('business')
            .filter(user=user, is_active=True, business__is_deleted=False)
            .order_by('created_at')
            .first()
        )
        return member.business if member else None

    @staticmethod
    @transaction.atomic
    def add_member(
        business: Business,
        user: User,
        role: str = MemberRole.STAFF,
        added_by: User | None = None,
    ) -> BusinessMember:
        """
        Adds a user to the business.  If the user was previously deactivated,
        reactivates them instead of creating a duplicate record.

        Raises:
          MemberAlreadyExistsError: if the user is already an active member.
        """
        existing = BusinessMember.objects.filter(business=business, user=user).first()

        if existing:
            if existing.is_active:
                raise MemberAlreadyExistsError()
            # Re-activate a previously removed member
            existing.is_active = True
            existing.role      = role
            existing.save(update_fields=['is_active', 'role', 'updated_at'])
            logger.info('Member reactivated: user=%s business=%s', user.pk, business.pk)
            return existing

        member = BusinessMember.objects.create(
            business=business,
            user=user,
            role=role,
            is_active=True,
        )
        logger.info(
            'Member added: user=%s business=%s role=%s by=%s',
            user.pk, business.pk, role, added_by.pk if added_by else 'system',
        )
        return member

    @staticmethod
    @transaction.atomic
    def remove_member(business: Business, target_user: User) -> None:
        """
        Soft-removes a member (sets is_active=False).

        Raises:
          CannotRemoveOwnerError: if trying to remove the business owner.
        """
        if target_user.pk == business.owner_id:
            raise CannotRemoveOwnerError()

        BusinessMember.objects.filter(
            business=business,
            user=target_user,
            is_active=True,
        ).update(is_active=False)

        logger.info('Member removed: user=%s business=%s', target_user.pk, business.pk)

    @staticmethod
    @transaction.atomic
    def change_member_role(
        business: Business,
        target_user: User,
        new_role: str,
    ) -> BusinessMember:
        """Changes a member's role. Cannot demote the owner."""
        member = BusinessMember.objects.filter(
            business=business,
            user=target_user,
            is_active=True,
        ).first()

        if not member:
            raise ValueError('این کاربر عضو فعال کسب‌وکار نیست.')

        if target_user.pk == business.owner_id and new_role != MemberRole.OWNER:
            raise CannotRemoveOwnerError('نقش مالک کسب‌وکار را نمی‌توان تغییر داد.')

        member.role = new_role
        member.save(update_fields=['role', 'updated_at'])
        return member
