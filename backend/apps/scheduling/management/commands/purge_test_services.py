"""
management command: purge_test_services

Hard-deletes soft-deleted services whose name consists entirely of
'?' characters (and optional spaces) — i.e. garbled test data.

Safety checks before deletion:
  1. Service must have is_active=False
  2. Service name must match /^[\? ]+$/ (only '?' and spaces)
  3. Reports any linked appointments (service FK is SET_NULL so no
     constraint error, but we log them for auditability)

Usage:
  python manage.py purge_test_services           # dry-run (default)
  python manage.py purge_test_services --execute # actually delete
"""

import re

from django.core.management.base import BaseCommand

from apps.scheduling.models import Service


GARBLED_PATTERN = re.compile(r'^[\? ]+$')


class Command(BaseCommand):
    help = 'Hard-delete soft-deleted services with garbled (all-?) names'

    def add_arguments(self, parser):
        parser.add_argument(
            '--execute',
            action='store_true',
            default=False,
            help='Actually perform the deletion (default is dry-run)',
        )

    def handle(self, *args, **options):
        dry_run = not options['execute']

        candidates = Service.objects.filter(is_active=False).select_related('business')
        targets = [s for s in candidates if GARBLED_PATTERN.match(s.name)]

        if not targets:
            self.stdout.write(self.style.SUCCESS('No garbled test services found.'))
            return

        self.stdout.write(f'Found {len(targets)} candidate(s):')
        for svc in targets:
            appt_count = svc.appointments.count()
            self.stdout.write(
                f'  id={svc.id}  name={repr(svc.name)}'
                f'  business={svc.business_id}'
                f'  linked_appointments={appt_count}'
            )
            if appt_count > 0:
                self.stdout.write(
                    self.style.WARNING(
                        f'    ⚠  {appt_count} appointment(s) reference this service'
                        ' — their service FK will become NULL after deletion'
                    )
                )

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    '\nDry-run mode — nothing deleted.'
                    ' Re-run with --execute to delete.'
                )
            )
        else:
            ids = [s.id for s in targets]
            deleted_count, _ = Service.objects.filter(id__in=ids).delete()
            self.stdout.write(
                self.style.SUCCESS(f'\nDeleted {deleted_count} service(s): ids={ids}')
            )
