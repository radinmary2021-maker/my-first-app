"""
apps/reviews/models.py

One review per completed appointment.
"""

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from common.models import TimeStampedModel


class Review(TimeStampedModel):
    appointment = models.OneToOneField(
        'appointments.Appointment',
        on_delete=models.CASCADE,
        related_name='review',
        verbose_name='نوبت',
    )
    provider = models.ForeignKey(
        'providers.Provider',
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name='ارائه‌دهنده',
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviews',
        verbose_name='مشتری',
    )
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='امتیاز',
    )
    comment = models.TextField(
        blank=True,
        max_length=500,
        verbose_name='نظر',
    )

    class Meta:
        db_table = 'reviews'
        verbose_name = 'نظر'
        verbose_name_plural = 'نظرات'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['provider', '-created_at']),
        ]

    def __str__(self):
        return f'Review #{self.id} — provider={self.provider_id} rating={self.rating}'
