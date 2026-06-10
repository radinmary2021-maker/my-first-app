"""
Provider API tests.

Endpoints under /api/providers/ (legacy URLs kept for backward-compat).
New apps use /api/v1/businesses/ but these legacy routes are still active.
"""
import pytest
from datetime import date

from apps.accounts.services import issue_jwt_tokens


def auth(user):
    return {'HTTP_AUTHORIZATION': f'Bearer {issue_jwt_tokens(user)["access"]}'}


@pytest.mark.django_db
class TestProviderListAPI:
    def test_returns_active_providers(self, client, provider):
        res = client.get('/api/providers/')
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 1
        assert data[0]['specialty'] == 'قلب و عروق'

    def test_inactive_provider_excluded(self, client, provider):
        provider.is_active = False
        provider.save()
        res = client.get('/api/providers/')
        assert res.status_code == 200
        assert res.json() == []

    def test_response_fields(self, client, provider):
        res = client.get('/api/providers/')
        d = res.json()[0]
        assert 'id' in d
        assert 'full_name' in d
        assert 'specialty' in d
        assert 'slot_duration' in d
        assert 'service_fee' in d

    def test_no_auth_required(self, client, provider):
        res = client.get('/api/providers/')
        assert res.status_code == 200

    def test_filter_by_category(self, client, provider):
        from apps.businesses.models import BusinessCategory
        res = client.get(f'/api/providers/?category={BusinessCategory.MEDICAL}')
        assert res.status_code == 200
        assert len(res.json()) == 1


@pytest.mark.django_db
class TestProviderDetailAPI:
    def test_returns_provider(self, client, provider):
        res = client.get(f'/api/providers/{provider.pk}/')
        assert res.status_code == 200
        assert res.json()['id'] == provider.pk

    def test_nonexistent_returns_404(self, client):
        res = client.get('/api/providers/9999/')
        assert res.status_code == 404

    def test_inactive_returns_404(self, client, provider):
        provider.is_active = False
        provider.save()
        res = client.get(f'/api/providers/{provider.pk}/')
        assert res.status_code == 404


@pytest.mark.django_db
class TestAvailableSlotsAPI:
    def test_missing_date_param_returns_400(self, client, provider):
        res = client.get(f'/api/providers/{provider.pk}/slots/')
        assert res.status_code == 400

    def test_invalid_date_returns_400(self, client, provider):
        res = client.get(f'/api/providers/{provider.pk}/slots/?date=not-a-date')
        assert res.status_code == 400

    def test_returns_slots_for_valid_date(self, client, provider, service, working_hours):
        # Saturday 2026-12-12 — slots exist because working_hours is Saturday
        res = client.get(f'/api/providers/{provider.pk}/slots/?date=2026-12-12')
        assert res.status_code == 200
        data = res.json()
        assert 'slots' in data
        # 09:00–11:00 with 30-min slots → 4 slots
        assert len(data['slots']) == 4

    def test_returns_empty_when_no_schedule(self, client, provider):
        # No working_hours fixture — no slots
        res = client.get(f'/api/providers/{provider.pk}/slots/?date=2026-12-12')
        assert res.status_code == 200
        assert res.json()['slots'] == []

    def test_nonexistent_provider_returns_404(self, client):
        res = client.get('/api/providers/9999/slots/?date=2026-12-12')
        assert res.status_code == 404


@pytest.mark.django_db
class TestMyProviderProfileAPI:
    def test_unauthenticated_returns_401(self, client):
        res = client.get('/api/providers/me/')
        assert res.status_code == 401

    def test_returns_own_profile(self, client, provider, provider_user):
        res = client.get('/api/providers/me/', **auth(provider_user))
        assert res.status_code == 200
        assert res.json()['specialty'] == 'قلب و عروق'

    def test_user_without_provider_profile_returns_404(self, client, customer_user):
        res = client.get('/api/providers/me/', **auth(customer_user))
        assert res.status_code == 404

    def test_patch_updates_bio(self, client, provider, provider_user):
        res = client.patch(
            '/api/providers/me/',
            {'bio': 'متخصص قلب با ۱۰ سال تجربه'},
            content_type='application/json',
            **auth(provider_user),
        )
        assert res.status_code == 200
        provider.refresh_from_db()
        assert provider.bio == 'متخصص قلب با ۱۰ سال تجربه'
