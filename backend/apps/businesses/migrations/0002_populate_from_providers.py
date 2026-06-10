"""
Data migration: Provider → Business + BusinessMember

For every existing Provider:
  1. Create a Business (using business_name, category, provider.user as owner).
  2. Create a BusinessMember(role='owner') linking the user to the business.
  3. Set provider.business_id to the new Business (providers app adds the FK in
     its own 0002 migration which runs before this one — see dependencies).
  4. Update user.role from 'provider' to 'owner'.

Safe to run on an empty DB (no providers → no-op).
Idempotent: skips providers that already have a business_id set.
"""

from django.db import migrations
from django.utils.text import slugify
from django.utils import timezone


def _unique_slug(Business, base: str) -> str:
    """Generate a slug that doesn't collide with existing Business slugs."""
    if not base:
        base = f'business-{int(timezone.now().timestamp())}'
    slug    = base
    counter = 1
    while Business.objects.filter(slug=slug).exists():
        slug     = f'{base}-{counter}'
        counter += 1
    return slug


def populate_businesses(apps, schema_editor):
    Provider        = apps.get_model('providers',  'Provider')
    Business        = apps.get_model('businesses', 'Business')
    BusinessMember  = apps.get_model('businesses', 'BusinessMember')
    User            = apps.get_model('accounts',   'User')

    migrated = 0
    for provider in Provider.objects.select_related('user').all():
        # Idempotency: skip if already linked
        if provider.business_id:
            continue

        user = provider.user
        slug = _unique_slug(Business, slugify(provider.business_name, allow_unicode=True))

        business = Business.objects.create(
            owner       = user,
            name        = provider.business_name,
            slug        = slug,
            category    = provider.category,
            description = provider.bio or '',
            address     = provider.address or '',
            is_active   = provider.is_active,
            is_deleted  = False,
        )

        BusinessMember.objects.create(
            business  = business,
            user      = user,
            role      = 'owner',
            is_active = True,
        )

        # Link provider back to the new business
        Provider.objects.filter(pk=provider.pk).update(business_id=business.pk)

        # Elevate user role
        User.objects.filter(pk=user.pk, role='provider').update(role='owner')

        migrated += 1

    if migrated:
        print(f'\n  ✔ Migrated {migrated} provider(s) → Business records')


def reverse_populate(apps, schema_editor):
    """
    Reverse: unlink providers from businesses, restore role='provider',
    delete the auto-created Business records.
    (Only cleans up records created by the forward migration.)
    """
    Provider       = apps.get_model('providers',  'Provider')
    Business       = apps.get_model('businesses', 'Business')
    User           = apps.get_model('accounts',   'User')

    # Collect businesses whose owner is a provider user
    provider_user_ids = set(Provider.objects.values_list('user_id', flat=True))
    auto_businesses   = Business.objects.filter(owner_id__in=provider_user_ids)

    # Restore roles
    owner_ids = auto_businesses.values_list('owner_id', flat=True)
    User.objects.filter(pk__in=owner_ids).update(role='provider')

    # Unlink providers
    Provider.objects.filter(business__in=auto_businesses).update(business=None)

    # Delete auto-created businesses (will cascade to BusinessMember)
    auto_businesses.delete()


class Migration(migrations.Migration):

    dependencies = [
        ('businesses', '0001_initial'),
        ('providers',  '0002_add_business_fk'),   # adds nullable business FK to Provider
        ('accounts',   '0003_add_owner_role'),     # adds OWNER to UserRole choices
    ]

    operations = [
        migrations.RunPython(populate_businesses, reverse_populate),
    ]
