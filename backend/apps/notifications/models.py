from django.db import models


class SMSStatus(models.TextChoices):
    SENT = 'sent', 'Sent'
    FAILED = 'failed', 'Failed'


class SMSLog(models.Model):
    phone = models.CharField(max_length=15)
    message = models.TextField()
    status = models.CharField(max_length=10, choices=SMSStatus.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.phone} [{self.status}] {self.created_at:%Y-%m-%d %H:%M}'
