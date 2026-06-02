from django.core.exceptions import ValidationError
from django.db import models

from apps.accounts.models import User


class Weekday(models.IntegerChoices):
    SATURDAY = 0, 'شنبه'
    SUNDAY = 1, 'یکشنبه'
    MONDAY = 2, 'دوشنبه'
    TUESDAY = 3, 'سه‌شنبه'
    WEDNESDAY = 4, 'چهارشنبه'
    THURSDAY = 5, 'پنجشنبه'
    FRIDAY = 6, 'جمعه'


class ExceptionType(models.TextChoices):
    HOLIDAY = 'HOLIDAY', 'تعطیل'
    CUSTOM_HOURS = 'CUSTOM_HOURS', 'ساعت سفارشی'


class Doctor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')
    specialty = models.CharField(max_length=100)
    bio = models.TextField(blank=True)
    visit_duration = models.PositiveSmallIntegerField(default=20)
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'doctors'

    def __str__(self):
        return f'Dr. {self.user.full_name} ({self.specialty})'


class WeeklySchedule(models.Model):
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='schedules')
    weekday = models.PositiveSmallIntegerField(choices=Weekday.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'weekly_schedules'
        constraints = [
            models.UniqueConstraint(fields=['doctor', 'weekday'], name='unique_doctor_weekday'),
        ]

    def clean(self):
        if self.start_time and self.end_time:
            if self.start_time >= self.end_time:
                raise ValidationError('start_time باید قبل از end_time باشد.')

            from datetime import datetime, timedelta
            duration = (
                datetime.combine(datetime.today(), self.end_time)
                - datetime.combine(datetime.today(), self.start_time)
            ).seconds // 60

            if self.doctor_id and duration < self.doctor.visit_duration:
                raise ValidationError(
                    f'بازه زمانی باید حداقل به اندازه مدت ویزیت ({self.doctor.visit_duration} دقیقه) باشد.'
                )

    def __str__(self):
        return f'{self.doctor} — {self.get_weekday_display()}'


class ScheduleException(models.Model):
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='exceptions')
    date = models.DateField()
    type = models.CharField(max_length=20, choices=ExceptionType.choices)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    reason = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table = 'schedule_exceptions'
        constraints = [
            models.UniqueConstraint(fields=['doctor', 'date'], name='unique_doctor_date_exception'),
        ]

    def clean(self):
        if self.type == ExceptionType.HOLIDAY:
            if self.start_time or self.end_time:
                raise ValidationError('نوع HOLIDAY نباید start_time یا end_time داشته باشد.')
        elif self.type == ExceptionType.CUSTOM_HOURS:
            if not self.start_time or not self.end_time:
                raise ValidationError('نوع CUSTOM_HOURS نیازمند start_time و end_time است.')
            if self.start_time >= self.end_time:
                raise ValidationError('start_time باید قبل از end_time باشد.')

    def __str__(self):
        return f'{self.doctor} — {self.date} ({self.type})'
