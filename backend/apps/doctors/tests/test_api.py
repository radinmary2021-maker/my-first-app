import pytest
from datetime import date, time

from apps.doctors.models import ScheduleException, WeeklySchedule


@pytest.mark.django_db
class TestDoctorListAPI:
    def test_returns_active_doctors(self, client, doctor):
        res = client.get('/api/doctors/')
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 1
        assert data[0]['specialty'] == 'قلب و عروق'

    def test_inactive_doctor_excluded(self, client, doctor):
        doctor.is_active = False
        doctor.save()
        res = client.get('/api/doctors/')
        assert res.status_code == 200
        assert res.json() == []

    def test_response_fields(self, client, doctor):
        res = client.get('/api/doctors/')
        d = res.json()[0]
        assert 'id' in d
        assert 'full_name' in d
        assert 'specialty' in d
        assert 'visit_duration' in d
        assert 'consultation_fee' in d

    def test_no_auth_required(self, client, doctor):
        res = client.get('/api/doctors/')
        assert res.status_code == 200


@pytest.mark.django_db
class TestDoctorDetailAPI:
    def test_returns_doctor(self, client, doctor):
        res = client.get(f'/api/doctors/{doctor.pk}/')
        assert res.status_code == 200
        assert res.json()['id'] == doctor.pk

    def test_nonexistent_returns_404(self, client):
        res = client.get('/api/doctors/9999/')
        assert res.status_code == 404

    def test_inactive_returns_404(self, client, doctor):
        doctor.is_active = False
        doctor.save()
        res = client.get(f'/api/doctors/{doctor.pk}/')
        assert res.status_code == 404


@pytest.mark.django_db
class TestAvailableSlotsAPI:
    def test_missing_date_param_returns_400(self, client, doctor):
        res = client.get(f'/api/doctors/{doctor.pk}/slots/')
        assert res.status_code == 400

    def test_invalid_date_format_returns_400(self, client, doctor):
        res = client.get(f'/api/doctors/{doctor.pk}/slots/?date=01-06-2024')
        assert res.status_code == 400

    def test_no_schedule_returns_empty_slots(self, client, doctor):
        res = client.get(f'/api/doctors/{doctor.pk}/slots/?date=2024-01-06')
        assert res.status_code == 200
        assert res.json()['slots'] == []

    def test_returns_correct_slots(self, client, doctor):
        WeeklySchedule.objects.create(
            doctor=doctor, weekday=0,
            start_time=time(9, 0), end_time=time(10, 0),
        )
        res = client.get(f'/api/doctors/{doctor.pk}/slots/?date=2024-01-06')
        assert res.status_code == 200
        data = res.json()
        assert data['date'] == '2024-01-06'
        assert data['slots'] == ['09:00', '09:20', '09:40']

    def test_holiday_returns_empty_slots(self, client, doctor):
        WeeklySchedule.objects.create(
            doctor=doctor, weekday=0,
            start_time=time(9, 0), end_time=time(13, 0),
        )
        ScheduleException.objects.create(
            doctor=doctor, date=date(2024, 1, 6), type='HOLIDAY'
        )
        res = client.get(f'/api/doctors/{doctor.pk}/slots/?date=2024-01-06')
        assert res.status_code == 200
        assert res.json()['slots'] == []

    def test_nonexistent_doctor_returns_404(self, client):
        res = client.get('/api/doctors/9999/slots/?date=2024-01-06')
        assert res.status_code == 404

    def test_no_auth_required(self, client, doctor):
        res = client.get(f'/api/doctors/{doctor.pk}/slots/?date=2024-01-06')
        assert res.status_code == 200
