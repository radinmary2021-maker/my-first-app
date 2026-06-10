"""
apps/scheduling/admin.py
"""

from django.contrib import admin

from .models import Service, WorkingHours, TimeOff


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display   = ['name', 'business', 'duration_minutes', 'buffer_minutes', 'price', 'is_active']
    list_filter    = ['is_active', 'business']
    search_fields  = ['name', 'business__name']
    list_editable  = ['is_active']
    ordering       = ['business', 'name']
    fieldsets = (
        (None, {'fields': ('business', 'name', 'description')}),
        ('زمان‌بندی', {'fields': ('duration_minutes', 'buffer_minutes')}),
        ('قیمت و نمایش', {'fields': ('price', 'color', 'is_active')}),
    )


@admin.register(WorkingHours)
class WorkingHoursAdmin(admin.ModelAdmin):
    list_display  = ['business', 'provider', 'get_weekday_display', 'start_time', 'end_time', 'is_active']
    list_filter   = ['weekday', 'is_active', 'business']
    search_fields = ['business__name', 'provider__name']
    ordering      = ['business', 'provider', 'weekday']


@admin.register(TimeOff)
class TimeOffAdmin(admin.ModelAdmin):
    list_display  = ['business', 'provider', 'date', 'start_time', 'end_time', 'reason']
    list_filter   = ['business']
    search_fields = ['business__name', 'provider__name', 'reason']
    date_hierarchy = 'date'
    ordering      = ['-date']
