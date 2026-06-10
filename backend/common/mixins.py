"""
common/mixins.py
View-level mixin that resolves the authenticated user's business context
and attaches it to the request for downstream permission classes.

Design:
  - Lazy resolution: called once per request via `initial()`
  - Sets request.business and request.business_member
  - On failure raises NotFound (no business) or PermissionDenied (inactive)
  - Supports future multi-business via ?business_id= query param
"""

import logging

from rest_framework.exceptions import NotFound, PermissionDenied

logger = logging.getLogger('apps.businesses')


class BusinessContextMixin:
    """
    Include this mixin in any APIView / GenericAPIView that needs
    tenant-scoped data.

    Example:
        class MyView(BusinessContextMixin, APIView):
            permission_classes = [IsAuthenticated, IsBusinessMember]
    """

    def initial(self, request, *args, **kwargs):
        """DRF lifecycle hook — runs after authentication, before dispatch.

        Business context is resolved HERE (before super().initial()) so that
        IsBusinessMember / IsBusinessOwner permission classes have access to
        request.business_member when APIView.check_permissions() is called
        inside super().initial().

        Accessing request.user triggers DRF's lazy JWT authentication, so
        the user is fully authenticated before we query the database.
        """
        # Eagerly resolve business context so permission classes see it.
        if request.user.is_authenticated:
            self._resolve_business_context(request)
        super().initial(request, *args, **kwargs)

    # ── Internal ─────────────────────────────────────────────────────────────

    def _resolve_business_context(self, request) -> None:
        """
        Loads the BusinessMember for the current user and attaches:
            request.business        → Business instance
            request.business_member → BusinessMember instance
        """
        from apps.businesses.models import BusinessMember

        # Allow explicit business selection for future multi-business support
        business_id = request.query_params.get('business_id') or \
                      request.data.get('business_id') if hasattr(request, 'data') else None

        qs = BusinessMember.objects.select_related('business').filter(
            user=request.user,
            is_active=True,
            business__is_deleted=False,
            business__is_active=True,
        )

        if business_id:
            qs = qs.filter(business_id=business_id)

        member = qs.first()

        if member is None:
            # No business found — attach None so permission classes can handle it
            request.business        = None
            request.business_member = None
            return

        if not member.business.is_active:
            raise PermissionDenied('کسب‌وکار شما غیرفعال است. با پشتیبانی تماس بگیرید.')

        request.business        = member.business
        request.business_member = member

        logger.debug(
            'Business context resolved: user=%s business=%s role=%s',
            request.user.pk,
            member.business.slug,
            member.role,
        )

    # ── Convenience accessors for views ──────────────────────────────────────

    @property
    def business(self):
        return getattr(self.request, 'business', None)

    @property
    def business_member(self):
        return getattr(self.request, 'business_member', None)
