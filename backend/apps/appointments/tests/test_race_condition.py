"""
Race condition and double-booking prevention tests.

The critical invariant: at most ONE active appointment per (provider, date, start_time).

Two layers of defence:
  1. SELECT FOR UPDATE inside transaction.atomic (application-level lock)
  2. UniqueConstraint on (provider, date, start_time) WHERE status IN active (DB-level)
"""

import pytest
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import time

from django.test import TransactionTestCase

from apps.accounts.models import User, UserRole
from apps.appointments.models import Appointment, AppointmentStatus, ACTIVE_STATUSES
from apps.appointments.services import AppointmentService, BookingError
from apps.businesses.models import Business, BusinessCategory, BusinessMember, MemberRole
from apps.providers.models import Provider
from apps.scheduling.models import Service, WorkingHours

from .conftest import SATURDAY, SLOT_9_00


# ──────────────────────────────────────────────────────────────────────────────
# DB-level constraint test (works on SQLite)
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db(transaction=True)
class TestUniqueConstraint:

    def test_constraint_prevents_duplicate_active_slots(
        self, customer, customer2, provider, service, working_hours
    ):
        """
        Two ACTIVE appointments for the same (provider, date, start_time)
        must be rejected at the DB level.
        """
        from django.db import IntegrityError

        Appointment.objects.create(
            business=provider.business,
            customer=customer,
            provider=provider,
            service=service,
            date=SATURDAY,
            start_time=SLOT_9_00,
            end_time=time(9, 30),
            status=AppointmentStatus.PENDING,
        )
        with pytest.raises((IntegrityError, Exception)):
            Appointment.objects.create(
                business=provider.business,
                customer=customer2,
                provider=provider,
                service=service,
                date=SATURDAY,
                start_time=SLOT_9_00,
                end_time=time(9, 30),
                status=AppointmentStatus.CONFIRMED,
            )

    def test_cancelled_slot_allows_new_booking(
        self, customer, customer2, provider, service, working_hours
    ):
        """CANCELLED appointment does not participate in the unique constraint."""
        Appointment.objects.create(
            business=provider.business,
            customer=customer,
            provider=provider,
            service=service,
            date=SATURDAY,
            start_time=SLOT_9_00,
            end_time=time(9, 30),
            status=AppointmentStatus.CANCELLED,
        )
        new_appt = Appointment.objects.create(
            business=provider.business,
            customer=customer2,
            provider=provider,
            service=service,
            date=SATURDAY,
            start_time=SLOT_9_00,
            end_time=time(9, 30),
            status=AppointmentStatus.PENDING,
        )
        assert new_appt.pk is not None


# ──────────────────────────────────────────────────────────────────────────────
# Sequential double-booking (all DBs)
# ──────────────────────────────────────────────────────────────────────────────

class TestSequentialDoubleBooking(TransactionTestCase):
    """
    Uses TransactionTestCase so that each call to create_appointment
    actually commits (SELECT FOR UPDATE requires a real transaction).
    """

    def setUp(self):
        from unittest.mock import patch
        self.sms_patch = patch('apps.notifications.kavenegar.requests.post')
        mock = self.sms_patch.start()
        mock.return_value.status_code = 200
        mock.return_value.json.return_value = {'return': {'status': 200}}

        self.customer1 = User.objects.create_user(phone='09120001001', role=UserRole.CUSTOMER)
        self.customer2 = User.objects.create_user(phone='09120001002', role=UserRole.CUSTOMER)
        owner         = User.objects.create_user(phone='09120001010', role=UserRole.OWNER)
        provider_user = User.objects.create_user(phone='09120001020', role=UserRole.PROVIDER)

        self.business = Business.objects.create(
            owner=owner, name='تست', slug='test-race', category=BusinessCategory.MEDICAL
        )
        BusinessMember.objects.create(
            business=self.business, user=owner, role=MemberRole.OWNER
        )

        self.provider = Provider.objects.create(
            user=provider_user, business=self.business,
            business_name='تست', category=BusinessCategory.MEDICAL,
            service_fee=100_000, slot_duration=30,
        )
        self.service = Service.objects.create(
            business=self.business, name='خدمت', duration_minutes=30,
        )
        WorkingHours.objects.create(
            business=self.business, provider=self.provider,
            weekday=0, start_time=time(9, 0), end_time=time(11, 0),
        )

    def tearDown(self):
        self.sms_patch.stop()

    def _book(self, customer):
        return AppointmentService.create_appointment(
            business_id=self.business.id,
            provider=self.provider,
            date=SATURDAY,
            start_time=SLOT_9_00,
            service_id=self.service.id,
            customer=customer,
        )

    def test_second_booking_for_same_slot_raises(self):
        """First booking succeeds; second must raise BookingError."""
        self._book(self.customer1)
        with self.assertRaises(BookingError):
            self._book(self.customer2)

    def test_only_one_active_appointment_in_db(self):
        """DB must contain exactly one active appointment for the slot."""
        self._book(self.customer1)
        try:
            self._book(self.customer2)
        except BookingError:
            pass

        count = Appointment.objects.filter(
            provider=self.provider,
            date=SATURDAY,
            start_time=SLOT_9_00,
            status__in=ACTIVE_STATUSES,
        ).count()
        self.assertEqual(count, 1)


