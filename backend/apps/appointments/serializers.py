from datetime import date, time

from rest_framework import serializers

from apps.doctors.models import Doctor

from .models import Appointment


class BookAppointmentSerializer(serializers.Serializer):
    doctor_id = serializers.IntegerField()
    date = serializers.DateField()
    start_time = serializers.TimeField()

    def validate_doctor_id(self, value):
        try:
            doctor = Doctor.objects.get(pk=value, is_active=True)
        except Doctor.DoesNotExist:
            raise serializers.ValidationError('پزشک یافت نشد.')
        return doctor

    def validate_date(self, value):
        if value < date.today():
            raise serializers.ValidationError('تاریخ نمی‌تواند در گذشته باشد.')
        return value


class AppointmentSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.user.full_name', read_only=True)
    doctor_specialty = serializers.CharField(source='doctor.specialty', read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'tracking_code', 'doctor_name', 'doctor_specialty',
            'date', 'start_time', 'end_time', 'status', 'notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields
