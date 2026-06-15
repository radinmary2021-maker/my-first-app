import re

from rest_framework import serializers

from .models import BusinessCategory, Provider


class ProviderSerializer(serializers.ModelSerializer):
    full_name          = serializers.CharField(source='user.full_name', read_only=True)
    category_display   = serializers.CharField(source='get_category_display', read_only=True)
    available_weekdays = serializers.SerializerMethodField()
    average_rating     = serializers.SerializerMethodField()
    reviews_count      = serializers.SerializerMethodField()

    class Meta:
        model  = Provider
        fields = [
            'id', 'full_name', 'business_name', 'category', 'category_display',
            'specialty', 'bio', 'address',
            'slot_duration', 'service_fee', 'is_active',
            'available_weekdays',
            'average_rating', 'reviews_count',
        ]

    def get_average_rating(self, obj) -> float | None:
        reviews = list(obj.reviews.all())  # uses prefetch cache when available
        if not reviews:
            return None
        return round(sum(r.rating for r in reviews) / len(reviews), 1)

    def get_reviews_count(self, obj) -> int:
        return len(obj.reviews.all())  # uses prefetch cache when available

    def get_available_weekdays(self, obj) -> list[int]:
        """Returns weekdays with active WorkingHours — provider-specific first, business-wide fallback."""
        from apps.scheduling.models import WorkingHours
        qs = WorkingHours.objects.filter(provider=obj, is_active=True)
        if not qs.exists():
            qs = WorkingHours.objects.filter(
                business=obj.business, provider__isnull=True, is_active=True
            )
        return list(qs.order_by('weekday').values_list('weekday', flat=True))


class UpdateProviderProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Provider
        fields = ['business_name', 'category', 'specialty', 'bio', 'address', 'slot_duration', 'service_fee']

    def validate_slot_duration(self, value):
        if value < 5:
            raise serializers.ValidationError('مدت هر نوبت باید حداقل ۵ دقیقه باشد.')
        return value


class BusinessCategorySerializer(serializers.Serializer):
    value = serializers.CharField()
    label = serializers.CharField()


class AvailableSlotsSerializer(serializers.Serializer):
    date  = serializers.DateField()
    slots = serializers.ListField(child=serializers.TimeField(format='%H:%M'))


# ──────────────────────────────────────────────────────────────────────────────
# Management serializers  (owner-facing, under /api/v1/businesses/me/providers/)
# ──────────────────────────────────────────────────────────────────────────────

class BusinessProviderSerializer(serializers.ModelSerializer):
    """
    Read-only representation of a Provider for the business owner's dashboard.
    Includes the linked user's phone so the owner can identify providers.
    """
    full_name        = serializers.CharField(source='user.full_name', read_only=True)
    phone            = serializers.CharField(source='user.phone',     read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model  = Provider
        fields = [
            'id',
            'full_name', 'phone',
            'specialty', 'bio', 'address',
            'service_fee', 'slot_duration',
            'category', 'category_display',
            'is_active',
        ]


class CreateProviderSerializer(serializers.Serializer):
    """
    Input for POST /api/v1/businesses/me/providers/

    Only `phone` is required — all profile fields are optional.
    The service layer finds or creates a User by phone before creating
    the Provider record.
    """
    phone         = serializers.CharField(max_length=15)
    full_name     = serializers.CharField(max_length=100, required=False, default='', allow_blank=True)
    specialty     = serializers.CharField(max_length=100, required=False, default='', allow_blank=True)
    bio           = serializers.CharField(required=False,                default='', allow_blank=True)
    address       = serializers.CharField(max_length=300, required=False, default='', allow_blank=True)
    service_fee   = serializers.DecimalField(max_digits=10, decimal_places=0, required=False, default=0)
    slot_duration = serializers.IntegerField(min_value=5, required=False, default=30)
    category      = serializers.CharField(max_length=30, required=False, default='', allow_blank=True)

    def validate_phone(self, value: str) -> str:
        if not re.match(r'^09\d{9}$', value):
            raise serializers.ValidationError('شماره موبایل معتبر نیست. فرمت: 09XXXXXXXXX')
        return value

    def validate_category(self, value: str) -> str:
        """Allow empty (service will fall back to business.category) or a valid choice."""
        if value and value not in dict(BusinessCategory.choices):
            valid = ', '.join(v for v, _ in BusinessCategory.choices)
            raise serializers.ValidationError(
                f'دسته‌بندی نامعتبر است. مقادیر مجاز: {valid}'
            )
        return value


class UpdateProviderSerializer(serializers.Serializer):
    """
    Input for PATCH /api/v1/businesses/me/providers/{id}/

    All fields are optional. Only supplied fields are updated.
    `is_active=True` can be used to re-activate a deactivated provider.
    """
    specialty     = serializers.CharField(max_length=100, required=False, allow_blank=True)
    bio           = serializers.CharField(required=False,                allow_blank=True)
    address       = serializers.CharField(max_length=300, required=False, allow_blank=True)
    service_fee   = serializers.DecimalField(max_digits=10, decimal_places=0, required=False)
    slot_duration = serializers.IntegerField(min_value=5, required=False)
    category      = serializers.CharField(max_length=30, required=False, allow_blank=True)
    is_active     = serializers.BooleanField(required=False)

    def validate_category(self, value: str) -> str:
        if value and value not in dict(BusinessCategory.choices):
            valid = ', '.join(v for v, _ in BusinessCategory.choices)
            raise serializers.ValidationError(
                f'دسته‌بندی نامعتبر است. مقادیر مجاز: {valid}'
            )
        return value
