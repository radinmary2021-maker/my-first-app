from django.contrib import admin

from .models import Appointment


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['tracking_code', 'patient', 'doctor', 'date', 'start_time', 'status']
    list_filter = ['status', 'date']
    search_fields = ['tracking_code', 'patient__phone', 'doctor__user__full_name']
    ordering = ['-date', '-start_time']
    readonly_fields = ['tracking_code', 'created_at', 'updated_at']
