import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Provider',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('business_name', models.CharField(max_length=150, verbose_name='نام کسب‌وکار')),
                ('category', models.CharField(
                    choices=[
                        ('medical',       'پزشکی و سلامت'),
                        ('beauty',        'آرایشگاه و زیبایی'),
                        ('legal',         'وکالت و مشاوره حقوقی'),
                        ('financial',     'مشاوره مالی'),
                        ('psychological', 'روانشناسی و مشاوره'),
                        ('fitness',       'ورزش و تناسب‌اندام'),
                        ('education',     'آموزش و تدریس'),
                        ('veterinary',    'دامپزشکی'),
                        ('other',         'سایر'),
                    ],
                    default='other',
                    max_length=30,
                    verbose_name='دسته‌بندی',
                )),
                ('specialty', models.CharField(blank=True, max_length=100, verbose_name='تخصص / عنوان شغلی')),
                ('bio', models.TextField(blank=True, verbose_name='معرفی')),
                ('address', models.CharField(blank=True, max_length=300, verbose_name='آدرس')),
                ('slot_duration', models.PositiveSmallIntegerField(default=30, verbose_name='مدت هر نوبت (دقیقه)')),
                ('service_fee', models.DecimalField(decimal_places=0, max_digits=10, verbose_name='هزینه خدمت (تومان)')),
                ('is_active', models.BooleanField(default=True)),
                ('user', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='provider_profile',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'db_table': 'providers'},
        ),
        migrations.CreateModel(
            name='WeeklySchedule',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('weekday', models.PositiveSmallIntegerField(choices=[
                    (0, 'شنبه'), (1, 'یکشنبه'), (2, 'دوشنبه'), (3, 'سه‌شنبه'),
                    (4, 'چهارشنبه'), (5, 'پنجشنبه'), (6, 'جمعه'),
                ])),
                ('start_time', models.TimeField()),
                ('end_time', models.TimeField()),
                ('is_active', models.BooleanField(default=True)),
                ('provider', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='schedules',
                    to='providers.provider',
                )),
            ],
            options={
                'db_table': 'weekly_schedules',
                'constraints': [
                    models.UniqueConstraint(fields=('provider', 'weekday'), name='unique_provider_weekday'),
                ],
            },
        ),
        migrations.CreateModel(
            name='ScheduleException',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('type', models.CharField(choices=[('HOLIDAY', 'تعطیل'), ('CUSTOM_HOURS', 'ساعت سفارشی')], max_length=20)),
                ('start_time', models.TimeField(blank=True, null=True)),
                ('end_time', models.TimeField(blank=True, null=True)),
                ('reason', models.CharField(blank=True, max_length=200)),
                ('provider', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='exceptions',
                    to='providers.provider',
                )),
            ],
            options={
                'db_table': 'schedule_exceptions',
                'constraints': [
                    models.UniqueConstraint(fields=('provider', 'date'), name='unique_provider_date_exception'),
                ],
            },
        ),
    ]
