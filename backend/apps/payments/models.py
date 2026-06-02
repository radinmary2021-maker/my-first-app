from django.db import models

from apps.appointments.models import Appointment


class PaymentStatus(models.TextChoices):
    PENDING = 'pending', 'در انتظار'
    PAID = 'paid', 'پرداخت شده'
    FAILED = 'failed', 'ناموفق'


class Payment(models.Model):
    appointment = models.OneToOneField(Appointment, on_delete=models.PROTECT, related_name='payment')
    amount = models.DecimalField(max_digits=10, decimal_places=0)
    authority = models.CharField(max_length=100, blank=True)
    ref_id = models.CharField(max_length=100, null=True, blank=True)
    status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payments'

    def __str__(self):
        return f'{self.appointment.tracking_code} — {self.status}'
