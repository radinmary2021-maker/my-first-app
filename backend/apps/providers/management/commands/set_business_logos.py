"""
Upload logo images to businesses by slug.

Usage:
  python manage.py set_business_logos /path/to/images/

Expected files in the directory:
  veterinary.jpg (or .png)   → first business with category=veterinary
  automotive.jpg (or .png)   → first business with category=automotive
  psychological.jpg (or .png) → first business with category=psychological
"""

import os

from django.core.files import File
from django.core.management.base import BaseCommand

from apps.businesses.models import Business


CATEGORY_MAP = ['veterinary', 'automotive', 'psychological']


class Command(BaseCommand):
    help = 'Set business logos from image files in a directory'

    def add_arguments(self, parser):
        parser.add_argument('image_dir', type=str, help='Directory containing category-named images')

    def handle(self, *args, **options):
        image_dir = options['image_dir']
        if not os.path.isdir(image_dir):
            self.stderr.write(self.style.ERROR(f'Directory not found: {image_dir}'))
            return

        for cat in CATEGORY_MAP:
            img_path = None
            for ext in ['jpg', 'jpeg', 'png', 'webp']:
                candidate = os.path.join(image_dir, f'{cat}.{ext}')
                if os.path.isfile(candidate):
                    img_path = candidate
                    break

            if not img_path:
                self.stdout.write(self.style.WARNING(f'  ⚠ No image found for {cat}'))
                continue

            biz = Business.objects.filter(category=cat, is_active=True).first()
            if not biz:
                self.stdout.write(self.style.WARNING(f'  ⚠ No business found for category={cat}'))
                continue

            with open(img_path, 'rb') as f:
                filename = os.path.basename(img_path)
                biz.logo.save(filename, File(f), save=True)

            self.stdout.write(self.style.SUCCESS(
                f'  ✓ {biz.name} ← {filename}'
            ))

        self.stdout.write(self.style.SUCCESS('\nDone!'))
