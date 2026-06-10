"""
Migration: Refactor appointments table for multi-tenant architecture.

Strategy: ALTER TABLE (not DROP+CREATE) to preserve existing rows.
  1. Add new nullable columns (business, service, customer_name, etc.)
  2. Backfill business_id from provider.business_id
  3. Make business NOT NULL
  4. Add status 'pending' to choices (state only)
  5. Add new indexes

Dependencies:
  - appointments.0001_initial
  - businesses.0002_populate_from_providers  (business_id is available on providers)
  - scheduling.0001_initial                  (Service FK target)
  - providers.0003_business_not_null         (provider.business_id is reliable)
"""

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def _backfill_business_id(apps, schema_editor):
    """
    Copy business_id from providers_provider into appointments.
    Uses the ORM so it works identically on SQLite (tests) and PostgreSQL (prod).
    """
    Appointment = apps.get_model('appointments', 'Appointment')
    Provider    = apps.get_model('providers',    'Provider')

    provider_map = {p.id: p.business_id for p in Provider.objects.all() if p.business_id}

    to_update = []
    for appt in Appointment.objects.filter(business_id__isnull=True):
        biz_id = provider_map.get(appt.provider_id)
        if biz_id:
            appt.business_id = biz_id
            to_update.append(appt)

    if to_update:
        Appointment.objects.bulk_update(to_update, ['business_id'], batch_size=500)


class Migration(migrations.Migration):

    dependencies = [
        ('appointments', '0001_initial'),
        ('businesses',   '0002_populate_from_providers'),
        ('scheduling',   '0001_initial'),
        ('providers',    '0003_business_not_null'),
    ]

    operations = [

        # ── 1. Add new columns (all nullable first) ───────────────────────────

        migrations.AddField(
            model_name='appointment',
            name='business',
            field=models.ForeignKey(
                null=True,  # nullable until backfill
                blank=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='appointments',
                to='businesses.business',
                verbose_name='کسب‌وکار',
            ),
        ),
        migrations.AddField(
            model_name='appointment',
            name='service',
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='appointments',
                to='scheduling.service',
                verbose_name='خدمت',
            ),
        ),
        migrations.AddField(
            model_name='appointment',
            name='customer_name',
            field=models.CharField(blank=True, default='', max_length=100, verbose_name='نام مشتری'),
        ),
        migrations.AddField(
            model_name='appointment',
            name='customer_phone',
            field=models.CharField(blank=True, default='', max_length=15, verbose_name='موبایل مشتری'),
        ),
        migrations.AddField(
            model_name='appointment',
            name='total_price',
            field=models.DecimalField(decimal_places=0, default=0, max_digits=10, verbose_name='قیمت کل (تومان)'),
        ),
        migrations.AddField(
            model_name='appointment',
            name='deposit_paid',
            field=models.BooleanField(default=False, verbose_name='پیش‌پرداخت شده'),
        ),
        migrations.AddField(
            model_name='appointment',
            name='cancelled_by',
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='cancelled_appointments',
                to=settings.AUTH_USER_MODEL,
                verbose_name='لغوکننده',
            ),
        ),

        # ── 2. Backfill business_id from provider.business_id ─────────────────
        # Use RunPython so the same code works on both SQLite (tests) and PostgreSQL (prod).

        migrations.RunPython(
            _backfill_business_id,
            reverse_code=migrations.RunPython.noop,
        ),

        # ── 3. Make business NOT NULL ─────────────────────────────────────────

        migrations.AlterField(
            model_name='appointment',
            name='business',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='appointments',
                to='businesses.business',
                verbose_name='کسب‌وکار',
            ),
        ),

        # ── 4. Allow customer to be nullable (guest bookings) ─────────────────

        migrations.AlterField(
            model_name='appointment',
            name='customer',
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='appointments',
                to=settings.AUTH_USER_MODEL,
                verbose_name='مشتری',
            ),
        ),

        # ── 5. Update status choices to include 'pending' ─────────────────────
        #    (state-only change — no SQL needed)
        migrations.AlterField(
            model_name='appointment',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending',   'در انتظار تأیید'),
                    ('confirmed', 'تأیید شده'),
                    ('cancelled', 'لغو شده'),
                    ('completed', 'انجام شده'),
                    ('no_show',   'غیبت'),
                ],
                db_index=True,
                default='pending',
                max_length=20,
                verbose_name='وضعیت',
            ),
        ),

        # ── 6. Add TimeStampedModel fields (created_at already exists) ─────────
        #    updated_at already exists too — skip

        # ── 7. Drop old unique constraint, add new one ────────────────────────
        migrations.RemoveConstraint(
            model_name='appointment',
            name='unique_active_appointment_slot',
        ),
        migrations.AddConstraint(
            model_name='appointment',
            constraint=models.UniqueConstraint(
                fields=['provider', 'date', 'start_time'],
                condition=models.Q(status__in=['pending', 'confirmed']),
                name='unique_active_appointment_slot',
            ),
        ),

        # ── 8. New indexes ────────────────────────────────────────────────────
        migrations.AddIndex(
            model_name='appointment',
            index=models.Index(fields=['business', 'date'], name='apt_business_date_idx'),
        ),
        migrations.AddIndex(
            model_name='appointment',
            index=models.Index(fields=['business', 'status'], name='apt_business_status_idx'),
        ),
        migrations.AddIndex(
            model_name='appointment',
            index=models.Index(fields=['provider', 'date', 'status'], name='apt_provider_date_status_idx'),
        ),
        migrations.AddIndex(
            model_name='appointment',
            index=models.Index(fields=['customer', 'status'], name='apt_customer_status_idx'),
        ),
    ]
