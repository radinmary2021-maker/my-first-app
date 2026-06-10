"""
Makes Provider.business non-nullable now that the data migration has run.
"""

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('providers',  '0002_add_business_fk'),
        ('businesses', '0002_populate_from_providers'),  # data migration must complete first
    ]

    operations = [
        migrations.AlterField(
            model_name='provider',
            name='business',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='providers',
                to='businesses.business',
                verbose_name='کسب‌وکار',
            ),
        ),
    ]
