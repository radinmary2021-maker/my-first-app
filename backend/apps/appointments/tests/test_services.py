import pytest
from datetime import date, time
from unittest.mock import patch

from apps.appointments.models import Appointment, AppointmentStatus
from apps.appointments.services import BookingError, book_appointment, cancel_appointment, complete_appointment, mark_as_no_show
from apps.accounts.models import UserRole

from .conftest import SATURDAY, SLOT_9_00, SLOT_9_20


@pytest.mark.django_db
class TestBookAppointment:
    def test_successful_booking(self, patient, doctor, schedule):
        appt = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        assert appt.pk is not None
        assert appt.patient == patient
        assert appt.doctor == doctor
        assert appt.date == SATURDAY
        assert appt.start_time == SLOT_9_00
        assert appt.status == AppointmentStatus.PENDING_PAYMENT

    def test_tracking_code_generated(self, patient, doctor, schedule):
        appt = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        assert appt.tracking_code.startswith('APT-')
        assert len(appt.tracking_code) == 10

    def test_tracking_code_is_unique(self, patient, patient2, doctor, schedule):
        appt1 = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        appt2 = book_appointment(patient2, doctor, SATURDAY, SLOT_9_20)
        assert appt1.tracking_code != appt2.tracking_code

    def test_end_time_calculated_from_visit_duration(self, patient, doctor, schedule):
        appt = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        assert appt.end_time == time(9, 20)

    def test_invalid_slot_raises_booking_error(self, patient, doctor, schedule):
        with pytest.raises(BookingError, match='اسلات'):
            book_appointment(patient, doctor, SATURDAY, time(11, 0))

    def test_booking_on_day_with_no_schedule_raises(self, patient, doctor):
        with pytest.raises(BookingError):
            book_appointment(patient, doctor, SATURDAY, SLOT_9_00)

    def test_double_booking_same_slot_raises(self, patient, patient2, doctor, schedule):
        book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        with pytest.raises(BookingError, match='قبلاً رزرو'):
            book_appointment(patient2, doctor, SATURDAY, SLOT_9_00)

    def test_same_patient_can_book_different_slot(self, patient, doctor, schedule):
        book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        appt2 = book_appointment(patient, doctor, SATURDAY, SLOT_9_20)
        assert appt2.pk is not None

    def test_cancelled_slot_can_be_rebooked(self, patient, patient2, doctor, schedule):
        appt = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        cancel_appointment(appt, patient)
        new_appt = book_appointment(patient2, doctor, SATURDAY, SLOT_9_00)
        assert new_appt.pk is not None

    def test_booking_on_holiday_raises(self, patient, doctor, schedule):
        from apps.doctors.models import ScheduleException
        ScheduleException.objects.create(doctor=doctor, date=SATURDAY, type='HOLIDAY')
        with pytest.raises(BookingError):
            book_appointment(patient, doctor, SATURDAY, SLOT_9_00)


@pytest.mark.django_db
class TestCancelAppointment:
    def test_patient_can_cancel_own_appointment(self, patient, doctor, schedule):
        appt = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        result = cancel_appointment(appt, patient)
        assert result.status == AppointmentStatus.CANCELLED

    def test_status_saved_to_db(self, patient, doctor, schedule):
        appt = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        cancel_appointment(appt, patient)
        appt.refresh_from_db()
        assert appt.status == AppointmentStatus.CANCELLED

    def test_other_patient_cannot_cancel(self, patient, patient2, doctor, schedule):
        appt = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        with pytest.raises(BookingError, match='مجاز'):
            cancel_appointment(appt, patient2)

    def test_secretary_can_cancel(self, patient, doctor, schedule, db):
        from apps.accounts.models import User
        secretary = User.objects.create_user(phone='09120000099', role=UserRole.SECRETARY)
        appt = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        result = cancel_appointment(appt, secretary)
        assert result.status == AppointmentStatus.CANCELLED

    def test_cancelling_already_cancelled_raises(self, patient, doctor, schedule):
        appt = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        cancel_appointment(appt, patient)
        with pytest.raises(BookingError, match='فعال'):
            cancel_appointment(appt, patient)

    def test_cancelling_completed_appointment_raises(self, patient, doctor, schedule, doctor_user):
        appt = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        appt.status = AppointmentStatus.CONFIRMED
        appt.save()
        complete_appointment(appt, doctor_user)
        with pytest.raises(BookingError):
            cancel_appointment(appt, patient)


@pytest.mark.django_db
class TestCompleteAppointment:
    def test_confirmed_appointment_can_be_completed(self, patient, doctor, schedule, doctor_user):
        appt = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        appt.status = AppointmentStatus.CONFIRMED
        appt.save()
        result = complete_appointment(appt, doctor_user)
        assert result.status == AppointmentStatus.COMPLETED

    def test_pending_payment_cannot_be_completed(self, patient, doctor, schedule, doctor_user):
        appt = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        assert appt.status == AppointmentStatus.PENDING_PAYMENT
        with pytest.raises(BookingError, match='تأیید شده'):
            complete_appointment(appt, doctor_user)
