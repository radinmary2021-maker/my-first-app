"""
apps/appointments/serializers.py
"""

import datetime

from rest_framework import serializers

from apps.providers.models import Provider

from .models import Appointment, AppointmentStatus


# ──────────────────────────────────────────────────────────────────────────────
# Input serializers
# ──────────────────────────────────────────────────────────────────────────────

class BookAppointmentSerializer(serializers.Serializer):
    """
    Validates a booking request from a customer.
    provider_id is resolved to a Provider object on validation.
    """
    provider_id    = serializers.IntegerField()
    service_id     = serializers.IntegerField(required=False, allow_null=True, default=None)
    date           = serializers.DateField()
    start_time     = serializers.TimeField()
    notes          = serializers.CharField(required=False, allow_blank=True, default='')
    # Guest fields (only needed when user is not authenticated)
    customer_name  = serializers.CharField(required=False, allow_blank=True, default='')
    customer_phone = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_provider_id(self, value: int) -> Provider:
        try:
            return Provider.objects.get(pk=value, is_active=True)
        except Provider.DoesNotExist:
            raise serializers.ValidationError('ارائه‌دهنده یافت نشد.')

    def validate_date(self, value: datetime.date) -> datetime.date:
        from django.utils import timezone
        if value < timezone.localdate():
            raise serializers.ValidationError('تاریخ نمی‌تواند در گذشته باشد.')
        return value


class AppointmentStatusUpdateSerializer(serializers.Serializer):
    """Used by staff to transition appointment status."""
    status = serializers.ChoiceField(choices=AppointmentStatus.choices)


# ──────────────────────────────────────────────────────────────────────────────
# Output serializers
# ──────────────────────────────────────────────────────────────────────────────

class AppointmentSerializer(serializers.ModelSerializer):
    """
    Customer-facing serializer.
    Exposes provider/service info but NOT other customers' data.
    """
    provider_name     = serializers.SerializerMethodField()
    provider_category = serializers.SerializerMethodField()
    service_name      = serializers.SerializerMethodField()
    status_display    = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model  = Appointment
        fields = [
            'id', 'tracking_code',
            'provider_name', 'provider_category', 'service_name',
            'date', 'start_time', 'end_time',
            'status', 'status_display',
            'total_price', 'deposit_paid',
            'notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_provider_name(self, obj: Appointment) -> str:
        if obj.provider_id:
            return getattr(obj.provider, 'business_name', '') or ''
        return ''

    def get_provider_category(self, obj: Appointment) -> str:
        if obj.provider_id:
            try:
                return obj.provider.get_category_display()
            except Exception:
                return ''
        return ''

    def get_service_name(self, obj: Appointment) -> str:
        if obj.service_id:
            return getattr(obj.service, 'name', '') or ''
        return ''


class StaffAppointmentSerializer(serializers.ModelSerializer):
    """
    Staff/owner-facing serializer.
    Includes full customer contact info and provider identity.
    provider_name uses the provider's user.full_name so owners can
    distinguish between multiple providers in their business.
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    service_name   = serializers.SerializerMethodField()
    provider_name  = serializers.SerializerMethodField()

    class Meta:
        model  = Appointment
        fields = [
            'id', 'tracking_code',
            'customer_name', 'customer_phone',
            'provider_name', 'service_name',
            'date', 'start_time', 'end_time',
            'status', 'status_display',
            'total_price', 'deposit_paid',
            'notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_service_name(self, obj: Appointment) -> str:
        if obj.service_id:
            return getattr(obj.service, 'name', '') or ''
        return ''

    def get_provider_name(self, obj: Appointment) -> str:
        if obj.provider_id:
            user = getattr(obj.provider, 'user', None)
            if user:
                return user.full_name or ''
            # Fallback to legacy business_name field
            return obj.provider.business_name or ''
        return ''


# Backward-compat alias (old views import ProviderAppointmentSerializer)
ProviderAppointmentSerializer = StaffAppointmentSerializer
