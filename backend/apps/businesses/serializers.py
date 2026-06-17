"""
apps/businesses/serializers.py
Input validation (write serializers) and output representation (read serializers)
for the Business and BusinessMember APIs.

Convention:
  *CreateSerializer / *UpdateSerializer  → validate input, write data
  *Serializer                            → read-only output representation
"""

import re

from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from .models import Business, BusinessCategory, BusinessMember, Branch, MemberRole


# ──────────────────────────────────────────────────────────────────────────────
# Business
# ──────────────────────────────────────────────────────────────────────────────

class BusinessCreateSerializer(serializers.Serializer):
    """Validates input for creating a new business."""

    name     = serializers.CharField(max_length=150, min_length=2)
    category = serializers.ChoiceField(choices=BusinessCategory.choices)
    phone    = serializers.CharField(max_length=15, required=False, allow_blank=True, default='')
    address  = serializers.CharField(max_length=500, required=False, allow_blank=True, default='')

    def validate_name(self, value: str) -> str:
        return value.strip()

    def validate_phone(self, value: str) -> str:
        if value and not re.match(r'^0[0-9]{9,10}$', value):
            raise serializers.ValidationError('شماره تلفن معتبر نیست.')
        return value


class BusinessUpdateSerializer(serializers.ModelSerializer):
    """Validates and applies partial updates to an existing Business."""

    latin_slug = serializers.SlugField(
        max_length=80, required=False, allow_null=True, allow_blank=True
    )

    class Meta:
        model  = Business
        fields = ['name', 'category', 'description', 'phone', 'address', 'timezone', 'latin_slug']

    def validate_latin_slug(self, value):
        if not value:
            return None
        value = value.lower().strip()
        import re
        if not re.match(r'^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$', value):
            raise serializers.ValidationError(
                'آدرس اختصاصی باید بین ۳ تا ۸۰ کاراکتر، فقط حروف انگلیسی کوچک، اعداد و خط‌فاصله باشد و با خط‌فاصله شروع یا تمام نشود.'
            )
        if '--' in value:
            raise serializers.ValidationError('آدرس اختصاصی نمی‌تواند شامل دو خط‌فاصله متوالی باشد.')
        instance = self.instance
        qs = Business.objects.filter(latin_slug=value)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError('این آدرس قبلاً توسط کسب‌وکار دیگری انتخاب شده است.')
        return value

    def validate_name(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError('نام کسب‌وکار نمی‌تواند خالی باشد.')
        return value

    def validate_timezone(self, value: str) -> str:
        import zoneinfo
        try:
            zoneinfo.ZoneInfo(value)
        except (KeyError, Exception):
            raise serializers.ValidationError(f'منطقه زمانی نامعتبر: {value}')
        return value


class BusinessSerializer(serializers.ModelSerializer):
    """Full read-only representation of a Business."""

    category_display = serializers.CharField(source='get_category_display', read_only=True)
    member_count     = serializers.SerializerMethodField()
    owner            = UserSerializer(read_only=True)

    class Meta:
        model  = Business
        fields = [
            'id', 'name', 'slug', 'latin_slug', 'category', 'category_display',
            'description', 'phone', 'address', 'logo', 'timezone',
            'is_active', 'owner', 'member_count', 'created_at',
        ]
        read_only_fields = fields

    def get_member_count(self, obj: Business) -> int:
        # Avoid N+1 — caller should prefetch_related('members')
        if hasattr(obj, '_prefetched_objects_cache') and 'members' in obj._prefetched_objects_cache:
            return sum(1 for m in obj.members.all() if m.is_active)
        return obj.members.filter(is_active=True).count()


class BusinessSummarySerializer(serializers.ModelSerializer):
    """Lightweight read-only representation used inside nested responses."""

    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model  = Business
        fields = ['id', 'name', 'slug', 'category', 'category_display', 'logo']
        read_only_fields = fields


# ──────────────────────────────────────────────────────────────────────────────
# BusinessMember
# ──────────────────────────────────────────────────────────────────────────────

class BusinessMemberSerializer(serializers.ModelSerializer):
    """Full read-only representation of a membership."""

    user         = UserSerializer(read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model  = BusinessMember
        fields = ['id', 'user', 'role', 'role_display', 'is_active', 'created_at']
        read_only_fields = fields


class AddMemberSerializer(serializers.Serializer):
    """Input for inviting a new member by phone number."""

    phone = serializers.CharField(max_length=11)
    role  = serializers.ChoiceField(choices=MemberRole.choices, default=MemberRole.STAFF)

    def validate_phone(self, value: str) -> str:
        if not re.match(r'^09[0-9]{9}$', value):
            raise serializers.ValidationError(
                'شماره موبایل معتبر نیست. فرمت صحیح: 09XXXXXXXXX'
            )
        return value


class UpdateMemberRoleSerializer(serializers.Serializer):
    """Input for changing a member's role."""

    role = serializers.ChoiceField(choices=MemberRole.choices)


# ──────────────────────────────────────────────────────────────────────────────
# Branch
# ──────────────────────────────────────────────────────────────────────────────

class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Branch
        fields = ['id', 'name', 'address', 'phone', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class BranchCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Branch
        fields = ['name', 'address', 'phone']

    def validate_name(self, value: str) -> str:
        return value.strip()
