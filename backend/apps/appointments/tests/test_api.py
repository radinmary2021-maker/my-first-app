"""
HTTP integration tests for the appointments API.

Exercises the full Django request/response cycle.
"""

import pytest

from apps.accounts.services import issue_jwt_tokens
from apps.appointments.models import Appointment, AppointmentStatus
from apps.appointments.services import AppointmentService

from .conftest import SATURDAY, SLOT_9_00, SLOT_9_30, book


def auth(user):
    return {'HTTP_AUTHORIZATION': f'Bearer {issue_jwt_tokens(user)["access"]}'}


# ──────────────────────────────────────────────────────────────────────────────
# POST /api/appointments/  — book
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestBookAppointmentAPI:

    def test_unauthenticated_returns_401(self, client, provider):
        res = client.post('/api/appointments/', {
            'provider_id': provider.pk,
            'date': str(SATURDAY),
            'start_time': '09:00',
        }, content_type='application/json')
        assert res.status_code == 401

    def test_successful_booking_returns_201(
        self, client, customer, provider, service, working_hours
    ):
        res = client.post('/api/appointments/', {
            'provider_id': provider.pk,
            'service_id': service.pk,
            'date': str(SATURDAY),
            'start_time': '09:00',
        }, content_type='application/json', **auth(customer))
        assert res.status_code == 201
        data = res.json()
        assert data['tracking_code'].startswith('APT-')
        assert data['status'] == AppointmentStatus.PENDING

    def test_response_contains_required_fields(
        self, client, customer, provider, service, working_hours
    ):
        res = client.post('/api/appointments/', {
            'provider_id': provider.pk,
            'service_id': service.pk,
            'date': str(SATURDAY),
            'start_time': '09:00',
        }, content_type='application/json', **auth(customer))
        data = res.json()
        for field in ['tracking_code', 'date', 'start_time', 'end_time', 'status']:
            assert field in data, f'Missing field: {field}'

    def test_nonexistent_provider_returns_400(self, client, customer):
        res = client.post('/api/appointments/', {
            'provider_id': 99999,
            'date': str(SATURDAY),
            'start_time': '09:00',
        }, content_type='application/json', **auth(customer))
        assert res.status_code == 400

    def test_past_date_returns_400(self, client, customer, provider):
        res = client.post('/api/appointments/', {
            'provider_id': provider.pk,
            'date': '2020-01-04',
            'start_time': '09:00',
        }, content_type='application/json', **auth(customer))
        assert res.status_code == 400

    def test_slot_outside_working_hours_returns_400(
        self, client, customer, provider, service, working_hours
    ):
        res = client.post('/api/appointments/', {
            'provider_id': provider.pk,
            'service_id': service.pk,
            'date': str(SATURDAY),
            'start_time': '07:00',
        }, content_type='application/json', **auth(customer))
        assert res.status_code == 400

    def test_double_booking_returns_400(
        self, client, customer, customer2, provider, service, working_hours
    ):
        client.post('/api/appointments/', {
            'provider_id': provider.pk,
            'service_id': service.pk,
            'date': str(SATURDAY),
            'start_time': '09:00',
        }, content_type='application/json', **auth(customer))

        res = client.post('/api/appointments/', {
            'provider_id': provider.pk,
            'service_id': service.pk,
            'date': str(SATURDAY),
            'start_time': '09:00',
        }, content_type='application/json', **auth(customer2))
        assert res.status_code == 400


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/appointments/mine/
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestMyAppointmentsAPI:

    def test_unauthenticated_returns_401(self, client):
        assert client.get('/api/appointments/mine/').status_code == 401

    def test_empty_when_no_bookings(self, client, customer):
        res = client.get('/api/appointments/mine/', **auth(customer))
        assert res.status_code == 200
        assert res.json() == []

    def test_returns_only_own_appointments(
        self, client, customer, customer2, provider, service, working_hours
    ):
        book(customer,  provider, service, SLOT_9_00)
        book(customer2, provider, service, SLOT_9_30)

        res = client.get('/api/appointments/mine/', **auth(customer))
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 1
        assert data[0]['status'] == AppointmentStatus.PENDING

    def test_shows_multiple_own_appointments(
        self, client, customer, provider, service, working_hours
    ):
        book(customer, provider, service, SLOT_9_00)
        book(customer, provider, service, SLOT_9_30)

        res = client.get('/api/appointments/mine/', **auth(customer))
        assert len(res.json()) == 2


# ──────────────────────────────────────────────────────────────────────────────
# POST /api/appointments/<pk>/cancel/
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestCancelAppointmentAPI:

    def test_unauthenticated_returns_401(self, client, customer, provider, service, working_hours):
        appt = book(customer, provider, service)
        assert client.post(f'/api/appointments/{appt.pk}/cancel/').status_code == 401

    def test_customer_cancels_own_appointment(
        self, client, customer, provider, service, working_hours
    ):
        appt = book(customer, provider, service)
        res = client.post(f'/api/appointments/{appt.pk}/cancel/', **auth(customer))
        assert res.status_code == 200
        assert res.json()['status'] == AppointmentStatus.CANCELLED

    def test_stranger_cannot_cancel(
        self, client, customer, customer2, provider, service, working_hours
    ):
        appt = book(customer, provider, service)
        res = client.post(f'/api/appointments/{appt.pk}/cancel/', **auth(customer2))
        assert res.status_code == 400

    def test_nonexistent_appointment_returns_404(self, client, customer):
        res = client.post('/api/appointments/99999/cancel/', **auth(customer))
        assert res.status_code == 404


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/appointments/track/<code>/  — public
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestTrackingAPI:

    def test_valid_code_returns_appointment_info(
        self, client, customer, provider, service, working_hours
    ):
        appt = book(customer, provider, service)
        res = client.get(f'/api/appointments/track/{appt.tracking_code}/')
        assert res.status_code == 200
        data = res.json()
        assert data['tracking_code'] == appt.tracking_code
        assert data['status'] == AppointmentStatus.PENDING

    def test_no_auth_required(
        self, client, customer, provider, service, working_hours
    ):
        """Tracking endpoint is public."""
        appt = book(customer, provider, service)
        res = client.get(f'/api/appointments/track/{appt.tracking_code}/')
        assert res.status_code == 200

    def test_invalid_code_returns_404(self, client):
        res = client.get('/api/appointments/track/APT-XXXXXX/')
        assert res.status_code == 404


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/appointments/provider/
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestProviderAppointmentsAPI:

    def test_provider_sees_own_appointments(
        self, client, customer, provider, provider_user, service, working_hours
    ):
        appt = book(customer, provider, service)
        res = client.get('/api/appointments/provider/', **auth(provider_user))
        assert res.status_code == 200
        codes = [a['tracking_code'] for a in res.json()]
        assert appt.tracking_code in codes

    def test_customer_without_provider_profile_gets_403(
        self, client, customer
    ):
        res = client.get('/api/appointments/provider/', **auth(customer))
        assert res.status_code == 403

    def test_filter_by_status(
        self, client, customer, provider, provider_user, service, working_hours
    ):
        book(customer, provider, service)
        res = client.get(
            f'/api/appointments/provider/?status={AppointmentStatus.PENDING}',
            **auth(provider_user),
        )
        assert res.status_code == 200
        assert len(res.json()) >= 1