# ──────────────────────────────────────────────────────────────────────────────
# Concurrent booking (PostgreSQL only)
# ──────────────────────────────────────────────────────────────────────────────

class TestConcurrentBooking(TransactionTestCase):
    """
    Two threads try to book the same slot simultaneously.
    SELECT FOR UPDATE ensures only one succeeds.

    Skipped on SQLite — it uses table-level locking so concurrent writes
    serialize naturally but the test would be a no-op, not a true concurrency test.
    Run this in CI against PostgreSQL.
    """

    databases = ['default']

    def setUp(self):
        from django.db import connection as conn
        if conn.vendor == 'sqlite':
            self.skipTest('Concurrent write test requires PostgreSQL.')

        from unittest.mock import patch
        self.sms_patch = patch('apps.notifications.kavenegar.requests.post')
        mock = self.sms_patch.start()
        mock.return_value.status_code = 200
        mock.return_value.json.return_value = {'return': {'status': 200}}

        self.customer1 = User.objects.create_user(phone='09120002001', role=UserRole.CUSTOMER)
        self.customer2 = User.objects.create_user(phone='09120002002', role=UserRole.CUSTOMER)
        owner         = User.objects.create_user(phone='09120002010', role=UserRole.OWNER)
        provider_user = User.objects.create_user(phone='09120002020', role=UserRole.PROVIDER)

        self.business = Business.objects.create(
            owner=owner, name='تست همزمان', slug='test-concurrent',
            category=BusinessCategory.MEDICAL,
        )
        BusinessMember.objects.create(
            business=self.business, user=owner, role=MemberRole.OWNER
        )
        self.provider = Provider.objects.create(
            user=provider_user, business=self.business,
            business_name='تست', category=BusinessCategory.MEDICAL,
            service_fee=100_000, slot_duration=30,
        )
        self.service = Service.objects.create(
            business=self.business, name='خدمت', duration_minutes=30,
        )
        WorkingHours.objects.create(
            business=self.business, provider=self.provider,
            weekday=0, start_time=time(9, 0), end_time=time(11, 0),
        )

    def tearDown(self):
        self.sms_patch.stop()

    def test_concurrent_bookings_only_one_succeeds(self):
        results = []

        def try_book(customer):
            try:
                appt = AppointmentService.create_appointment(
                    business_id=self.business.id,
                    provider=self.provider,
                    date=SATURDAY,
                    start_time=SLOT_9_00,
                    service_id=self.service.id,
                    customer=customer,
                )
                results.append(('success', appt.pk))
            except (BookingError, Exception) as e:
                results.append(('error', str(e)))

        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = [
                executor.submit(try_book, self.customer1),
                executor.submit(try_book, self.customer2),
            ]
            for f in as_completed(futures):
                f.result()

        successes = [r for r in results if r[0] == 'success']
        self.assertEqual(len(successes), 1, f'Expected 1 success, got: {results}')

        active_count = Appointment.objects.filter(
            provider=self.provider,
            date=SATURDAY,
            start_time=SLOT_9_00,
            status__in=ACTIVE_STATUSES,
        ).count()
        self.assertEqual(active_count, 1)
