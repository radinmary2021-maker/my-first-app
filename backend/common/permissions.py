"""
common/permissions.py
Reusable DRF permission classes for multi-tenant business logic.

All business-scoped permissions depend on request.business_member being
populated by BusinessContextMixin (common/mixins.py).
"""

from rest_framework.permissions import BasePermission


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def _get_member(request):
    """Safe accessor for the business member attached to the request."""
    return getattr(request, 'business_member', None)


# ──────────────────────────────────────────────────────────────────────────────
# Business-scoped permissions
# ──────────────────────────────────────────────────────────────────────────────

class IsBusinessMember(BasePermission):
    """
    Grants access to any active member of the resolved business
    (owner OR staff).

    Requires: BusinessContextMixin has already set request.business_member.
    """
    message = 'شما عضو این کسب‌وکار نیستید.'

    def has_permission(self, request, view):
        member = _get_member(request)
        return (
            request.user.is_authenticated
            and member is not None
            and member.is_active
        )


class IsBusinessOwner(BasePermission):
    """Only the owner of the business."""
    message = 'فقط مالک کسب‌وکار به این بخش دسترسی دارد.'

    def has_permission(self, request, view):
        from apps.businesses.models import MemberRole
        member = _get_member(request)
        return (
            request.user.is_authenticated
            and member is not None
            and member.is_active
            and member.role == MemberRole.OWNER
        )


class IsBusinessOwnerOrReadOnly(BasePermission):
    """Owner can write; any active member can read."""
    message = 'فقط مالک کسب‌وکار می‌تواند تغییرات اعمال کند.'

    def has_permission(self, request, view):
        from apps.businesses.models import MemberRole
        member = _get_member(request)
        if not request.user.is_authenticated or member is None or not member.is_active:
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return member.role == MemberRole.OWNER


# ──────────────────────────────────────────────────────────────────────────────
# System-level permissions
# ──────────────────────────────────────────────────────────────────────────────

class IsSuperAdmin(BasePermission):
    """Only platform super-admins (UserRole.ADMIN)."""
    message = 'فقط ادمین سیستم به این بخش دسترسی دارد.'

    def has_permission(self, request, view):
        from apps.accounts.models import UserRole
        return (
            request.user.is_authenticated
            and request.user.role == UserRole.ADMIN
        )
