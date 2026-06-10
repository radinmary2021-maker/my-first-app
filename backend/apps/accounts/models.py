from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserRole(models.TextChoices):
    CUSTOMER = 'customer', 'مشتری'
    OWNER    = 'owner',    'صاحب کسب‌وکار'
    PROVIDER = 'provider', 'ارائه‌دهنده (deprecated → owner)'   # kept for BC
    ADMIN    = 'admin',    'ادمین سیستم'


class UserManager(BaseUserManager):
    def create_user(self, phone, full_name='', role=UserRole.CUSTOMER, **extra_fields):
        if not phone:
            raise ValueError('Phone number is required')
        user = self.model(phone=phone, full_name=full_name, role=role, **extra_fields)
        user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, full_name='', **extra_fields):
        extra_fields.setdefault('role', UserRole.ADMIN)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(phone, full_name, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    phone = models.CharField(max_length=11, unique=True)
    full_name = models.CharField(max_length=100, blank=True)
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.CUSTOMER)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.phone


class OTPCode(models.Model):
    phone = models.CharField(max_length=11)
    otp_hash = models.CharField(max_length=256)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'otp_codes'
        indexes = [
            models.Index(
                fields=['phone', 'expires_at'],
                condition=models.Q(is_used=False),
                name='otp_active_phone_expires_idx',
            ),
        ]

    def __str__(self):
        return f'{self.phone} - {"used" if self.is_used else "active"}'
