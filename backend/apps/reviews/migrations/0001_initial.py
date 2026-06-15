from django.conf import settings
from django.db import migrations, models
import django.core.validators
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('accounts',     '0003_add_owner_role'),
        ('appointments', '0002_refactor_multitenant'),
        ('providers',    '0004_drop_old_schedule'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Review',
            fields=[
                ('id',         models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('rating',     models.IntegerField(
                    validators=[
                        django.core.validators.MinValueValidator(1),
                        django.core.validators.MaxValueValidator(5),
                    ],
                    verbose_name='امتیاز',
                )),
                ('comment',    models.TextField(blank=True, max_length=500, verbose_name='نظر')),
                ('appointment', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='review',
                    to='appointments.appointment',
                    verbose_name='نوبت',
                )),
                ('provider', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='reviews',
                    to='providers.provider',
                    verbose_name='ارائه‌دهنده',
                )),
                ('customer', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='reviews',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='مشتری',
                )),
            ],
            options={
                'verbose_name': 'نظر',
                'verbose_name_plural': 'نظرات',
                'db_table': 'reviews',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='review',
            index=models.Index(fields=['provider', '-created_at'], name='reviews_provider_created_idx'),
        ),
    ]
