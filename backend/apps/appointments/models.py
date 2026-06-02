import random
import string

from django.db import models

from apps.accounts.models import User
from apps.doctors.models import Doctor


class AppointmentStatus(models.TextChoices):
    PENDING_PAYMENT = 'pending_payment', 'در انتظار پرداخت'
    CONFIRMED = 'confirmed', 'تأیید شده'
    CANCELLED = 'cancelled', 'لغو شده'
    COMPLETED = 'completed', 'انجام شده'
    NO_SHOW = 'no_show', 'غیبت'


ACTIVE_STATUSES = [AppointmentStatus.PENDING_PAYMENT, AppointmentStatus.CONFIRMED]


def _generate_tracking_code() -> str:
    chars = string.ascii_uppercase + string.digits
    suffix = ''.join(random.choices(chars, k=6))
    return f'APT-{suffix}'


def _unique_tracking_code() -> str:
    while True:
        code = _generate_tracking_code()
        if not Appointment.objects.filter(tracking_code=code).exists():
            return code


class Appointment(models.Model):
    tracking_code = models.CharField(max_length=12, unique=True, db_index=True)
    patient = models.ForeignKey(User, on_delete=models.PROTECT, related_name='appointments')
    doctor = models.ForeignKey(Doctor, on_delete=models.PROTECT, related_name='appointments')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(
        max_length=20,
        choices=AppointmentStatus.choices,
        default=AppointmentStatus.PENDING_PAYMENT,
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'appointments'
        constraints = [
            models.UniqueConstraint(
                fields=['doctor', 'date', 'start_time'],
                condition=models.Q(status__in=ACTIVE_STATUSES),
                name='unique_active_appointment_slot',
            ),
        ]

    def save(self, *args, **kwargs):
        if not self.tracking_code:
            self.tracking_code = _unique_tracking_code()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.tracking_code} — {self.patient} @ {self.doctor}'
