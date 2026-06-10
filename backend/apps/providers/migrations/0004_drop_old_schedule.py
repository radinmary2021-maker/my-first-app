"""
Migration: Drop legacy WeeklySchedule and ScheduleException tables.

These are replaced by:
  - apps.scheduling.WorkingHours  (weekly availability grid)
  - apps.scheduling.TimeOff       (date-specific exceptions)

Dependencies:
  - scheduling.0001_initial  (new tables already created)
  - appointments.0002_refactor_multitenant  (no more FK to WeeklySchedule/ScheduleException)

This migration simply drops the two tables from PostgreSQL.
"""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('providers',     '0003_business_not_null'),
        ('scheduling',    '0001_initial'),
        ('appointments',  '0002_refactor_multitenant'),
    ]

    operations = [
        # Tell Django's migration framework these models no longer exist.
        # The actual DROP TABLE is handled by schema_editor so it works on
        # both SQLite (tests) and PostgreSQL (production).
        migrations.DeleteModel(name='ScheduleException'),
        migrations.DeleteModel(name='WeeklySchedule'),
    ]
