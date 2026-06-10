"""
Test fixtures for the appointments test suite.

Multi-tenant setup:
  owner_user  → owns the business
  business    → the tenant
  provider    → staff member linked to business
  service     → 30-min service with no buffer
  working_hours → Saturday 09:00-11:00 (4 slots: 09:00, 09:30, 10:00, 10:30)
  customer    → the person booking
  customer2   → second customer for double-booking / isolation tests
"""

import pytest
from datetime import date, time
from unittest.mock import patch

from django.core.cache import cache

from apps.accounts.models import User, UserRole
from apps.businesses.models import Business, BusinessCategory, BusinessMember, MemberRole
from apps.providers.models import Provider
from apps.scheduling.models import Service, WorkingHours


# ── Constants ─────────────────────────────────────────────────────────────────

# 2026-12-12 is a Saturday (Python weekday 5 → Iranian weekday 0)
SATURDAY   = date(2026, 12, 12)
SLOT_9_00  = time(9, 0)
SLOT_9_30  = time(9, 30)
SLOT_10_00 = time(10, 0)
SLOT_10_30 = time(10, 30)


# ── Cache & SMS isolation ─────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def clear_cache():
    """Wipe cache before and after every test — slots must not bleed across tests."""
    cache.clear()
    yield
    cache.clear()


@pytest.fixture(autouse=True)
def extend_booking_window():
    """
    Allow bookings up to 730 days ahead in tests.

    Production MAX_DAYS_AHEAD=90 would reject SATURDAY=2026-12-12 (186 days away).
    We patch the module-level constant so the slot generator accepts it without
    changing production behaviour.
    """
    import apps.scheduling.services as svc
    original = svc.MAX_DAYS_AHEAD
    svc.MAX_DAYS_AHEAD = 730
    yield
    svc.MAX_DAYS_AHEAD = original


@pytest.fixture(autouse=True)
def mock_sms():
    """
    Patch Kavenegar at the HTTP layer so no real requests are made.
    Applies to all tests — booking/cancel always trigger SMS tasks.
    """
    with patch('apps.notifications.kavenegar.requests.post') as mock:
        mock.return_value.status_code = 200
        mock.return_value.json.return_value = {'return': {'status': 200, 'message': 'تایید شد'}}
        yield mock


# ── Users ─────────────────────────────────────────────────────────────────────

@pytest.fixture
def owner_user(db):
    return User.objects.create_user(
        phone='09120000010', role=UserRole.OWNER, full_name='صاحب کسب‌وکار'
    )


@pytest.fixture
def provider_user(db):
    """The staff member who delivers services."""
    return User.objects.create_user(
        phone='09120000020', role=UserRole.PROVIDER, full_name='ارائه‌دهنده تست'
    )


@pytest.fixture
def customer(db):
    return User.objects.create_user(
        phone='09120000001', role=UserRole.CUSTOMER, full_name='مشتری اول'
    )


@pytest.fixture
def customer2(db):
    return User.objects.create_user(
        phone='09120000002', role=UserRole.CUSTOMER, full_name='مشتری دوم'
    )


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        phone='09120000099', role=UserRole.ADMIN, full_name='ادمین سیستم'
    )


# ── Business & membership ─────────────────────────────────────────────────────

@pytest.fixture
def business(owner_user):
    biz = Business.objects.create(
        owner=owner_user,
        name='کلینیک تست',
        slug='test-clinic',
        category=BusinessCategory.MEDICAL,
    )
    BusinessMember.objects.create(
        business=biz,
        user=owner_user,
        role=MemberRole.OWNER,
    )
    return biz


@pytest.fixture
def staff_member(business, provider_user):
    """provider_user as a STAFF BusinessMember — allows complete/no-show/cancel."""
    return BusinessMember.objects.create(
        business=business,
        user=provider_user,
        role=MemberRole.STAFF,
    )


# ── Provider ──────────────────────────────────────────────────────────────────

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


# ── Service ───────────────────────────────────────────────────────────────────

@pytest.fixture
def service(business):
    """30-minute service, no buffer — produces slots at :00 and :30."""
    return Service.objects.create(
        business=business,
        name='ویزیت عمومی',
        duration_minutes=30,
        buffer_minutes=0,
        price=300_000,
    )


# ── Working Hours (Saturday 09:00-11:00 → 4 slots) ───────────────────────────

@pytest.fixture
def working_hours(business, provider):
    """
    Provider-level Saturday schedule.
    With duration=30, buffer=0: slots are 09:00, 09:30, 10:00, 10:30.
    """
    return WorkingHours.objects.create(
        business=business,
        provider=provider,
        weekday=0,          # 0 = Saturday in Iranian calendar
        start_time=time(9, 0),
        end_time=time(11, 0),
        is_active=True,
    )


# ── Booking helper ────────────────────────────────────────────────────────────

def book(customer, provider, service, start_time=SLOT_9_00, date=SATURDAY):
    """
    Shorthand for AppointmentService.create_appointment.
    Returns the created Appointment.
    """
    from apps.appointments.services import AppointmentService
    return AppointmentService.create_appointment(
        business_id=provider.business_id,
        provider=provider,
        date=date,
        start_time=start_time,
        service_id=service.id,
        customer=customer,
    )
