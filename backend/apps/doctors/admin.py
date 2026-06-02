from django.contrib import admin

from .models import Doctor, ScheduleException, WeeklySchedule


class WeeklyScheduleInline(admin.TabularInline):
    model = WeeklySchedule
    extra = 0


class ScheduleExceptionInline(admin.TabularInline):
    model = ScheduleException
    extra = 0


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'specialty', 'visit_duration', 'consultation_fee', 'is_active']
    list_filter = ['is_active', 'specialty']
    search_fields = ['user__full_name', 'specialty']
    inlines = [WeeklyScheduleInline, ScheduleExceptionInline]
