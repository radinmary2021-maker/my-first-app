"""
apps/scheduling/serializers.py

Serializers for:
  - Service         (CRUD by business owner/staff)
  - WorkingHours    (CRUD by business owner/staff)
  - TimeOff         (CRUD by business owner/staff)
  - TimeSlot        (read-only, returned by availability endpoint)
  - DayAvailability (read-only, returned by availability endpoint)
"""

import datetime

from rest_framework import serializers

from .models import Service, WorkingHours, TimeOff, Weekday
from .services import TimeSlot, DayAvailability


# ──────────────────────────────────────────────────────────────────────────────
# Service
# ──────────────────────────────────────────────────────────────────────────────

class ServiceSerializer(serializers.ModelSerializer):
    total_minutes = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model  = Service
        fields = [
            'id', 'name', 'description',
            'duration_minutes', 'buffer_minutes', 'total_minutes',
            'price', 'color', 'is_active', 'provider',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'total_minutes', 'created_at', 'updated_at']
        extra_kwargs = {
            'provider': {'required': False, 'allow_null': True, 'default': None},
        }

    def get_total_minutes(self, obj: Service) -> int:
        return obj.total_minutes

    def validate_duration_minutes(self, value: int) -> int:
        if value < 5:
            raise serializers.ValidationError('مدت خدمت باید حداقل ۵ دقیقه باشد.')
        return value


# ──────────────────────────────────────────────────────────────────────────────
# WorkingHours
# ──────────────────────────────────────────────────────────────────────────────

class WorkingHoursSerializer(serializers.ModelSerializer):
    weekday_display = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model  = WorkingHours
        fields = [
            'id', 'weekday', 'weekday_display',
            'start_time', 'end_time', 'is_active',
            'provider',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'weekday_display', 'created_at', 'updated_at']
        extra_kwargs = {
            'provider': {'required': False, 'allow_null': True, 'default': None},
        }

    def get_weekday_display(self, obj: WorkingHours) -> str:
        return obj.get_weekday_display()

    def validate(self, data: dict) -> dict:
        if not data.get('is_active', True):
            return data
        start = data.get('start_time')
        end   = data.get('end_time')
        if start and end and start >= end:
            raise serializers.ValidationError('ساعت شروع باید قبل از ساعت پایان باشد.')
        return data


class WorkingHoursBulkSerializer(serializers.Serializer):
    """
    Accepts a list of working-hours entries for bulk upsert.
    Used by the owner to set the full weekly schedule at once.
    """
    hours = WorkingHoursSerializer(many=True)

    def validate_hours(self, value: list) -> list:
        weekdays = [entry['weekday'] for entry in value]
        if len(weekdays) != len(set(weekdays)):
            raise serializers.ValidationError('هر روز هفته فقط یک بار مجاز است.')
        return value


# ──────────────────────────────────────────────────────────────────────────────
# TimeOff
# ──────────────────────────────────────────────────────────────────────────────

class TimeOffSerializer(serializers.ModelSerializer):
    is_full_day = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model  = TimeOff
        fields = [
            'id', 'date', 'start_time', 'end_time',
            'is_full_day', 'reason', 'provider',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'is_full_day', 'created_at', 'updated_at']
        extra_kwargs = {
            'provider':   {'required': False, 'allow_null': True},
            'start_time': {'required': False, 'allow_null': True},
            'end_time':   {'required': False, 'allow_null': True},
        }

    def get_is_full_day(self, obj: TimeOff) -> bool:
        return obj.is_full_day

    def validate(self, data: dict) -> dict:
        start = data.get('start_time')
        end   = data.get('end_time')
        if bool(start) != bool(end):
            raise serializers.ValidationError(
                'start_time و end_time باید هر دو خالی یا هر دو پر باشند.'
            )
        if start and end and start >= end:
            raise serializers.ValidationError('ساعت شروع باید قبل از ساعت پایان باشد.')
        return data

    def validate_date(self, value: datetime.date) -> datetime.date:
        from django.utils import timezone
        if value < timezone.localdate():
            raise serializers.ValidationError('نمی‌توان برای تاریخ گذشته مرخصی ثبت کرد.')
        return value


# ──────────────────────────────────────────────────────────────────────────────
# Availability (read-only output serializers)
# ──────────────────────────────────────────────────────────────────────────────

class TimeSlotSerializer(serializers.Serializer):
    start            = serializers.TimeField(format='%H:%M')
    end              = serializers.TimeField(format='%H:%M')
    duration_minutes = serializers.IntegerField()
    service_id       = serializers.IntegerField()


class DayAvailabilitySerializer(serializers.Serializer):
    date              = serializers.DateField()
    is_day_off        = serializers.BooleanField()
    no_working_hours  = serializers.BooleanField()
    has_slots         = serializers.BooleanField()
    slots             = TimeSlotSerializer(many=True)


# ──────────────────────────────────────────────────────────────────────────────
# Query param serializers (for GET requests)
# ──────────────────────────────────────────────────────────────────────────────

class AvailabilityQuerySerializer(serializers.Serializer):
    """Validates ?date=YYYY-MM-DD&service_id=N&provider_id=N"""
    date       = serializers.DateField(required=True)
    service_id = serializers.IntegerField(required=True)
    provider_id = serializers.IntegerField(required=False, allow_null=True, default=None)

    def validate_date(self, value: datetime.date) -> datetime.date:
        from django.utils import timezone
        from .services import MAX_DAYS_AHEAD
        today = timezone.localdate()
        if value < today:
            raise serializers.ValidationError('تاریخ نمی‌تواند در گذشته باشد.')
        if (value - today).days > MAX_DAYS_AHEAD:
            raise serializers.ValidationError(
                f'حداکثر {MAX_DAYS_AHEAD} روز آینده قابل رزرو است.'
            )
        return value


class AvailabilityRangeQuerySerializer(serializers.Serializer):
    """Validates ?date_from=...&date_to=...&service_id=N&provider_id=N"""
    date_from   = serializers.DateField(required=True)
    date_to     = serializers.DateField(required=True)
    service_id  = serializers.IntegerField(required=True)
    provider_id = serializers.IntegerField(required=False, allow_null=True, default=None)

    def validate(self, data: dict) -> dict:
        from django.utils import timezone
        from .services import MAX_DAYS_AHEAD
        today = timezone.localdate()
        if data['date_from'] > data['date_to']:
            raise serializers.ValidationError('date_from باید قبل یا برابر date_to باشد.')
        if (data['date_to'] - today).days > MAX_DAYS_AHEAD:
            raise serializers.ValidationError(
                f'حداکثر تا {MAX_DAYS_AHEAD} روز آینده قابل بررسی است.'
            )
        if (data['date_to'] - data['date_from']).days > 31:
            raise serializers.ValidationError('بازه زمانی حداکثر ۳۱ روز مجاز است.')
        return data
