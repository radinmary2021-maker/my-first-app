"""
apps/scheduling/views.py

URL structure (all under /api/v1/businesses/):
  services/                      ServiceListView
  services/<pk>/                 ServiceDetailView
  working-hours/                 WorkingHoursListView
  working-hours/<pk>/            WorkingHoursDetailView
  working-hours/bulk/            WorkingHoursBulkView
  timeoffs/                      TimeOffListView
  timeoffs/<pk>/                 TimeOffDetailView
  availability/                  AvailabilityView       (single date)
  availability/range/            AvailabilityRangeView  (date range)

All views require BusinessContextMixin — business is resolved from the
authenticated user's membership.
"""

import datetime

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from common.mixins import BusinessContextMixin
from common.permissions import IsBusinessMember, IsBusinessOwner

from .models import Service, WorkingHours, TimeOff
from .selectors import list_services, list_working_hours, list_timeoffs
from .services import AvailabilityService, WorkingHoursService
from .serializers import (
    ServiceSerializer,
    WorkingHoursSerializer,
    WorkingHoursBulkSerializer,
    TimeOffSerializer,
    DayAvailabilitySerializer,
    AvailabilityQuerySerializer,
    AvailabilityRangeQuerySerializer,
)


# ──────────────────────────────────────────────────────────────────────────────
# Services
# ──────────────────────────────────────────────────────────────────────────────

class ServiceListView(BusinessContextMixin, generics.ListCreateAPIView):
    """
    GET  → list active services for this business
    POST → create a new service (owner/staff only)
    """
    serializer_class   = ServiceSerializer
    permission_classes = [IsAuthenticated, IsBusinessMember]

    def get_queryset(self):
        return list_services(self.business.id)

    def perform_create(self, serializer):
        serializer.save(business=self.business)


class ServiceDetailView(BusinessContextMixin, generics.RetrieveUpdateDestroyAPIView):
    """
    GET    → retrieve single service
    PATCH  → update service (owner only)
    DELETE → deactivate service (owner only, soft)
    """
    serializer_class = ServiceSerializer
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated(), IsBusinessMember()]
        return [IsAuthenticated(), IsBusinessOwner()]

    def get_queryset(self):
        return Service.objects.filter(business=self.business)

    def perform_destroy(self, instance):
        # Soft delete — just deactivate instead of removing from DB
        instance.is_active = False
        instance.save(update_fields=['is_active', 'updated_at'])


# ──────────────────────────────────────────────────────────────────────────────
# Working Hours
# ──────────────────────────────────────────────────────────────────────────────

class WorkingHoursListView(BusinessContextMixin, generics.ListCreateAPIView):
    """
    GET  → list working hours (filter by ?provider_id=N for provider-level)
    POST → add a single weekday's hours
    """
    serializer_class   = WorkingHoursSerializer
    permission_classes = [IsAuthenticated, IsBusinessMember]

    def get_queryset(self):
        provider_id = self.request.query_params.get('provider_id')
        pid = int(provider_id) if provider_id and provider_id.isdigit() else None
        return list_working_hours(self.business.id, provider_id=pid)

    def perform_create(self, serializer):
        serializer.save(business=self.business)

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsBusinessOwner()]
        return [IsAuthenticated(), IsBusinessMember()]


class WorkingHoursDetailView(BusinessContextMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class  = WorkingHoursSerializer
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated(), IsBusinessMember()]
        return [IsAuthenticated(), IsBusinessOwner()]

    def get_queryset(self):
        return WorkingHours.objects.filter(business=self.business)

    def perform_destroy(self, instance):
        instance.delete()
        # Invalidate cache for future dates on this weekday
        AvailabilityService.invalidate_provider_date(
            self.business.id,
            datetime.date.today(),
            instance.provider_id,
        )


