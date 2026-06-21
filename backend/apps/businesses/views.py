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
from datetime import date, timedelta

from django.db.models import Count, Q, Sum
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
from apps.appointments.models import Appointment, AppointmentStatus
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
        return Response(BusinessSerializer(self.business, context={'request': request}).data)

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
        return Response(BusinessSerializer(business, context={'request': request}).data)


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


# ──────────────────────────────────────────────────────────────────────────────
# Financial reports
# ──────────────────────────────────────────────────────────────────────────────

class BusinessReportSummaryView(BusinessContextMixin, APIView):
    """
    GET /api/v1/businesses/me/reports/summary/

    Query params:
      period — this_month | last_month | this_week | custom  (default: this_month)
      from   — YYYY-MM-DD  (required when period=custom)
      to     — YYYY-MM-DD  (required when period=custom)
    """
    permission_classes = [IsAuthenticated, IsBusinessOwner]

    def get(self, request):
        period = request.query_params.get('period', 'this_month')
        today  = date.today()

        if period == 'this_week':
            days_since_sat = (today.weekday() - 5 + 7) % 7  # Persian week starts Saturday
            start = today - timedelta(days=days_since_sat)
            end   = today
        elif period == 'last_month':
            first_of_this = today.replace(day=1)
            end   = first_of_this - timedelta(days=1)
            start = end.replace(day=1)
        elif period == 'custom':
            from_str = request.query_params.get('from')
            to_str   = request.query_params.get('to')
            if not from_str or not to_str:
                return Response(
                    {'error': 'پارامترهای from و to برای دوره سفارشی الزامی هستند.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                start = date.fromisoformat(from_str)
                end   = date.fromisoformat(to_str)
            except ValueError:
                return Response(
                    {'error': 'فرمت تاریخ نادرست است. از YYYY-MM-DD استفاده کنید.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if start > end:
                return Response(
                    {'error': 'تاریخ شروع نمی‌تواند بعد از تاریخ پایان باشد.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:  # this_month
            start = today.replace(day=1)
            end   = today

        qs = Appointment.objects.filter(
            business=self.business,
            date__gte=start,
            date__lte=end,
        )

        # Revenue aggregation (completed only)
        rev = qs.filter(status=AppointmentStatus.COMPLETED).aggregate(
            total=Sum('total_price'),
            count=Count('id'),
        )
        total_revenue   = int(rev['total'] or 0)
        completed_count = rev['count'] or 0

        # By-status counts
        by_status = {
            row['status']: row['cnt']
            for row in qs.values('status').annotate(cnt=Count('id'))
        }

        # Top 5 services by appointment count
        top_services = [
            {
                'name':    row['service__name'],
                'count':   row['cnt'],
                'revenue': int(row['rev'] or 0),
            }
            for row in (
                qs.filter(service__isnull=False)
                .values('service__name')
                .annotate(cnt=Count('id'), rev=Sum('total_price'))
                .order_by('-cnt')[:5]
            )
        ]

        # Daily breakdown
        daily_appointments = [
            {
                'date':    str(row['date']),
                'count':   row['cnt'],
                'revenue': int(row['rev'] or 0),
            }
            for row in (
                qs.values('date')
                .annotate(
                    cnt=Count('id'),
                    rev=Sum('total_price', filter=Q(status=AppointmentStatus.COMPLETED)),
                )
                .order_by('date')
            )
        ]

        return Response({
            'period': period,
            'from':   str(start),
            'to':     str(end),
            'revenue': {
                'total':           total_revenue,
                'completed_count': completed_count,
                'average':         total_revenue // completed_count if completed_count else 0,
            },
            'appointments': {
                'total':     qs.count(),
                'by_status': by_status,
            },
            'top_services':        top_services,
            'daily_appointments':  daily_appointments,
        })


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
