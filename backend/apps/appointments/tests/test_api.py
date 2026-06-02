import pytest
from datetime import time

from apps.accounts.services import issue_jwt_tokens
from apps.appointments.models import Appointment, AppointmentStatus
from apps.appointments.services import book_appointment

from .conftest import SATURDAY, SLOT_9_00, SLOT_9_20


def auth_header(user):
    tokens = issue_jwt_tokens(user)
    return {'HTTP_AUTHORIZATION': f'Bearer {tokens["access"]}'}


@pytest.mark.django_db
class TestBookAppointmentAPI:
    def test_unauthenticated_returns_401(self, client, doctor, schedule):
        res = client.post('/api/appointments/', {
            'doctor_id': doctor.pk, 'date': '2026-06-06', 'start_time': '09:00'
        }, content_type='application/json')
        assert res.status_code == 401

    def test_successful_booking_returns_201(self, client, patient, doctor, schedule):
        res = client.post('/api/appointments/', {
            'doctor_id': doctor.pk, 'date': '2026-06-06', 'start_time': '09:00'
        }, content_type='application/json', **auth_header(patient))
        assert res.status_code == 201
        data = res.json()
        assert data['tracking_code'].startswith('APT-')
        assert data['status'] == 'pending_payment'

    def test_invalid_slot_returns_400(self, client, patient, doctor, schedule):
        res = client.post('/api/appointments/', {
            'doctor_id': doctor.pk, 'date': '2026-06-06', 'start_time': '11:00'
        }, content_type='application/json', **auth_header(patient))
        assert res.status_code == 400

    def test_nonexistent_doctor_returns_400(self, client, patient):
        res = client.post('/api/appointments/', {
            'doctor_id': 9999, 'date': '2026-06-06', 'start_time': '09:00'
        }, content_type='application/json', **auth_header(patient))
        assert res.status_code == 400

    def test_past_date_returns_400(self, client, patient, doctor):
        res = client.post('/api/appointments/', {
            'doctor_id': doctor.pk, 'date': '2020-01-01', 'start_time': '09:00'
        }, content_type='application/json', **auth_header(patient))
        assert res.status_code == 400

    def test_double_booking_returns_400(self, client, patient, patient2, doctor, schedule):
        client.post('/api/appointments/', {
            'doctor_id': doctor.pk, 'date': '2026-06-06', 'start_time': '09:00'
        }, content_type='application/json', **auth_header(patient))
        res = client.post('/api/appointments/', {
            'doctor_id': doctor.pk, 'date': '2026-06-06', 'start_time': '09:00'
        }, content_type='application/json', **auth_header(patient2))
        assert res.status_code == 400

    def test_response_contains_required_fields(self, client, patient, doctor, schedule):
        res = client.post('/api/appointments/', {
            'doctor_id': doctor.pk, 'date': '2026-06-06', 'start_time': '09:00'
        }, content_type='application/json', **auth_header(patient))
        data = res.json()
        for field in ['tracking_code', 'doctor_name', 'date', 'start_time', 'end_time', 'status']:
            assert field in data, f'فیلد {field} در پاسخ وجود ندارد'


@pytest.mark.django_db
class TestMyAppointmentsAPI:
    def test_unauthenticated_returns_401(self, client):
        res = client.get('/api/appointments/mine/')
        assert res.status_code == 401

    def test_returns_only_own_appointments(self, client, patient, patient2, doctor, schedule):
        book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        book_appointment(patient2, doctor, SATURDAY, SLOT_9_20)
        res = client.get('/api/appointments/mine/', **auth_header(patient))
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 1
        assert data[0]['status'] == 'pending_payment'

    def test_empty_list_when_no_appointments(self, client, patient):
        res = client.get('/api/appointments/mine/', **auth_header(patient))
        assert res.status_code == 200
        assert res.json() == []


@pytest.mark.django_db
class TestCancelAppointmentAPI:
    def test_unauthenticated_returns_401(self, client, patient, doctor, schedule):
        appt = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        res = client.post(f'/api/appointments/{appt.pk}/cancel/')
        assert res.status_code == 401

    def test_patient_can_cancel_own(self, client, patient, doctor, schedule):
        appt = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        res = client.post(f'/api/appointments/{appt.pk}/cancel/', **auth_header(patient))
        assert res.status_code == 200
        assert res.json()['status'] == 'cancelled'

    def test_other_patient_cannot_cancel(self, client, patient, patient2, doctor, schedule):
        appt = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        res = client.post(f'/api/appointments/{appt.pk}/cancel/', **auth_header(patient2))
        assert res.status_code == 400

    def test_nonexistent_appointment_returns_404(self, client, patient):
        res = client.post('/api/appointments/9999/cancel/', **auth_header(patient))
        assert res.status_code == 404

    def test_slot_becomes_available_after_cancel_api(self, client, patient, doctor, schedule):
        book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        appt = Appointment.objects.get(patient=patient, start_time=SLOT_9_00)
        client.post(f'/api/appointments/{appt.pk}/cancel/', **auth_header(patient))
        res = client.get(f'/api/doctors/{doctor.pk}/slots/?date=2026-06-06')
        assert '09:00' in res.json()['slots']


@pytest.mark.django_db
class TestSlotsAPIWithBookings:
    def test_booked_slot_not_in_slots_response(self, client, patient, doctor, schedule):
        book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        res = client.get(f'/api/doctors/{doctor.pk}/slots/?date=2026-06-06')
        assert res.status_code == 200
        assert '09:00' not in res.json()['slots']
        assert '09:20' in res.json()['slots']
