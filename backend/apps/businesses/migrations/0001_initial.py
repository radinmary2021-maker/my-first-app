"""
Migration: Create Business, BusinessMember, Branch tables.
No dependency on providers — providers will depend on us.
"""

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ── Business ──────────────────────────────────────────────────────────
        migrations.CreateModel(
            name='Business',
            fields=[
                ('id',          models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at',  models.DateTimeField(auto_now_add=True)),
                ('updated_at',  models.DateTimeField(auto_now=True)),
                ('is_deleted',  models.BooleanField(default=False, db_index=True)),
                ('deleted_at',  models.DateTimeField(blank=True, null=True)),
                ('name',        models.CharField(max_length=150, verbose_name='نام کسب‌وکار')),
                ('slug',        models.SlugField(allow_unicode=True, max_length=100, unique=True, verbose_name='شناسه URL')),
                ('category',    models.CharField(
                    choices=[
                        ('medical',       'پزشکی و سلامت'),
                        ('beauty',        'آرایشگاه و زیبایی'),
                        ('legal',         'وکالت و مشاوره حقوقی'),
                        ('financial',     'مشاوره مالی'),
                        ('psychological', 'روانشناسی و مشاوره'),
                        ('fitness',       'ورزش و تناسب‌اندام'),
                        ('education',     'آموزش و تدریس'),
                        ('veterinary',    'دامپزشکی'),
                        ('automotive',    'تعمیرگاه و خودرو'),
                        ('other',         'سایر'),
                    ],
                    default='other',
                    max_length=30,
                    verbose_name='دسته‌بندی',
                )),
                ('description', models.TextField(blank=True, verbose_name='توضیحات')),
                ('phone',       models.CharField(blank=True, max_length=15, verbose_name='تلفن')),
                ('address',     models.TextField(blank=True, verbose_name='آدرس')),
                ('logo',        models.FileField(blank=True, null=True, upload_to='business_logos/', verbose_name='لوگو')),
                ('timezone',    models.CharField(default='Asia/Tehran', max_length=50, verbose_name='منطقه زمانی')),
                ('is_active',   models.BooleanField(default=True, verbose_name='فعال')),
                ('owner',       models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='owned_businesses',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='مالک',
                )),
            ],
            options={
                'verbose_name':        'کسب‌وکار',
                'verbose_name_plural': 'کسب‌وکارها',
                'db_table':            'businesses',
            },
        ),
        migrations.AddIndex(
            model_name='business',
            index=models.Index(fields=['slug'], name='businesses_slug_idx'),
        ),
        migrations.AddIndex(
            model_name='business',
            index=models.Index(fields=['owner', 'is_active'], name='businesses_owner_active_idx'),
        ),
        migrations.AddIndex(
            model_name='business',
            index=models.Index(fields=['category', 'is_active'], name='businesses_category_active_idx'),
        ),

        # ── BusinessMember ────────────────────────────────────────────────────
        migrations.CreateModel(
            name='BusinessMember',
            fields=[
                ('id',         models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('role',       models.CharField(
                    choices=[('owner', 'مالک'), ('staff', 'کارمند')],
                    default='staff',
                    max_length=20,
                    verbose_name='نقش',
                )),
                ('is_active',  models.BooleanField(default=True, verbose_name='فعال')),
                ('business',   models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='members',
                    to='businesses.business',
                    verbose_name='کسب‌وکار',
                )),
                ('user',       models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='business_memberships',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='کاربر',
                )),
            ],
            options={
                'verbose_name':        'عضو کسب‌وکار',
                'verbose_name_plural': 'اعضای کسب‌وکار',
                'db_table':            'business_members',
            },
        ),
        migrations.AlterUniqueTogether(
            name='businessmember',
            unique_together={('business', 'user')},
        ),
        migrations.AddIndex(
            model_name='businessmember',
            index=models.Index(fields=['user', 'is_active'], name='bm_user_active_idx'),
        ),
        migrations.AddIndex(
            model_name='businessmember',
            index=models.Index(fields=['business', 'role'], name='bm_business_role_idx'),
        ),
        migrations.AddIndex(
            model_name='businessmember',
            index=models.Index(fields=['business', 'is_active'], name='bm_business_active_idx'),
        ),

        # ── Branch ────────────────────────────────────────────────────────────
        migrations.CreateModel(
            name='Branch',
            fields=[
                ('id',         models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name',       models.CharField(max_length=150, verbose_name='نام شعبه')),
                ('address',    models.TextField(blank=True, verbose_name='آدرس')),
                ('phone',      models.CharField(blank=True, max_length=15, verbose_name='تلفن')),
                ('is_active',  models.BooleanField(default=True, verbose_name='فعال')),
                ('business',   models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='branches',
                    to='businesses.business',
                    verbose_name='کسب‌وکار',
                )),
            ],
            options={
                'verbose_name':        'شعبه',
                'verbose_name_plural': 'شعبه‌ها',
                'db_table':            'branches',
            },
        ),
        migrations.AddIndex(
            model_name='branch',
            index=models.Index(fields=['business', 'is_active'], name='branch_business_active_idx'),
        ),
    ]
