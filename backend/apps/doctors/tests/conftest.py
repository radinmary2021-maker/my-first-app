import pytest
from django.core.cache import cache

from apps.accounts.models import User, UserRole
from apps.doctors.models import Doctor


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def patient_user(db):
    return User.objects.create_user(phone='09120000001', role=UserRole.PATIENT)


@pytest.fixture
def doctor_user(db):
    return User.objects.create_user(phone='09120000002', role=UserRole.DOCTOR, full_name='علی رضایی')


@pytest.fixture
def doctor(doctor_user):
    return Doctor.objects.create(
        user=doctor_user,
        specialty='قلب و عروق',
        visit_duration=20,
        consultation_fee=500000,
    )
