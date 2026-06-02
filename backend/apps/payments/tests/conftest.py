import pytest
from datetime import date, time
from django.core.cache import cache

from apps.accounts.models import User, UserRole
from apps.appointments.models import Appointment, AppointmentStatus
from apps.appointments.services import book_appointment
from apps.doctors.models import Doctor, WeeklySchedule


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def patient(db):
    return User.objects.create_user(phone='09120000001', role=UserRole.PATIENT, full_name='بیمار تست')


@pytest.fixture
def doctor_user(db):
    return User.objects.create_user(phone='09120000002', role=UserRole.DOCTOR, full_name='دکتر تست')


@pytest.fixture
def doctor(doctor_user):
    return Doctor.objects.create(
        user=doctor_user, specialty='عمومی',
        visit_duration=20, consultation_fee=500000,
    )


@pytest.fixture
def schedule(doctor):
    return WeeklySchedule.objects.create(
        doctor=doctor, weekday=0,
        start_time=time(9, 0), end_time=time(10, 0),
    )


SATURDAY = date(2026, 6, 6)
SLOT_9_00 = time(9, 0)


@pytest.fixture
def pending_appointment(patient, doctor, schedule):
    return book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
