import re
from rest_framework import serializers
from .models import User


def validate_iranian_phone(phone: str) -> str:
    if not re.match(r'^09[0-9]{9}$', phone):
        raise serializers.ValidationError('شماره موبایل معتبر نیست. فرمت صحیح: 09XXXXXXXXX')
    return phone


class SendOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=11)

    def validate_phone(self, value):
        return validate_iranian_phone(value)


class VerifyOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=11)
    otp = serializers.CharField(min_length=6, max_length=6)

    def validate_phone(self, value):
        return validate_iranian_phone(value)

    def validate_otp(self, value):
        if not value.isdigit():
            raise serializers.ValidationError('کد OTP باید فقط شامل اعداد باشد.')
        return value


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'phone', 'full_name', 'role', 'created_at']
        read_only_fields = fields


class UpdateProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(max_length=100, min_length=2)

    class Meta:
        model = User
        fields = ['full_name']
