import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('medical')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'expire-pending-appointments': {
        'task': 'payments.expire_pending_appointments',
        'schedule': crontab(minute='*/5'),
    },
}
