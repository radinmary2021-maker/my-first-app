"""
apps/appointments/views.py

URL layout (mounted at /api/v1/appointments/ AND legacy /api/appointments/):

  POST   /                          BookAppointmentView
  GET    /mine/                     MyAppointmentsView
  GET    /provider/                 ProviderAppointmentsView (staff)
  GET    /business/                 BusinessAppointmentsView (owner/staff)
  POST   /<pk>/cancel/              CancelAppointmentView
  POST   /<pk>/confirm/             ConfirmAppointmentView  (staff)
  POST   /<pk>/complete/            CompleteAppointmentView (staff)
  POST   /<pk>/no-show/             NoShowAppointmentView   (staff)
  GET    /track/<code>/             TrackingView            (public)
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from common.mixins import BusinessContextMixin
from common.permissions import IsBusinessMember

from .models import Appointment
from .selectors import (
    get_appointment_by_id,
    get_appointment_by_tracking_code,
    list_appointments_for_customer,
    list_appointments_for_provider,
    list_appointments_for_business,
)
from .serializers import (
    AppointmentSerializer,
    BookAppointmentSerializer,
    StaffAppointmentSerializer,
    ProviderAppointmentSerializer,
)
from .services import AppointmentService, BookingError


def _booking_error_response(exc: BookingError):
    return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)


def _not_found_response():
    return Response({'error': 'نوبت یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)


# ──────────────────────────────────────────────────────────────────────────────
# Customer-facing
# ──────────────────────────────────────────────────────────────────────────────

class BookAppointmentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BookAppointmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        provider = d['provider_id']  # resolved to Provider object in validator

        try:
            appointment = AppointmentService.create_appointment(
                business_id=provider.business_id,
                provider=provider,
                date=d['date'],
                start_time=d['start_time'],
                service_id=d.get('service_id'),
                customer=request.user,
                notes=d.get('notes', ''),
            )
        except BookingError as e:
            return _booking_error_response(e)

        return Response(
            AppointmentSerializer(appointment).data,
            status=status.HTTP_201_CREATED,
        )


class MyAppointmentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = list_appointments_for_customer(
            customer_id=request.user.id,
            status=request.query_params.get('status'),
            upcoming_only=request.query_params.get('upcoming') == '1',
        )
        return Response(AppointmentSerializer(qs, many=True).data)


class CancelAppointmentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        appointment = get_appointment_by_id(pk)
        if not appointment:
            return _not_found_response()

        try:
            AppointmentService.cancel_appointment(appointment, request.user)
        except BookingError as e:
            return _booking_error_response(e)

        return Response(AppointmentSerializer(appointment).data)


class TrackingView(APIView):
    """Public endpoint — no auth required. Returns minimal info."""
    permission_classes = [AllowAny]

    def get(self, request, code):
        appointment = get_appointment_by_tracking_code(code)
        if not appointment:
            return _not_found_response()
        return Response({
            'tracking_code': appointment.tracking_code,
            'status':        appointment.status,
            'status_display': appointment.get_status_display(),
            'date':          appointment.date,
            'start_time':    appointment.start_time,
            'end_time':      appointment.end_time,
            'provider_name': getattr(appointment.provider, 'business_name', ''),
        })


# ──────────────────────────────────────────────────────────────────────────────
# Provider / Staff-facing
# ──────────────────────────────────────────────────────────────────────────────

class ProviderAppointmentsView(APIView):
    """
    Provider sees only their own appointments.
    Requires user to have a linked provider_profile.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'provider_profile'):
            return Response(
                {'error': 'پروفایل ارائه‌دهنده یافت نشد.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        provider = request.user.provider_profile
        params   = request.query_params

        qs = list_appointments_for_provider(
            provider_id=provider.id,
            business_id=provider.business_id,
            date=params.get('date'),
            status=params.get('status'),
        )
        return Response(StaffAppointmentSerializer(qs, many=True).data)


class BusinessAppointmentsView(BusinessContextMixin, APIView):
    """
    Owner/staff can see ALL appointments for their business.
    Filterable by ?date=, ?status=, ?provider_id=
    """
    permission_classes = [IsAuthenticated, IsBusinessMember]

    def get(self, request):
        params = request.query_params
        qs = list_appointments_for_business(
            business_id=self.business.id,
            date=params.get('date'),
            status=params.get('status'),
            provider_id=params.get('provider_id'),
        )
        return Response(StaffAppointmentSerializer(qs, many=True).data)


class ConfirmAppointmentView(BusinessContextMixin, APIView):
    permission_classes = [IsAuthenticated, IsBusinessMember]

    def post(self, request, pk):
        appointment = get_appointment_by_id(pk, business_id=self.business.id)
        if not appointment:
            return _not_found_response()
        try:
            AppointmentService.confirm_appointment(appointment, request.user)
        except BookingError as e:
            return _booking_error_response(e)
        return Response(StaffAppointmentSerializer(appointment).data)


class CompleteAppointmentView(BusinessContextMixin, APIView):
    permission_classes = [IsAuthenticated, IsBusinessMember]

    def post(self, request, pk):
        appointment = get_appointment_by_id(pk, business_id=self.business.id)
        if not appointment:
            return _not_found_response()
        try:
            AppointmentService.complete_appointment(appointment, request.user)
        except BookingError as e:
            return _booking_error_response(e)
        return Response(StaffAppointmentSerializer(appointment).data)


class NoShowAppointmentView(BusinessContextMixin, APIView):
    permission_classes = [IsAuthenticated, IsBusinessMember]

    def post(self, request, pk):
        appointment = get_appointment_by_id(pk, business_id=self.business.id)
        if not appointment:
            return _not_found_response()
        try:
            AppointmentService.mark_no_show(appointment, request.user)
        except BookingError as e:
            return _booking_error_response(e)
        return Response(StaffAppointmentSerializer(appointment).data)
