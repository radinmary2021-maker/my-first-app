from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import OTPCode, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['phone', 'full_name', 'role', 'is_active', 'created_at']
    list_filter = ['role', 'is_active']
    search_fields = ['phone', 'full_name']
    ordering = ['-created_at']
    fieldsets = (
        (None, {'fields': ('phone', 'full_name', 'role')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
    )
    add_fieldsets = (
        (None, {'fields': ('phone', 'full_name', 'role')}),
    )


@admin.register(OTPCode)
class OTPCodeAdmin(admin.ModelAdmin):
    list_display = ['phone', 'is_used', 'attempts', 'expires_at', 'created_at']
    list_filter = ['is_used']
    search_fields = ['phone']
    ordering = ['-created_at']
