from rest_framework import serializers

from .models import Doctor, ScheduleException, WeeklySchedule


class DoctorSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    available_weekdays = serializers.SerializerMethodField()

    class Meta:
        model = Doctor
        fields = [
            'id', 'full_name', 'specialty', 'bio',
            'visit_duration', 'consultation_fee', 'is_active',
            'available_weekdays',
        ]

    def get_available_weekdays(self, obj) -> list[int]:
        return list(
            obj.schedules.filter(is_active=True)
            .order_by('weekday')
            .values_list('weekday', flat=True)
        )


class WeeklyScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeeklySchedule
        fields = ['id', 'weekday', 'start_time', 'end_time', 'is_active']

    def validate(self, data):
        start = data.get('start_time')
        end = data.get('end_time')
        if start and end and start >= end:
            raise serializers.ValidationError('start_time باید قبل از end_time باشد.')
        return data


class ScheduleExceptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduleException
        fields = ['id', 'date', 'type', 'start_time', 'end_time', 'reason']

    def validate(self, data):
        exc_type = data.get('type')
        start = data.get('start_time')
        end = data.get('end_time')

        if exc_type == 'HOLIDAY':
            if start or end:
                raise serializers.ValidationError('نوع HOLIDAY نباید start_time یا end_time داشته باشد.')
        elif exc_type == 'CUSTOM_HOURS':
            if not start or not end:
                raise serializers.ValidationError('نوع CUSTOM_HOURS نیازمند start_time و end_time است.')
            if start >= end:
                raise serializers.ValidationError('start_time باید قبل از end_time باشد.')
        return data


class AvailableSlotsSerializer(serializers.Serializer):
    date = serializers.DateField()
    slots = serializers.ListField(child=serializers.TimeField(format='%H:%M'))