class WorkingHoursBulkView(BusinessContextMixin, APIView):
    """
    PUT /working-hours/bulk/

    Accepts a full week's schedule and upserts all entries atomically.
    Existing weekdays not in the payload are deactivated.

    Request body:
      { "hours": [ { "weekday": 0, "start_time": "09:00", "end_time": "17:00" }, ... ] }
    """
    permission_classes = [IsAuthenticated, IsBusinessOwner]

    def put(self, request, *args, **kwargs):
        serializer = WorkingHoursBulkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        hours_data = serializer.validated_data['hours']
        provider_id = request.data.get('provider_id')
        pid = int(provider_id) if provider_id else None

        from django.db import transaction
        with transaction.atomic():
            submitted_weekdays = set()
            results = []
            for entry in hours_data:
                wh = WorkingHoursService.set_working_hours(
                    business_id=self.business.id,
                    weekday=entry['weekday'],
                    start_time=entry['start_time'],
                    end_time=entry['end_time'],
                    provider_id=pid,
                    is_active=entry.get('is_active', True),
                )
                submitted_weekdays.add(entry['weekday'])
                results.append(wh)

            # Deactivate weekdays not included in the payload
            WorkingHours.objects.filter(
                business=self.business,
                provider_id=pid,
            ).exclude(weekday__in=submitted_weekdays).update(is_active=False)

        output = WorkingHoursSerializer(results, many=True)
        return Response(output.data, status=status.HTTP_200_OK)


# ──────────────────────────────────────────────────────────────────────────────
# Time Off
# ──────────────────────────────────────────────────────────────────────────────

class TimeOffListView(BusinessContextMixin, generics.ListCreateAPIView):
    """
    GET  → list timeoffs (?provider_id=N, ?date_from=, ?date_to=)
    POST → add a timeoff entry
    """
    serializer_class = TimeOffSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsBusinessOwner()]
        return [IsAuthenticated(), IsBusinessMember()]

    def get_queryset(self):
        params      = self.request.query_params
        provider_id = params.get('provider_id')
        date_from   = params.get('date_from')
        date_to     = params.get('date_to')

        pid = int(provider_id) if provider_id and provider_id.isdigit() else None
        df  = datetime.date.fromisoformat(date_from) if date_from else None
        dt  = datetime.date.fromisoformat(date_to)   if date_to  else None

        return list_timeoffs(self.business.id, provider_id=pid, date_from=df, date_to=dt)

    def perform_create(self, serializer):
        instance = serializer.save(business=self.business)
        AvailabilityService.invalidate_provider_date(
            self.business.id,
            instance.date,
            instance.provider_id,
        )


class TimeOffDetailView(BusinessContextMixin, generics.RetrieveDestroyAPIView):
    permission_classes = [IsAuthenticated, IsBusinessOwner]

    def get_queryset(self):
        return TimeOff.objects.filter(business=self.business)

    def perform_destroy(self, instance):
        date        = instance.date
        provider_id = instance.provider_id
        instance.delete()
        AvailabilityService.invalidate_provider_date(
            self.business.id, date, provider_id
        )


# ──────────────────────────────────────────────────────────────────────────────
# Availability  (public-facing — customers use this)
# ──────────────────────────────────────────────────────────────────────────────

class AvailabilityView(BusinessContextMixin, APIView):
    """
    GET /availability/?date=YYYY-MM-DD&service_id=N&provider_id=N

    Public endpoint — authenticated users (customers included).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        query = AvailabilityQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        params = query.validated_data

        availability = AvailabilityService.get_slots_for_date(
            business_id=self.business.id,
            date=params['date'],
            service_id=params['service_id'],
            provider_id=params['provider_id'],
        )
        return Response(DayAvailabilitySerializer(availability).data)


class AvailabilityRangeView(BusinessContextMixin, APIView):
    """
    GET /availability/range/?date_from=...&date_to=...&service_id=N&provider_id=N

    Returns a list of DayAvailability objects — one per day in the range.
    The frontend uses this to render the calendar month view.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        query = AvailabilityRangeQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        params = query.validated_data

        days = AvailabilityService.get_slots_for_range(
            business_id=self.business.id,
            date_from=params['date_from'],
            date_to=params['date_to'],
            service_id=params['service_id'],
            provider_id=params['provider_id'],
        )
        return Response(DayAvailabilitySerializer(days, many=True).data)
