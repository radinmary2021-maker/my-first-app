"""
Sprint 5.5 — Business rule tests:
- Past appointment cannot be cancelled
- complete_appointment role enforcement
- mark_as_no_show full coverage
"""
import pytest
from datetime import date, time
from unittest.mock import patch

from django.utils import timezone

from apps.accounts.models import User, UserRole
from apps.appointments.models import Appointment, AppointmentStatus
from apps.appointments.services import (
    BookingError,
    book_appointment,
    cancel_appointment,
    complete_appointment,
    mark_as_no_show,
)

from .conftest import SATURDAY, SLOT_9_00


def _confirmed(patient, doctor, schedule):
    """Helper: book and force-confirm an appointment."""
    with patch('apps.notifications.kavenegar.requests.post') as m:
        m.return_value.json.return_value = {'return': {'status': 200}}
        appt = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
    appt.status = AppointmentStatus.CONFIRMED
    appt.save(update_fields=['status', 'updated_at'])
    return appt


# ── Cancellation: past date guard ─────────────────────────────────────────────

@pytest.mark.django_db
class TestCancelPastAppointment:
    def _past_appointment(self, patient, doctor, schedule):
        with patch('apps.notifications.kavenegar.requests.post') as m:
            m.return_value.json.return_value = {'return': {'status': 200}}
            appt = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        appt.date = date(2020, 1, 4)  # past Saturday
        appt.save(update_fields=['date'])
        return appt

    def test_past_active_appointment_cannot_be_cancelled(self, patient, doctor, schedule):
        appt = self._past_appointment(patient, doctor, schedule)
        with pytest.raises(BookingError, match='گذشته'):
            cancel_appointment(appt, patient)

    def test_past_confirmed_appointment_cannot_be_cancelled(self, patient, doctor, schedule):
        appt = self._past_appointment(patient, doctor, schedule)
        appt.status = AppointmentStatus.CONFIRMED
        appt.save(update_fields=['status'])
        with pytest.raises(BookingError, match='گذشته'):
            cancel_appointment(appt, patient)

    def test_future_appointment_can_be_cancelled(self, patient, doctor, schedule):
        with patch('apps.notifications.kavenegar.requests.post') as m:
            m.return_value.json.return_value = {'return': {'status': 200}}
            appt = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        with patch('apps.notifications.kavenegar.requests.post') as m:
            m.return_value.json.return_value = {'return': {'status': 200}}
            result = cancel_appointment(appt, patient)
        assert result.status == AppointmentStatus.CANCELLED

    def test_status_check_fires_before_date_check(self, patient, doctor, schedule):
        """completed appointment should raise 'فعال', not 'گذشته'."""
        appt = self._past_appointment(patient, doctor, schedule)
        appt.status = AppointmentStatus.COMPLETED
        appt.save(update_fields=['status'])
        with pytest.raises(BookingError, match='فعال'):
            cancel_appointment(appt, patient)


# ── complete_appointment: role enforcement ────────────────────────────────────

@pytest.mark.django_db
class TestCompleteAppointmentPermissions:
    def test_doctor_can_complete(self, patient, doctor, schedule, doctor_user):
        appt = _confirmed(patient, doctor, schedule)
        result = complete_appointment(appt, doctor_user)
        assert result.status == AppointmentStatus.COMPLETED

    def test_secretary_can_complete(self, patient, doctor, schedule, db):
        secretary = User.objects.create_user(phone='09120000091', role=UserRole.SECRETARY)
        appt = _confirmed(patient, doctor, schedule)
        result = complete_appointment(appt, secretary)
        assert result.status == AppointmentStatus.COMPLETED

    def test_admin_can_complete(self, patient, doctor, schedule, db):
        admin = User.objects.create_user(phone='09120000092', role=UserRole.ADMIN)
        appt = _confirmed(patient, doctor, schedule)
        result = complete_appointment(appt, admin)
        assert result.status == AppointmentStatus.COMPLETED

    def test_patient_cannot_complete(self, patient, doctor, schedule):
        appt = _confirmed(patient, doctor, schedule)
        with pytest.raises(BookingError, match='مجاز'):
            complete_appointment(appt, patient)

    def test_complete_saves_to_db(self, patient, doctor, schedule, doctor_user):
        appt = _confirmed(patient, doctor, schedule)
        complete_appointment(appt, doctor_user)
        appt.refresh_from_db()
        assert appt.status == AppointmentStatus.COMPLETED


# ── mark_as_no_show ────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestMarkAsNoShow:
    def test_doctor_can_mark_no_show(self, patient, doctor, schedule, doctor_user):
        appt = _confirmed(patient, doctor, schedule)
        result = mark_as_no_show(appt, doctor_user)
        assert result.status == AppointmentStatus.NO_SHOW

    def test_secretary_can_mark_no_show(self, patient, doctor, schedule, db):
        secretary = User.objects.create_user(phone='09120000093', role=UserRole.SECRETARY)
        appt = _confirmed(patient, doctor, schedule)
        result = mark_as_no_show(appt, secretary)
        assert result.status == AppointmentStatus.NO_SHOW

    def test_admin_can_mark_no_show(self, patient, doctor, schedule, db):
        admin = User.objects.create_user(phone='09120000094', role=UserRole.ADMIN)
        appt = _confirmed(patient, doctor, schedule)
        result = mark_as_no_show(appt, admin)
        assert result.status == AppointmentStatus.NO_SHOW

    def test_patient_cannot_mark_no_show(self, patient, doctor, schedule):
        appt = _confirmed(patient, doctor, schedule)
        with pytest.raises(BookingError, match='مجاز'):
            mark_as_no_show(appt, patient)

    def test_only_confirmed_can_be_no_show(self, patient, doctor, schedule, doctor_user):
        with patch('apps.notifications.kavenegar.requests.post') as m:
            m.return_value.json.return_value = {'return': {'status': 200}}
            appt = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        assert appt.status == AppointmentStatus.PENDING_PAYMENT
        with pytest.raises(BookingError, match='تأیید شده'):
            mark_as_no_show(appt, doctor_user)

    def test_no_show_saves_to_db(self, patient, doctor, schedule, doctor_user):
        appt = _confirmed(patient, doctor, schedule)
        mark_as_no_show(appt, doctor_user)
        appt.refresh_from_db()
        assert appt.status == AppointmentStatus.NO_SHOW

    def test_cancelled_cannot_be_no_show(self, patient, doctor, schedule, doctor_user):
        with patch('apps.notifications.kavenegar.requests.post') as m:
            m.return_value.json.return_value = {'return': {'status': 200}}
            appt = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        with patch('apps.notifications.kavenegar.requests.post') as m:
            m.return_value.json.return_value = {'return': {'status': 200}}
            cancel_appointment(appt, patient)
        with pytest.raises(BookingError, match='تأیید شده'):
            mark_as_no_show(appt, doctor_user)
