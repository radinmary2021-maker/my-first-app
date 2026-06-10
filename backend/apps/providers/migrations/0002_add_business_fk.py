"""
Adds a nullable ForeignKey from Provider → Business.
Data migration in businesses/0002 will populate and later
providers/0003 will make it non-nullable.
"""

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('providers',  '0001_initial'),
        ('businesses', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='provider',
            name='business',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='providers',
                to='businesses.business',
                verbose_name='کسب‌وکار',
            ),
        ),
    ]
