"""
Fixtures for providers tests.
Uses the new multi-tenant architecture (businesses/providers/scheduling).
"""
import pytest
from datetime import time

from django.core.cache import cache

from apps.accounts.models import User, UserRole
from apps.businesses.models import Business, BusinessCategory, BusinessMember, MemberRole
from apps.providers.models import Provider
from apps.scheduling.models import Service, WorkingHours


# ── Autouse ───────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture(autouse=True)
def extend_booking_window():
    import apps.scheduling.services as svc
    original = svc.MAX_DAYS_AHEAD
    svc.MAX_DAYS_AHEAD = 730
    yield
    svc.MAX_DAYS_AHEAD = original


# ── Users ─────────────────────────────────────────────────────────────────────

@pytest.fixture
def owner_user(db):
    return User.objects.create_user(
        phone='09120000010', role=UserRole.OWNER, full_name='صاحب کسب‌وکار'
    )


@pytest.fixture
def provider_user(db):
    return User.objects.create_user(
        phone='09120000002', role=UserRole.PROVIDER, full_name='علی رضایی'
    )


@pytest.fixture
def customer_user(db):
    return User.objects.create_user(
        phone='09120000001', role=UserRole.CUSTOMER, full_name='مشتری تست'
    )


@pytest.fixture
def staff_user(db):
    """A separate user who is a STAFF member of the business (not a provider)."""
    return User.objects.create_user(
        phone='09120000030', role=UserRole.PROVIDER, full_name='کارمند تست'
    )


# ── Business ──────────────────────────────────────────────────────────────────

@pytest.fixture
def business(owner_user):
    biz = Business.objects.create(
        owner=owner_user,
        name='کلینیک قلب',
        slug='heart-clinic',
        category=BusinessCategory.MEDICAL,
    )
    BusinessMember.objects.create(business=biz, user=owner_user, role=MemberRole.OWNER)
    return biz


@pytest.fixture
def staff_membership(business, staff_user):
    """Adds staff_user as an active STAFF member of the business."""
    return BusinessMember.objects.create(
        business=business,
        user=staff_user,
        role=MemberRole.STAFF,
        is_active=True,
    )


# ── Second business (cross-tenant isolation) ──────────────────────────────────

@pytest.fixture
def other_owner_user(db):
    return User.objects.create_user(
        phone='09130000010', role=UserRole.OWNER, full_name='مالک کسب‌وکار دیگر'
    )


@pytest.fixture
def other_business(other_owner_user):
    biz = Business.objects.create(
        owner=other_owner_user,
        name='آرایشگاه سبز',
        slug='green-salon',
        category=BusinessCategory.BEAUTY,
    )
    BusinessMember.objects.create(
        business=biz, user=other_owner_user, role=MemberRole.OWNER
    )
    return biz


@pytest.fixture
def other_provider_user(db):
    return User.objects.create_user(
        phone='09130000020', role=UserRole.PROVIDER, full_name='ارائه‌دهنده کسب‌وکار دیگر'
    )


@pytest.fixture
def other_provider(other_business, other_provider_user):
    return Provider.objects.create(
        user=other_provider_user,
        business=other_business,
        business_name='آرایشگاه سبز',
        category=BusinessCategory.BEAUTY,
        service_fee=200_000,
        slot_duration=30,
    )


# ── Provider ──────────────────────────────────────────────────────────────────

@pytest.fixture
def provider(business, provider_user):
    return Provider.objects.create(
        user=provider_user,
        business=business,
        business_name='کلینیک قلب',
        category=BusinessCategory.MEDICAL,
        specialty='قلب و عروق',
        service_fee=500_000,
        slot_duration=30,
    )


# ── Service & Schedule ────────────────────────────────────────────────────────

@pytest.fixture
def service(business):
    return Service.objects.create(
        business=business,
        name='ویزیت تخصصی',
        duration_minutes=30,
        buffer_minutes=0,
        price=500_000,
    )


@pytest.fixture
def working_hours(business, provider):
    """Saturday 09:00–11:00 → 4 slots at :00 and :30."""
    return WorkingHours.objects.create(
        business=business,
        provider=provider,
        weekday=0,          # 0 = Saturday in Iranian calendar
        start_time=time(9, 0),
        end_time=time(11, 0),
        is_active=True,
    )
