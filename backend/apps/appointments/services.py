"""
apps/appointments/services.py

AppointmentService — the booking engine's write path.

Race-condition safety:
  SELECT FOR UPDATE inside an atomic transaction is the primary guard.
  The DB-level UniqueConstraint on (provider, date, start_time) WHERE active
  is the last-resort safety net that catches any race that slips through.

Design:
  - No logic in views; all business rules live here.
  - AvailabilityService cache is invalidated after every mutation.
  - Celery tasks for SMS notifications are fired AFTER the transaction commits
    (using on_commit via Django's connection.on_commit).
"""

import datetime
import logging
from typing import Optional

from django.db import transaction, IntegrityError
from django.utils import timezone

from common.exceptions import SlotUnavailableError, PermissionDeniedError
from apps.accounts.models import User
from apps.providers.models import Provider

from .models import Appointment, AppointmentStatus, ACTIVE_STATUSES

logger = logging.getLogger('apps.appointments')


# ──────────────────────────────────────────────────────────────────────────────
# BookingError (legacy alias — keep for backward-compat with old views/tests)
# ──────────────────────────────────────────────────────────────────────────────

class BookingError(Exception):
    """Raised for any booking rule violation."""
    pass


# ──────────────────────────────────────────────────────────────────────────────
# AppointmentService
# ──────────────────────────────────────────────────────────────────────────────

