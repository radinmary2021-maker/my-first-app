import pytest
from datetime import time

from apps.appointments.models import AppointmentStatus
from apps.appointments.services import book_appointment
from apps.doctors.services import get_available_slots

from .conftest import SATURDAY, SLOT_9_00, SLOT_9_20


@pytest.mark.django_db
class TestAvailabilityExcludesBooked:
    def test_booked_slot_not_in_available(self, patient, doctor, schedule):
        book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        slots = get_available_slots(doctor, SATURDAY)
        assert SLOT_9_00 not in slots

    def test_unbooked_slot_still_available(self, patient, doctor, schedule):
        book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        slots = get_available_slots(doctor, SATURDAY)
        assert SLOT_9_20 in slots

    def test_all_slots_available_when_none_booked(self, doctor, schedule):
        slots = get_available_slots(doctor, SATURDAY)
        assert len(slots) == 3

    def test_cancelled_slot_becomes_available_again(self, patient, doctor, schedule):
        from apps.appointments.services import cancel_appointment
        appt = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        cancel_appointment(appt, patient)
        slots = get_available_slots(doctor, SATURDAY)
        assert SLOT_9_00 in slots

    def test_confirmed_slot_excluded(self, patient, doctor, schedule):
        appt = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        appt.status = AppointmentStatus.CONFIRMED
        appt.save()
        slots = get_available_slots(doctor, SATURDAY)
        assert SLOT_9_00 not in slots

    def test_completed_slot_available_again(self, patient, doctor, schedule):
        appt = book_appointment(patient, doctor, SATURDAY, SLOT_9_00)
        appt.status = AppointmentStatus.COMPLETED
        appt.save()
        slots = get_available_slots(doctor, SATURDAY)
        assert SLOT_9_00 in slots
