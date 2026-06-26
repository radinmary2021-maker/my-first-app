from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import User, UserRole
from apps.businesses.models import Business, BusinessMember, MemberRole
from apps.providers.models import Provider, ProviderService
from apps.scheduling.models import WorkingHours

SEED_DATA = [
    {
        'phone': '09100000001',
        'full_name': 'دکتر احمد رضایی',
        'business': {
            'name': 'کلینیک دامپزشکی دکتر رضایی',
            'category': 'veterinary',
            'description': 'ارائه خدمات دامپزشکی برای حیوانات خانگی',
        },
        'provider': {
            'specialty': 'دامپزشک عمومی',
            'bio': 'ارائه خدمات دامپزشکی برای حیوانات خانگی',
        },
        'service': {
            'name': 'ویزیت عمومی',
            'price': 350000,
            'duration_minutes': 30,
        },
    },
    {
        'phone': '09100000002',
        'full_name': 'علی محمدی',
        'business': {
            'name': 'تعمیرگاه تخصصی اطلس',
            'category': 'automotive',
            'description': 'تعمیر و نگهداری انواع خودرو',
        },
        'provider': {
            'specialty': 'مکانیک خودرو',
            'bio': 'تعمیر و نگهداری انواع خودرو',
        },
        'service': {
            'name': 'تعویض روغن',
            'price': 150000,
            'duration_minutes': 30,
        },
    },
    {
        'phone': '09100000003',
        'full_name': 'دکتر سارا کریمی',
        'business': {
            'name': 'مرکز مشاوره آرامش',
            'category': 'psychological',
            'description': 'ارائه خدمات مشاوره روانشناسی و زوج درمانی',
        },
        'provider': {
            'specialty': 'روانشناس بالینی',
            'bio': 'ارائه خدمات مشاوره روانشناسی و زوج درمانی',
        },
        'service': {
            'name': 'جلسه مشاوره فردی',
            'price': 400000,
            'duration_minutes': 60,
        },
    },
]

WEEKDAYS_SAT_TO_THU = [0, 1, 2, 3, 4, 5]


class Command(BaseCommand):
    help = 'Seed 3 test businesses: veterinary, automotive, consulting'

    @transaction.atomic
    def handle(self, *args, **options):
        for item in SEED_DATA:
            user, created = User.objects.get_or_create(
                phone=item['phone'],
                defaults={
                    'full_name': item['full_name'],
                    'role': UserRole.OWNER,
                },
            )
            if not created:
                self.stdout.write(f'  User {item["phone"]} already exists, skipping...')
                continue

            biz_data = item['business']
            business = Business.objects.create(
                owner=user,
                name=biz_data['name'],
                category=biz_data['category'],
                description=biz_data['description'],
            )

            BusinessMember.objects.create(
                business=business,
                user=user,
                role=MemberRole.OWNER,
            )

            prov_data = item['provider']
            provider = Provider.objects.create(
                user=user,
                business=business,
                business_name=business.name,
                category=business.category,
                specialty=prov_data['specialty'],
                bio=prov_data['bio'],
                service_fee=item['service']['price'],
                slot_duration=item['service']['duration_minutes'],
            )

            svc_data = item['service']
            ProviderService.objects.create(
                provider=provider,
                name=svc_data['name'],
                price=svc_data['price'],
                duration_minutes=svc_data['duration_minutes'],
            )

            for weekday in WEEKDAYS_SAT_TO_THU:
                WorkingHours.objects.create(
                    business=business,
                    provider=provider,
                    weekday=weekday,
                    start_time='09:00',
                    end_time='18:00',
                    is_active=True,
                )

            self.stdout.write(self.style.SUCCESS(
                f'  ✓ {business.name} (slug: {business.slug}) — provider: {user.full_name}'
            ))

        self.stdout.write(self.style.SUCCESS('\nDone!'))
