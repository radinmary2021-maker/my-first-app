"""
Fixtures for notifications tests.
Uses the new multi-tenant architecture (businesses/providers/scheduling/appointments).
"""
import pytest
from datetime import date, time

from django.core.cache import cache

from apps.accounts.models import User, UserRole
from apps.businesses.models import Business, BusinessCategory, BusinessMember, MemberRole
from apps.providers.models import Provider
from apps.scheduling.models import Service, WorkingHours


# ── Constants ─────────────────────────────────────────────────────────────────

# 2026-12-12 is a Saturday (Iranian weekday 0)
SATURDAY  = date(2026, 12, 12)
SLOT_9_00 = time(9, 0)


# ── Autouse fixtures ──────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture(autouse=True)
def extend_booking_window():
    """Patch MAX_DAYS_AHEAD so SATURDAY=2026-12-12 is accepted in tests."""
    import apps.scheduling.services as svc
    original = svc.MAX_DAYS_AHEAD
    svc.MAX_DAYS_AHEAD = 730
    yield
    svc.MAX_DAYS_AHEAD = original


# ── Users ─────────────────────────────────────────────────────────────────────

@pytest.fixture
def customer(db):
    return User.objects.create_user(
        phone='09120000001', role=UserRole.CUSTOMER, full_name='مشتری تست'
    )


@pytest.fixture
def provider_user(db):
    return User.objects.create_user(
        phone='09120000002', role=UserRole.PROVIDER, full_name='ارائه‌دهنده تست'
    )


@pytest.fixture
def owner_user(db):
    return User.objects.create_user(
        phone='09120000010', role=UserRole.OWNER, full_name='صاحب کسب‌وکار'
    )


# ── Business & provider ───────────────────────────────────────────────────────

@pytest.fixture
def business(owner_user):
    biz = Business.objects.create(
        owner=owner_user,
        name='کلینیک تست',
        slug='notif-clinic',
        category=BusinessCategory.MEDICAL,
    )
    BusinessMember.objects.create(business=biz, user=owner_user, role=MemberRole.OWNER)
    return biz


@pytest.fixture
def provider(business, provider_user):
    return Provider.objects.create(
        user=provider_user,
        business=business,
        business_name='کلینیک تست',
        category=BusinessCategory.MEDICAL,
        specialty='عمومی',
        service_fee=300_000,
        slot_duration=30,
    )


@pytest.fixture
def service(business):
    return Service.objects.create(
        business=business,
        name='ویزیت عمومی',
        duration_minutes=30,
        buffer_minutes=0,
        price=300_000,
    )


@pytest.fixture
def working_hours(business, provider):
    return WorkingHours.objects.create(
        business=business,
        provider=provider,
        weekday=0,          # Saturday in Iranian calendar
        start_time=time(9, 0),
        end_time=time(11, 0),
        is_active=True,
    )
