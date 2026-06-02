from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'amount', 'status', 'ref_id', 'created_at']
    list_filter = ['status']
    search_fields = ['appointment__tracking_code', 'authority', 'ref_id']
    readonly_fields = ['authority', 'ref_id', 'created_at']
