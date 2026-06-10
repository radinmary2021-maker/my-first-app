"""
Migration: Create services, working_hours, timeoffs tables.

Dependencies:
  - businesses.0001_initial  (for Business FK)
  - providers.0002_add_business_fk (for Provider FK — only adds the FK, doesn't require data)
"""

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('businesses', '0001_initial'),
        ('providers',  '0002_add_business_fk'),
    ]

    operations = [

        # ── Service ───────────────────────────────────────────────────────────
        migrations.CreateModel(
            name='Service',
            fields=[
                ('id',               models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at',       models.DateTimeField(auto_now_add=True)),
                ('updated_at',       models.DateTimeField(auto_now=True)),
                ('name',             models.CharField(max_length=150, verbose_name='نام خدمت')),
                ('description',      models.TextField(blank=True, verbose_name='توضیحات')),
                ('duration_minutes', models.PositiveSmallIntegerField(default=30, verbose_name='مدت (دقیقه)')),
                ('buffer_minutes',   models.PositiveSmallIntegerField(default=0, verbose_name='فاصله بعد از نوبت (دقیقه)')),
                ('price',            models.DecimalField(decimal_places=0, default=0, max_digits=10, verbose_name='قیمت (تومان)')),
                ('color',            models.CharField(blank=True, default='#06B6D4', max_length=7, verbose_name='رنگ تقویم')),
                ('is_active',        models.BooleanField(default=True, verbose_name='فعال')),
                ('business',         models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='services',
                    to='businesses.business',
                    verbose_name='کسب‌وکار',
                )),
            ],
            options={
                'verbose_name':        'خدمت',
                'verbose_name_plural': 'خدمات',
                'db_table':            'services',
                'ordering':            ['name'],
            },
        ),
        migrations.AddIndex(
            model_name='service',
            index=models.Index(fields=['business', 'is_active'], name='service_business_active_idx'),
        ),

        # ── WorkingHours ──────────────────────────────────────────────────────
        migrations.CreateModel(
            name='WorkingHours',
            fields=[
                ('id',         models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('weekday',    models.PositiveSmallIntegerField(
                    choices=[
                        (0, 'شنبه'), (1, 'یکشنبه'), (2, 'دوشنبه'),
                        (3, 'سه‌شنبه'), (4, 'چهارشنبه'), (5, 'پنجشنبه'), (6, 'جمعه'),
                    ],
                    verbose_name='روز هفته',
                )),
                ('start_time', models.TimeField(verbose_name='ساعت شروع')),
                ('end_time',   models.TimeField(verbose_name='ساعت پایان')),
                ('is_active',  models.BooleanField(default=True, verbose_name='فعال')),
                ('business',   models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='working_hours',
                    to='businesses.business',
                    verbose_name='کسب‌وکار',
                )),
                ('provider',   models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='working_hours',
                    to='providers.provider',
                    verbose_name='ارائه‌دهنده',
                )),
            ],
            options={
                'verbose_name':        'ساعت کاری',
                'verbose_name_plural': 'ساعات کاری',
                'db_table':            'working_hours',
            },
        ),
        migrations.AddConstraint(
            model_name='workinghours',
            constraint=models.UniqueConstraint(
                condition=models.Q(provider__isnull=False),
                fields=['provider', 'weekday'],
                name='unique_provider_weekday_hours',
            ),
        ),
        migrations.AddConstraint(
            model_name='workinghours',
            constraint=models.UniqueConstraint(
                condition=models.Q(provider__isnull=True),
                fields=['business', 'weekday'],
                name='unique_business_weekday_hours',
            ),
        ),
        migrations.AddIndex(
            model_name='workinghours',
            index=models.Index(fields=['provider', 'weekday', 'is_active'], name='wh_provider_weekday_idx'),
        ),
        migrations.AddIndex(
            model_name='workinghours',
            index=models.Index(fields=['business', 'weekday', 'is_active'], name='wh_business_weekday_idx'),
        ),

        # ── TimeOff ───────────────────────────────────────────────────────────
        migrations.CreateModel(
            name='TimeOff',
            fields=[
                ('id',         models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('date',       models.DateField(verbose_name='تاریخ')),
                ('start_time', models.TimeField(blank=True, null=True, verbose_name='از ساعت')),
                ('end_time',   models.TimeField(blank=True, null=True, verbose_name='تا ساعت')),
                ('reason',     models.CharField(blank=True, max_length=200, verbose_name='دلیل')),
                ('business',   models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='timeoffs',
                    to='businesses.business',
                    verbose_name='کسب‌وکار',
                )),
                ('provider',   models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='timeoffs',
                    to='providers.provider',
                    verbose_name='ارائه‌دهنده',
                )),
            ],
            options={
                'verbose_name':        'مرخصی / تعطیلی',
                'verbose_name_plural': 'مرخصی‌ها و تعطیلی‌ها',
                'db_table':            'timeoffs',
            },
        ),
        migrations.AddIndex(
            model_name='timeoff',
            index=models.Index(fields=['provider', 'date'], name='timeoff_provider_date_idx'),
        ),
        migrations.AddIndex(
            model_name='timeoff',
            index=models.Index(fields=['business', 'date'], name='timeoff_business_date_idx'),
        ),
    ]
