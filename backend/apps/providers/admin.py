from django.contrib import admin

from .models import Provider


@admin.register(Provider)
class ProviderAdmin(admin.ModelAdmin):
    list_display  = ['business_name', 'business', 'category', 'specialty', 'slot_duration', 'service_fee', 'is_active']
    list_filter   = ['is_active', 'category', 'business']
    search_fields = ['business_name', 'user__full_name', 'specialty']
    raw_id_fields = ['user', 'business']
