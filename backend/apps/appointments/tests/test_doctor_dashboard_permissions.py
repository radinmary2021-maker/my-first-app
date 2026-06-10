"""
Staff dashboard permission tests.

Covers:
  - Provider sees only their own appointments via /api/appointments/provider/
  - Staff member can complete/no-show via the service layer
  - Customer is blocked from staff-only actions
  - Provider from a different business cannot act on another business's appointments
"""

import pytest
from datetime import time

from apps.accounts.models import User, UserRole
from apps.accounts.services import issue_jwt_tokens
from apps.appointments.models import Appointment, AppointmentStatus
from apps.appointments.services import AppointmentService, BookingError
from apps.businesses.models import Business, BusinessCategory, BusinessMember, MemberRole
from apps.providers.models import Provider
from apps.scheduling.models import Service, WorkingHours

from .conftest import SATURDAY, SLOT_9_00, SLOT_9_30, book


def auth(user):
    return {'HTTP_AUTHORIZATION': f'Bearer {issue_jwt_tokens(user)["access"]}'}


# ── Second-provider fixtures ──────────────────────────────────────────────────

@pytest.fixture
def provider2_user(db):
    return User.objects.create_user(
        phone='09130000020', role=UserRole.PROVIDER, full_name='ارائه‌دهنده دوم'
    )


@pytest.fixture
def provider2(business, provider2_user):
    """Second provider in the SAME business."""
    return Provider.objects.create(
        user=provider2_user, business=business,
        business_name='کلینیک تست', category=BusinessCategory.MEDICAL,
        service_fee=200_000, slot_duration=30,
    )


@pytest.fixture
def working_hours2(business, provider2):
    return WorkingHours.objects.create(
        business=business, provider=provider2,
        weekday=0, start_time=time(9, 0), end_time=time(11, 0),
    )


# ──────────────────────────────────────────────────────────────────────────────
# /api/appointments/provider/ — provider sees own appointments
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestProviderDashboardView:

    def test_provider_sees_own_appointments(
        self, client, customer, provider, provider_user, service, working_hours
    ):
        appt = book(customer, provider, service)
        res = client.get('/api/appointments/provider/', **auth(provider_user))
        assert res.status_code == 200
        codes = [a['tracking_code'] for a in res.json()]
        assert appt.tracking_code in codes

    def test_provider_does_not_see_other_providers_appointments(
        self, client, customer, provider, provider_user,
        provider2, provider2_user, service, working_hours, working_hours2
    ):
        """provider2's appointment must NOT appear in provider1's list."""
        appt_p2 = book(customer, provider2, service, SLOT_9_30)
        res = client.get('/api/appointments/provider/', **auth(provider_user))
        codes = [a['tracking_code'] for a in res.json()]
        assert appt_p2.tracking_code not in codes

    def test_customer_without_provider_profile_gets_403(self, client, customer):
        res = client.get('/api/appointments/provider/', **auth(customer))
        assert res.status_code == 403

    def test_unauthenticated_gets_401(self, client):
        assert client.get('/api/appointments/provider/').status_code == 401

    def test_filter_by_status_works(
        self, client, customer, provider, provider_user, service, working_hours
    ):
        appt = book(customer, provider, service)
        res = client.get(
            f'/api/appointments/provider/?status={AppointmentStatus.PENDING}',
            **auth(provider_user),
        )
        assert res.status_code == 200
        assert any(a['tracking_code'] == appt.tracking_code for a in res.json())

    def test_filter_by_date_works(
        self, client, customer, provider, provider_user, service, working_hours
    ):
        book(customer, provider, service)
        res = client.get(
            f'/api/appointments/provider/?date={SATURDAY}',
            **auth(provider_user),
        )
        assert res.status_code == 200


# ──────────────────────────────────────────────────────────────────────────────
# complete / no-show — staff membership required
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestCompleteNoShowPermissions:

    def _confirmed(self, customer, provider, service, working_hours):
        appt = book(customer, provider, service)
        appt.status = AppointmentStatus.CONFIRMED
        appt.save(update_fields=['status', 'updated_at'])
        return appt

    def test_staff_can_complete(
        self, customer, provider, provider_user, service, working_hours, staff_member
    ):
        appt = self._confirmed(customer, provider, service, working_hours)
        result = AppointmentService.complete_appointment(appt, provider_user)
        assert result.status == AppointmentStatus.COMPLETED

    def test_staff_can_mark_no_show(
        self, customer, provider, provider_user, service, working_hours, staff_member
    ):
        appt = self._confirmed(customer, provider, service, working_hours)
        result = AppointmentService.mark_no_show(appt, provider_user)
        assert result.status == AppointmentStatus.NO_SHOW

    def test_customer_cannot_complete(
        self, customer, provider, service, working_hours
    ):
        appt = self._confirmed(customer, provider, service, working_hours)
        with pytest.raises(BookingError, match='مجاز'):
            AppointmentService.complete_appointment(appt, customer)

    def test_customer_cannot_mark_no_show(
        self, customer, provider, service, working_hours
    ):
        appt = self._confirmed(customer, provider, service, working_hours)
        with pytest.raises(BookingError, match='مجاز'):
            AppointmentService.mark_no_show(appt, customer)

    def test_provider_from_other_business_cannot_complete(
        self, customer, provider, service, working_hours,
        provider2, provider2_user, working_hours2
    ):
        """provider2 is in the same business — but let's test a truly foreign provider."""
        # Create an entirely separate business + provider
        other_owner = User.objects.create_user(phone='09140000001', role=UserRole.OWNER)
        other_biz = Business.objects.create(
            owner=other_owner, name='بیزنس دیگر', slug='other-biz',
            category=BusinessCategory.LEGAL,
        )
        other_prov_user = User.objects.create_user(phone='09140000002', role=UserRole.PROVIDER)
        Provider.objects.create(
            user=other_prov_user, business=other_biz,
            business_name='بیزنس دیگر', category=BusinessCategory.LEGAL,
            service_fee=100_000,
        )

        appt = self._confirmed(customer, provider, service, working_hours)
        with pytest.raises(BookingError, match='مجاز'):
            AppointmentService.complete_appointment(appt, other_prov_user)


# ──────────────────────────────────────────────────────────────────────────────
# cancel — multi-party authorisation
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestCancelAuthorisation:

    def test_own_customer_can_cancel(
        self, customer, provider, service, working_hours
    ):
        appt = book(customer, provider, service)
        result = AppointmentService.cancel_appointment(appt, customer)
        assert result.status == AppointmentStatus.CANCELLED

    def test_other_customer_cannot_cancel(
        self, customer, customer2, provider, service, working_hours
    ):
        appt = book(customer, provider, service)
        with pytest.raises(BookingError, match='مجاز'):
            AppointmentService.cancel_appointment(appt, customer2)

    def test_staff_member_can_cancel_any_appointment(
        self, customer, provider, provider_user, service, working_hours, staff_member
    ):
        appt = book(customer, provider, service)
        result = AppointmentService.cancel_appointment(appt, provider_user)
        assert result.status == AppointmentStatus.CANCELLED

    def test_owner_can_cancel_any_appointment(
        self, customer, provider, owner_user, service, working_hours
    ):
        appt = book(customer, provider, service)
        result = AppointmentService.cancel_appointment(appt, owner_user)
        assert result.status == AppointmentStatus.CANCELLED
