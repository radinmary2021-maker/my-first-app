from django.contrib import admin

from .models import Appointment


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display   = [
        'tracking_code', 'business', 'provider', 'customer_name',
        'date', 'start_time', 'end_time', 'status', 'total_price',
    ]
    list_filter    = ['status', 'business', 'date']
    search_fields  = ['tracking_code', 'customer_name', 'customer_phone', 'provider__business_name']
    date_hierarchy = 'date'
    ordering       = ['-date', '-start_time']
    readonly_fields = ['tracking_code', 'created_at', 'updated_at']

    fieldsets = (
        ('شناسه', {
            'fields': ('tracking_code',),
        }),
        ('طرفین', {
            'fields': ('business', 'provider', 'service', 'customer', 'customer_name', 'customer_phone'),
        }),
        ('زمان', {
            'fields': ('date', 'start_time', 'end_time'),
        }),
        ('وضعیت و مالی', {
            'fields': ('status', 'cancelled_by', 'total_price', 'deposit_paid'),
        }),
        ('یادداشت', {
            'fields': ('notes',),
        }),
        ('متادیتا', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'business', 'provider', 'service', 'customer', 'cancelled_by'
        )
