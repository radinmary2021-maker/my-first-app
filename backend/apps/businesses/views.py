"""
apps/businesses/views.py
REST API for business and member management.

URL structure (see urls.py):
  POST   /api/v1/businesses/                         → create business
  GET    /api/v1/businesses/me/                      → my business
  PATCH  /api/v1/businesses/me/                      → update business

  GET    /api/v1/businesses/me/members/              → list members
  POST   /api/v1/businesses/me/members/              → add member
  PATCH  /api/v1/businesses/me/members/{id}/role/    → change role
  DELETE /api/v1/businesses/me/members/{id}/         → remove member

  GET    /api/v1/businesses/me/branches/             → list branches
  POST   /api/v1/businesses/me/branches/             → create branch
  PATCH  /api/v1/businesses/me/branches/{id}/        → update branch
  DELETE /api/v1/businesses/me/branches/{id}/        → deactivate branch
"""

import logging

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.exceptions import (
    CannotRemoveOwnerError,
    MemberAlreadyExistsError,
)
from common.mixins import BusinessContextMixin
from common.permissions import IsBusinessMember, IsBusinessOwner
from apps.accounts.models import User
from .models import Branch, BusinessMember
from .serializers import (
    AddMemberSerializer,
    BranchCreateSerializer,
    BranchSerializer,
    BusinessCreateSerializer,
    BusinessMemberSerializer,
    BusinessSerializer,
    BusinessUpdateSerializer,
    UpdateMemberRoleSerializer,
)
from .services import BusinessService

logger = logging.getLogger('apps.businesses')


# ──────────────────────────────────────────────────────────────────────────────
# Business CRUD
# ──────────────────────────────────────────────────────────────────────────────

class BusinessCreateView(APIView):
    """
    POST /api/v1/businesses/
    Any authenticated user can create a business.
    Their global role is elevated to OWNER automatically.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BusinessCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            business = BusinessService.create_business(
                owner    = request.user,
                name     = data['name'],
                category = data['category'],
                phone    = data.get('phone', ''),
                address  = data.get('address', ''),
            )
        except ValueError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            BusinessSerializer(business).data,
            status=status.HTTP_201_CREATED,
        )


class MyBusinessView(BusinessContextMixin, APIView):
    """
    GET   /api/v1/businesses/me/  → business details + member count
    PATCH /api/v1/businesses/me/  → partial update (owner only)
    """
    permission_classes = [IsAuthenticated, IsBusinessMember]

    def get(self, request):
        return Response(BusinessSerializer(self.business).data)

    def patch(self, request):
        # Inline ownership check (write operation)
        if not self.business_member.is_owner:
            return Response(
                {'error': 'فقط مالک کسب‌وکار می‌تواند تغییرات اعمال کند.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = BusinessUpdateSerializer(
            self.business, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        business = serializer.save()
        return Response(BusinessSerializer(business).data)


# ──────────────────────────────────────────────────────────────────────────────
# Member management
# ──────────────────────────────────────────────────────────────────────────────

class MemberListView(BusinessContextMixin, APIView):
    """
    GET  /api/v1/businesses/me/members/  → list all active members
    POST /api/v1/businesses/me/members/  → invite a member by phone (owner only)
    """
    permission_classes = [IsAuthenticated, IsBusinessMember]

    def get(self, request):
        members = (
            BusinessMember.objects
            .filter(business=self.business, is_active=True)
            .select_related('user')
            .order_by('created_at')
        )
        return Response(BusinessMemberSerializer(members, many=True).data)

    def post(self, request):
        if not self.business_member.is_owner:
            return Response(
                {'error': 'فقط مالک کسب‌وکار می‌تواند عضو اضافه کند.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AddMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data['phone']
        role  = serializer.validated_data['role']

        target_user = User.objects.filter(phone=phone).first()
        if not target_user:
            return Response(
                {'error': 'کاربری با این شماره در سیستم یافت نشد. ابتدا باید در Nobatic ثبت‌نام کند.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            member = BusinessService.add_member(
                business  = self.business,
                user      = target_user,
                role      = role,
                added_by  = request.user,
            )
        except MemberAlreadyExistsError as exc:
            return Response({'error': exc.message}, status=status.HTTP_409_CONFLICT)

        return Response(
            BusinessMemberSerializer(member).data,
            status=status.HTTP_201_CREATED,
        )


class MemberDetailView(BusinessContextMixin, APIView):
    """
    PATCH  /api/v1/businesses/me/members/{id}/role/ → change role (owner only)
    DELETE /api/v1/businesses/me/members/{id}/      → remove member (owner only)
    """
    permission_classes = [IsAuthenticated, IsBusinessOwner]

    def _get_member(self, pk: int) -> BusinessMember:
        return get_object_or_404(
            BusinessMember,
            pk=pk,
            business=self.business,
            is_active=True,
        )

    def patch(self, request, pk):
        """Change a member's role."""
        serializer = UpdateMemberRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        member = self._get_member(pk)
        try:
            member = BusinessService.change_member_role(
                business    = self.business,
                target_user = member.user,
                new_role    = serializer.validated_data['role'],
            )
        except (ValueError, CannotRemoveOwnerError) as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(BusinessMemberSerializer(member).data)

    def delete(self, request, pk):
        """Remove (soft-deactivate) a member."""
        member = self._get_member(pk)
        try:
            BusinessService.remove_member(
                business    = self.business,
                target_user = member.user,
            )
        except CannotRemoveOwnerError as exc:
            return Response({'error': exc.message}, status=status.HTTP_400_BAD_REQUEST)

        return Response(status=status.HTTP_204_NO_CONTENT)


# ──────────────────────────────────────────────────────────────────────────────
# Branch management  (Enterprise plan)
# ──────────────────────────────────────────────────────────────────────────────

class BranchListView(BusinessContextMixin, APIView):
    """
    GET  /api/v1/businesses/me/branches/  → list active branches
    POST /api/v1/businesses/me/branches/  → create branch (owner only)
    """
    permission_classes = [IsAuthenticated, IsBusinessMember]

    def get(self, request):
        branches = self.business.branches.filter(is_active=True).order_by('created_at')
        return Response(BranchSerializer(branches, many=True).data)

    def post(self, request):
        if not self.business_member.is_owner:
            return Response(
                {'error': 'فقط مالک کسب‌وکار می‌تواند شعبه ایجاد کند.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = BranchCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        branch = serializer.save(business=self.business)
        return Response(BranchSerializer(branch).data, status=status.HTTP_201_CREATED)


class BranchDetailView(BusinessContextMixin, APIView):
    """
    PATCH  /api/v1/businesses/me/branches/{id}/  → update branch (owner only)
    DELETE /api/v1/businesses/me/branches/{id}/  → deactivate branch (owner only)
    """
    permission_classes = [IsAuthenticated, IsBusinessOwner]

    def _get_branch(self, pk: int) -> Branch:
        return get_object_or_404(Branch, pk=pk, business=self.business, is_active=True)

    def patch(self, request, pk):
        branch     = self._get_branch(pk)
        serializer = BranchCreateSerializer(branch, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        branch = serializer.save()
        return Response(BranchSerializer(branch).data)

    def delete(self, request, pk):
        branch           = self._get_branch(pk)
        branch.is_active = False
        branch.save(update_fields=['is_active', 'updated_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)