class AppointmentService:

    # ── Book ─────────────────────────────────────────────────────────────────

    @staticmethod
    @transaction.atomic
    def create_appointment(
        *,
        business_id: int,
        provider: Provider,
        date: datetime.date,
        start_time: datetime.time,
        service_id: Optional[int] = None,
        customer: Optional[User] = None,
        customer_name: str = '',
        customer_phone: str = '',
        notes: str = '',
    ) -> Appointment:
        """
        Books a slot with race-condition-safe locking.

        Steps:
          1. SELECT FOR UPDATE on competing rows (acquires row lock)
          2. Validate slot exists in the schedule (via AvailabilityService)
          3. Check no active appointment already exists
          4. Create the appointment
          5. Invalidate the slot cache (via on_commit)
          6. Schedule SMS notification (via on_commit)

        Raises:
          BookingError  — business rule violation (slot taken, outside hours, etc.)
          IntegrityError — DB constraint violation (should be unreachable if (1-3) correct)
        """
        from apps.scheduling.services import AvailabilityService

        # ── 1. Lock competing rows ────────────────────────────────────────────
        # list() forces query evaluation so the FOR UPDATE lock is actually held
        list(
            Appointment.objects.select_for_update().filter(
                provider=provider,
                date=date,
                start_time=start_time,
                status__in=ACTIVE_STATUSES,
            )
        )

        # ── 2. Validate slot is in the schedule ───────────────────────────────
        if service_id:
            avail = AvailabilityService.get_slots_for_date(
                business_id=business_id,
                date=date,
                service_id=service_id,
                provider_id=provider.id,
            )
            slot_times = {s.start for s in avail.slots}
            if start_time not in slot_times:
                raise BookingError(
                    'این اسلات در دسترس نیست (خارج از ساعت کاری یا قبلاً رزرو شده).'
                )

        # ── 3. Double-booking check (under lock) ─────────────────────────────
        if Appointment.objects.filter(
            provider=provider,
            date=date,
            start_time=start_time,
            status__in=ACTIVE_STATUSES,
        ).exists():
            raise BookingError('این اسلات قبلاً رزرو شده است.')

        # ── 4. Determine end_time ─────────────────────────────────────────────
        end_time = AppointmentService._compute_end_time(
            start_time, service_id, provider
        )

        # ── 5. Resolve customer info ──────────────────────────────────────────
        if customer and not customer_phone:
            customer_phone = getattr(customer, 'phone', '') or ''
        if customer and not customer_name:
            customer_name = getattr(customer, 'full_name', '') or customer_phone

        # ── 6. Resolve price ──────────────────────────────────────────────────
        total_price = 0
        if service_id:
            from apps.scheduling.models import Service
            svc = Service.objects.filter(id=service_id).only('price').first()
            if svc:
                total_price = int(svc.price)

        # ── 7. Create ─────────────────────────────────────────────────────────
        try:
            appointment = Appointment.objects.create(
                business_id=business_id,
                provider=provider,
                service_id=service_id,
                customer=customer,
                customer_name=customer_name,
                customer_phone=customer_phone,
                date=date,
                start_time=start_time,
                end_time=end_time,
                status=AppointmentStatus.PENDING,
                notes=notes,
                total_price=total_price,
            )
        except IntegrityError:
            # DB unique constraint fired — extremely rare race condition
            raise BookingError('این اسلات قبلاً رزرو شده است (تداخل همزمان).')

        # ── 8. Invalidate slot cache immediately (inside the transaction) ────────
        # Eager invalidation is always safe: a cache miss causes a fresh DB read,
        # whereas a stale cache hit causes ghost slots to appear.  on_commit is
        # intentionally NOT used here because TestCase wraps every test in an
        # outer transaction that never commits, so on_commit callbacks never fire
        # in tests — and in production, the window between COMMIT and on_commit
        # firing is a real (if small) window where stale data could be served.
        if service_id:
            AvailabilityService.invalidate_date(business_id, date, service_id, provider.id)

        # ── 9. Post-commit: SMS notification ─────────────────────────────────
        appointment_id = appointment.id

        def _on_commit():
            try:
                from apps.notifications.tasks import send_booking_confirmation_sms
                send_booking_confirmation_sms.delay(appointment_id)
            except Exception:
                logger.warning('Could not enqueue booking SMS for appointment %s', appointment_id)

        transaction.on_commit(_on_commit)

        logger.info(
            'Appointment created: id=%s tracking=%s provider=%s date=%s start=%s',
            appointment.id, appointment.tracking_code, provider.id, date, start_time,
        )
        return appointment

    # ── Cancel ───────────────────────────────────────────────────────────────

    @staticmethod
    def cancel_appointment(
        appointment: Appointment,
        cancelled_by: User,
    ) -> Appointment:
        """
        Cancels an appointment.

        Authorisation rules:
          • Customer may cancel their own appointment.
          • Business staff/owner may cancel any appointment in their business.
          • Admin may cancel anything.

        Raises BookingError on rule violations.
        """
        AppointmentService._assert_can_cancel(appointment, cancelled_by)

        if appointment.status not in ACTIVE_STATUSES:
            raise BookingError('فقط نوبت‌های فعال قابل لغو هستند.')

        if appointment.date < timezone.localdate():
            raise BookingError('نوبت‌های گذشته قابل لغو نیستند.')

        appointment.status       = AppointmentStatus.CANCELLED
        appointment.cancelled_by = cancelled_by
        appointment.save(update_fields=['status', 'cancelled_by', 'updated_at'])

        # Invalidate cache so the slot opens up again
        if appointment.service_id:
            from apps.scheduling.services import AvailabilityService
            AvailabilityService.invalidate_date(
                appointment.business_id,
                appointment.date,
                appointment.service_id,
                appointment.provider_id,
            )

        def _on_commit():
            try:
                from apps.notifications.tasks import send_cancellation_sms
                send_cancellation_sms.delay(appointment.pk)
            except Exception:
                logger.warning('Could not enqueue cancellation SMS for appointment %s', appointment.pk)

        transaction.on_commit(_on_commit)
        return appointment

    # ── Complete / No-Show ───────────────────────────────────────────────────

    @staticmethod
    def complete_appointment(
        appointment: Appointment,
        acted_by: User,
    ) -> Appointment:
        """Marks a confirmed appointment as completed. Staff/admin only."""
        AppointmentService._assert_staff_can_act(appointment, acted_by, 'تکمیل')

        if appointment.status != AppointmentStatus.CONFIRMED:
            raise BookingError('فقط نوبت‌های تأیید شده قابل تکمیل هستند.')

        appointment.status = AppointmentStatus.COMPLETED
        appointment.save(update_fields=['status', 'updated_at'])
        return appointment

    @staticmethod
    def mark_no_show(
        appointment: Appointment,
        acted_by: User,
    ) -> Appointment:
        """Marks a confirmed appointment as no-show. Staff/admin only."""
        AppointmentService._assert_staff_can_act(appointment, acted_by, 'ثبت غیبت')

        if appointment.status != AppointmentStatus.CONFIRMED:
            raise BookingError('فقط نوبت‌های تأیید شده قابل ثبت غیبت هستند.')

        appointment.status = AppointmentStatus.NO_SHOW
        appointment.save(update_fields=['status', 'updated_at'])
        return appointment

    @staticmethod
    def confirm_appointment(
        appointment: Appointment,
        acted_by: User,
    ) -> Appointment:
        """Confirms a pending appointment. Staff/admin only."""
        AppointmentService._assert_staff_can_act(appointment, acted_by, 'تأیید')

        if appointment.status != AppointmentStatus.PENDING:
            raise BookingError('فقط نوبت‌های در انتظار قابل تأیید هستند.')

        appointment.status = AppointmentStatus.CONFIRMED
        appointment.save(update_fields=['status', 'updated_at'])

        def _on_commit():
            try:
                from apps.notifications.tasks import send_booking_confirmation_sms
                send_booking_confirmation_sms.delay(appointment.pk)
            except Exception:
                pass

        transaction.on_commit(_on_commit)
        return appointment

    # ── Private helpers ───────────────────────────────────────────────────────

    @staticmethod
    def _compute_end_time(
        start_time: datetime.time,
        service_id: Optional[int],
        provider: Provider,
    ) -> datetime.time:
        """Compute end_time from service duration or provider's default slot."""
        duration_minutes = None

        if service_id:
            from apps.scheduling.models import Service
            svc = Service.objects.filter(id=service_id).only('duration_minutes').first()
            if svc:
                duration_minutes = svc.duration_minutes

        if duration_minutes is None:
            duration_minutes = getattr(provider, 'slot_duration', 30)

        from datetime import datetime as dt, timedelta
        dummy_date = datetime.date(2000, 1, 1)
        end_dt = dt.combine(dummy_date, start_time) + timedelta(minutes=duration_minutes)
        return end_dt.time()

    @staticmethod
    def _assert_can_cancel(appointment: Appointment, user: User) -> None:
        from apps.accounts.models import UserRole
        if user.role == UserRole.ADMIN:
            return

        # Business owner/staff can cancel any appointment in their business
        from apps.businesses.models import BusinessMember
        if BusinessMember.objects.filter(
            business_id=appointment.business_id,
            user=user,
            is_active=True,
        ).exists():
            return

        # Customer can cancel their own appointment
        if appointment.customer_id and appointment.customer_id == user.id:
            return

        raise BookingError('شما مجاز به لغو این نوبت نیستید.')

    @staticmethod
    def _assert_staff_can_act(
        appointment: Appointment,
        user: User,
        action: str,
    ) -> None:
        from apps.accounts.models import UserRole
        if user.role == UserRole.ADMIN:
            return

        from apps.businesses.models import BusinessMember
        if BusinessMember.objects.filter(
            business_id=appointment.business_id,
            user=user,
            is_active=True,
        ).exists():
            return

        raise BookingError(f'شما مجاز به {action} این نوبت نیستید.')


# ──────────────────────────────────────────────────────────────────────────────
# Legacy module-level functions (kept for backward-compat with old imports)
# ──────────────────────────────────────────────────────────────────────────────

def book_appointment(customer: User, provider: Provider, appt_date, start_time) -> Appointment:
    """Deprecated — use AppointmentService.create_appointment()."""
    return AppointmentService.create_appointment(
        business_id=provider.business_id,
        provider=provider,
        date=appt_date,
        start_time=start_time,
        customer=customer,
    )


def cancel_appointment(appointment: Appointment, user: User) -> Appointment:
    """Deprecated — use AppointmentService.cancel_appointment()."""
    return AppointmentService.cancel_appointment(appointment, user)


def complete_appointment(appointment: Appointment, user: User) -> Appointment:
    """Deprecated — use AppointmentService.complete_appointment()."""
    return AppointmentService.complete_appointment(appointment, user)


def mark_as_no_show(appointment: Appointment, user: User) -> Appointment:
    """Deprecated — use AppointmentService.mark_no_show()."""
    return AppointmentService.mark_no_show(appointment, user)
