import pytest
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import time

from django.test import TransactionTestCase

from apps.accounts.models import User, UserRole
from apps.appointments.models import Appointment, AppointmentStatus
from apps.appointments.services import BookingError, book_appointment
from apps.doctors.models import Doctor, WeeklySchedule

from .conftest import SATURDAY, SLOT_9_00


@pytest.mark.django_db(transaction=True)
class TestUniqueConstraint:
    def test_constraint_prevents_duplicate_active_slots(self, patient, patient2, doctor, schedule):
        """UniqueConstraint روی (doctor, date, start_time) برای وضعیت‌های فعال."""
        from django.db import IntegrityError
        from apps.appointments.models import Appointment, AppointmentStatus

        Appointment.objects.create(
            patient=patient, doctor=doctor,
            date=SATURDAY, start_time=SLOT_9_00, end_time=time(9, 20),
            status=AppointmentStatus.PENDING_PAYMENT,
        )
        with pytest.raises((IntegrityError, Exception)):
            Appointment.objects.create(
                patient=patient2, doctor=doctor,
                date=SATURDAY, start_time=SLOT_9_00, end_time=time(9, 20),
                status=AppointmentStatus.CONFIRMED,
            )

    def test_cancelled_slot_allows_new_booking(self, patient, patient2, doctor, schedule):
        """اسلات لغو شده unique constraint را بلاک نمی‌کند."""
        appt = Appointment.objects.create(
            patient=patient, doctor=doctor,
            date=SATURDAY, start_time=SLOT_9_00, end_time=time(9, 20),
            status=AppointmentStatus.CANCELLED,
        )
        new_appt = Appointment.objects.create(
            patient=patient2, doctor=doctor,
            date=SATURDAY, start_time=SLOT_9_00, end_time=time(9, 20),
            status=AppointmentStatus.PENDING_PAYMENT,
        )
        assert new_appt.pk is not None


class TestRaceCondition(TransactionTestCase):
    """
    TransactionTestCase چون select_for_update نیاز به commit واقعی دارد.
    هر thread یک connection مستقل به SQLite می‌گیرد.
    """

    def setUp(self):
        self.patient1 = User.objects.create_user(phone='09120000001', role=UserRole.PATIENT)
        self.patient2 = User.objects.create_user(phone='09120000002', role=UserRole.PATIENT)
        doctor_user = User.objects.create_user(phone='09120000010', role=UserRole.DOCTOR)
        self.doctor = Doctor.objects.create(
            user=doctor_user, specialty='عمومی',
            visit_duration=20, consultation_fee=300000,
        )
        WeeklySchedule.objects.create(
            doctor=self.doctor, weekday=0,
            start_time=time(9, 0), end_time=time(10, 0),
        )

    @pytest.mark.skipif(
        __import__('django').db.connection.vendor == 'sqlite',
        reason='SQLite does not support concurrent writes; run this test against PostgreSQL in CI.'
    )
    def test_concurrent_bookings_only_one_succeeds(self):
        """
        دو thread همزمان یک اسلات را رزرو می‌کنند.
        select_for_update + atomic تضمین می‌کند فقط یکی موفق شود.
        نیاز به PostgreSQL دارد — روی SQLite به دلیل table-level lock skip می‌شود.
        """
        results = []

        def try_book(patient):
            try:
                appt = book_appointment(patient, self.doctor, SATURDAY, SLOT_9_00)
                results.append(('success', appt.pk))
            except (BookingError, Exception) as e:
                results.append(('error', str(e)))

        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = [
                executor.submit(try_book, self.patient1),
                executor.submit(try_book, self.patient2),
            ]
            for f in as_completed(futures):
                f.result()

        successes = [r for r in results if r[0] == 'success']
        assert len(successes) == 1, f'انتظار ۱ موفق، دریافت: {results}'
        assert Appointment.objects.filter(
            doctor=self.doctor, date=SATURDAY, start_time=SLOT_9_00,
            status__in=[AppointmentStatus.PENDING_PAYMENT, AppointmentStatus.CONFIRMED]
        ).count() == 1

    def test_sequential_double_booking_prevented_by_service(self):
        """
        تست منطق service-level: دومین رزرو بعد از اول reject می‌شود.
        این رفتار روی هر DB کار می‌کند.
        """
        book_appointment(self.patient1, self.doctor, SATURDAY, SLOT_9_00)
        with self.assertRaises(BookingError):
            book_appointment(self.patient2, self.doctor, SATURDAY, SLOT_9_00)
        self.assertEqual(
            Appointment.objects.filter(
                doctor=self.doctor, date=SATURDAY, start_time=SLOT_9_00,
                status__in=[AppointmentStatus.PENDING_PAYMENT, AppointmentStatus.CONFIRMED]
            ).count(), 1
        )
