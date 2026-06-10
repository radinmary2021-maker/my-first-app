"""
Adds UserRole.OWNER = 'owner' to the User.role field choices.

This is a Django state-only migration — no SQL is emitted because CharField
choices are not enforced at the database level. The migration is required so
that Django's migration state stays in sync with the model definition.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_otpcode_partial_index'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('customer', 'مشتری'),
                    ('owner',    'صاحب کسب‌وکار'),
                    ('provider', 'ارائه‌دهنده (deprecated → owner)'),
                    ('admin',    'ادمین سیستم'),
                ],
                default='customer',
                max_length=20,
            ),
        ),
    ]
