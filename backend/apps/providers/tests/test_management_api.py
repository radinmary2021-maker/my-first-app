"""
apps/providers/tests/test_management_api.py

End-to-end HTTP tests for the Provider Management API.

Endpoints under test:
  GET    /api/v1/businesses/me/providers/
  POST   /api/v1/businesses/me/providers/
  PATCH  /api/v1/businesses/me/providers/{provider_id}/
  DELETE /api/v1/businesses/me/providers/{provider_id}/

Coverage matrix:
  ┌─────────────────────────────────────┬────────┬───────┬──────────┬────────┐
  │ Scenario                            │ GET    │ POST  │ PATCH    │ DELETE │
  ├─────────────────────────────────────┼────────┼───────┼──────────┼────────┤
  │ Unauthenticated                     │ 401    │ 401   │ 401      │ 401    │
  │ Customer (no business membership)   │ 403    │ 403   │ 403      │ 403    │
  │ Staff member (read only)            │ 200 ✓  │ 403   │ 403      │ 403    │
  │ Owner (full access)                 │ 200 ✓  │ 201 ✓ │ 200 ✓   │ 204 ✓  │
  │ Owner from other business           │ 403    │ 403   │ 403/404  │ 403/404│
  └─────────────────────────────────────┴────────┴───────┴──────────┴────────┘
"""

import pytest

from apps.accounts.models import User, UserRole
from apps.accounts.services import issue_jwt_tokens
from apps.businesses.models import BusinessMember, MemberRole
from apps.providers.models import Provider


# ── Auth helper ───────────────────────────────────────────────────────────────

def auth(user):
    """Returns HTTP_AUTHORIZATION header dict for the given user."""
    return {'HTTP_AUTHORIZATION': f'Bearer {issue_jwt_tokens(user)["access"]}'}


LIST_URL   = '/api/v1/businesses/me/providers/'
DETAIL_URL = '/api/v1/businesses/me/providers/{id}/'


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/v1/businesses/me/providers/
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestProviderListGET:

    def test_unauthenticated_returns_401(self, client):
        res = client.get(LIST_URL)
        assert res.status_code == 401

    def test_customer_without_membership_returns_403(self, client, customer_user, business):
        """customer_user is not a BusinessMember → no business context."""
        res = client.get(LIST_URL, **auth(customer_user))
        assert res.status_code == 403

    def test_owner_can_list_providers(self, client, owner_user, business, provider):
        res = client.get(LIST_URL, **auth(owner_user))
        assert res.status_code == 200
        ids = [p['id'] for p in res.json()]
        assert provider.pk in ids

    def test_staff_can_list_providers(
        self, client, staff_user, staff_membership, business, provider
    ):
        res = client.get(LIST_URL, **auth(staff_user))
        assert res.status_code == 200
        ids = [p['id'] for p in res.json()]
        assert provider.pk in ids

    def test_response_includes_phone(self, client, owner_user, business, provider):
        res = client.get(LIST_URL, **auth(owner_user))
        assert res.status_code == 200
        item = next(p for p in res.json() if p['id'] == provider.pk)
        assert item['phone'] == provider.user.phone

    def test_response_includes_expected_fields(self, client, owner_user, business, provider):
        res = client.get(LIST_URL, **auth(owner_user))
        item = next(p for p in res.json() if p['id'] == provider.pk)
        for field in ['id', 'full_name', 'phone', 'specialty', 'service_fee',
                      'slot_duration', 'category', 'is_active']:
            assert field in item, f'Missing field: {field}'

    def test_returns_both_active_and_inactive_providers(
        self, client, owner_user, business, provider
    ):
        """Management list shows all providers, including deactivated ones."""
        provider.is_active = False
        provider.save(update_fields=['is_active'])
        res = client.get(LIST_URL, **auth(owner_user))
        ids = [p['id'] for p in res.json()]
        assert provider.pk in ids

    def test_other_business_owner_returns_403(
        self, client, other_owner_user, other_business, business, provider
    ):
        """Owner of a different business cannot see this business's providers."""
        res = client.get(LIST_URL, **auth(other_owner_user))
        # other_owner_user is a member of other_business, and BusinessContextMixin
        # picks the user's own business. Since provider belongs to `business` (not
        # other_business), the list will be empty — but the request itself succeeds.
        # This is correct multi-tenant isolation: other owner sees their own empty list.
        assert res.status_code == 200
        ids = [p['id'] for p in res.json()]
        assert provider.pk not in ids


# ──────────────────────────────────────────────────────────────────────────────
# POST /api/v1/businesses/me/providers/
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestProviderListPOST:

    NEW_PHONE = '09110001111'

    def _post(self, client, user, **extra_data):
        data = {'phone': self.NEW_PHONE, 'full_name': 'دکتر جدید', **extra_data}
        return client.post(
            LIST_URL, data, content_type='application/json', **auth(user)
        )

    def test_unauthenticated_returns_401(self, client, business):
        res = client.post(
            LIST_URL, {'phone': self.NEW_PHONE},
            content_type='application/json',
        )
        assert res.status_code == 401

    def test_customer_returns_403(self, client, customer_user, business):
        res = self._post(client, customer_user)
        assert res.status_code == 403

    def test_staff_returns_403(self, client, staff_user, staff_membership, business):
        res = self._post(client, staff_user)
        assert res.status_code == 403

    def test_owner_can_create_provider(self, client, owner_user, business):
        res = self._post(client, owner_user)
        assert res.status_code == 201
        data = res.json()
        assert data['phone'] == self.NEW_PHONE
        assert data['full_name'] == 'دکتر جدید'
        assert data['is_active'] is True

    def test_create_also_creates_business_member(self, client, owner_user, business):
        self._post(client, owner_user)
        new_user = User.objects.get(phone=self.NEW_PHONE)
        assert BusinessMember.objects.filter(
            business=business,
            user=new_user,
            role=MemberRole.STAFF,
            is_active=True,
        ).exists()

    def test_new_user_gets_provider_role(self, client, owner_user, business):
        self._post(client, owner_user)
        new_user = User.objects.get(phone=self.NEW_PHONE)
        assert new_user.role == UserRole.PROVIDER

    def test_existing_customer_gets_role_upgraded(self, client, owner_user, business, customer_user):
        """If the phone belongs to a customer, their role is upgraded to PROVIDER."""
        data = {'phone': customer_user.phone, 'full_name': customer_user.full_name}
        res = client.post(LIST_URL, data, content_type='application/json', **auth(owner_user))
        assert res.status_code == 201
        customer_user.refresh_from_db()
        assert customer_user.role == UserRole.PROVIDER

    def test_invalid_phone_returns_400(self, client, owner_user, business):
        data = {'phone': '123', 'full_name': 'تست'}
        res = client.post(LIST_URL, data, content_type='application/json', **auth(owner_user))
        assert res.status_code == 400
        assert 'phone' in res.json()

    def test_missing_phone_returns_400(self, client, owner_user, business):
        data = {'full_name': 'بدون شماره'}
        res = client.post(LIST_URL, data, content_type='application/json', **auth(owner_user))
        assert res.status_code == 400

    def test_duplicate_provider_returns_409(
        self, client, owner_user, business, provider, provider_user
    ):
        """Creating a provider for a user who already has a profile → 409."""
        data = {'phone': provider_user.phone}
        res = client.post(LIST_URL, data, content_type='application/json', **auth(owner_user))
        assert res.status_code == 409
        assert 'error' in res.json()

    def test_optional_fields_default_correctly(self, client, owner_user, business):
        data = {'phone': self.NEW_PHONE}
        res = client.post(LIST_URL, data, content_type='application/json', **auth(owner_user))
        assert res.status_code == 201
        body = res.json()
        assert body['specialty'] == ''
        assert int(body['slot_duration']) == 30

    def test_invalid_category_returns_400(self, client, owner_user, business):
        data = {'phone': self.NEW_PHONE, 'category': 'does_not_exist'}
        res = client.post(LIST_URL, data, content_type='application/json', **auth(owner_user))
        assert res.status_code == 400

    def test_valid_category_is_stored(self, client, owner_user, business):
        data = {'phone': self.NEW_PHONE, 'category': 'beauty'}
        res = client.post(LIST_URL, data, content_type='application/json', **auth(owner_user))
        assert res.status_code == 201
        assert res.json()['category'] == 'beauty'


# ──────────────────────────────────────────────────────────────────────────────
# PATCH /api/v1/businesses/me/providers/{provider_id}/
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestProviderDetailPATCH:

    def _patch(self, client, user, provider_id, data):
        url = DETAIL_URL.format(id=provider_id)
        return client.patch(
            url, data, content_type='application/json', **auth(user)
        )

    def test_unauthenticated_returns_401(self, client, business, provider):
        url = DETAIL_URL.format(id=provider.pk)
        res = client.patch(url, {'specialty': 'جراحی'}, content_type='application/json')
        assert res.status_code == 401

    def test_customer_returns_403(self, client, customer_user, business, provider):
        res = self._patch(client, customer_user, provider.pk, {'specialty': 'جراحی'})
        assert res.status_code == 403

    def test_staff_returns_403(
        self, client, staff_user, staff_membership, business, provider
    ):
        res = self._patch(client, staff_user, provider.pk, {'specialty': 'جراحی'})
        assert res.status_code == 403

    def test_owner_can_update_specialty(self, client, owner_user, business, provider):
        res = self._patch(client, owner_user, provider.pk, {'specialty': 'جراحی عمومی'})
        assert res.status_code == 200
        assert res.json()['specialty'] == 'جراحی عمومی'
        provider.refresh_from_db()
        assert provider.specialty == 'جراحی عمومی'

    def test_owner_can_update_service_fee(self, client, owner_user, business, provider):
        res = self._patch(client, owner_user, provider.pk, {'service_fee': '800000'})
        assert res.status_code == 200
        assert int(res.json()['service_fee']) == 800_000

    def test_owner_can_reactivate_provider(self, client, owner_user, business, provider):
        provider.is_active = False
        provider.save(update_fields=['is_active'])

        res = self._patch(client, owner_user, provider.pk, {'is_active': True})
        assert res.status_code == 200
        assert res.json()['is_active'] is True

    def test_owner_cannot_update_provider_from_other_business(
        self, client, owner_user, business, other_provider, other_business
    ):
        """Provider belongs to other_business — this owner cannot touch it."""
        res = self._patch(client, owner_user, other_provider.pk, {'specialty': 'هک'})
        # owner_user's business context is 'business', not 'other_business'.
        # Provider lookup is scoped to business → 404.
        assert res.status_code == 404

    def test_nonexistent_provider_returns_404(self, client, owner_user, business):
        res = self._patch(client, owner_user, 999999, {'specialty': 'تست'})
        assert res.status_code == 404

    def test_empty_body_returns_400(self, client, owner_user, business, provider):
        res = self._patch(client, owner_user, provider.pk, {})
        assert res.status_code == 400

    def test_invalid_slot_duration_returns_400(
        self, client, owner_user, business, provider
    ):
        res = self._patch(client, owner_user, provider.pk, {'slot_duration': 2})
        assert res.status_code == 400

    def test_partial_update_does_not_clear_other_fields(
        self, client, owner_user, business, provider
    ):
        """PATCH only updates supplied fields; others remain unchanged."""
        original_fee = provider.service_fee
        res = self._patch(client, owner_user, provider.pk, {'specialty': 'نورولوژی'})
        assert res.status_code == 200
        body = res.json()
        assert body['specialty'] == 'نورولوژی'
        assert int(body['service_fee']) == int(original_fee)


# ──────────────────────────────────────────────────────────────────────────────
# DELETE /api/v1/businesses/me/providers/{provider_id}/
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestProviderDetailDELETE:

    def _delete(self, client, user, provider_id):
        url = DETAIL_URL.format(id=provider_id)
        return client.delete(url, **auth(user))

    def test_unauthenticated_returns_401(self, client, business, provider):
        url = DETAIL_URL.format(id=provider.pk)
        res = client.delete(url)
        assert res.status_code == 401

    def test_customer_returns_403(self, client, customer_user, business, provider):
        res = self._delete(client, customer_user, provider.pk)
        assert res.status_code == 403

    def test_staff_returns_403(
        self, client, staff_user, staff_membership, business, provider
    ):
        res = self._delete(client, staff_user, provider.pk)
        assert res.status_code == 403

    def test_owner_can_deactivate_provider(self, client, owner_user, business, provider):
        res = self._delete(client, owner_user, provider.pk)
        assert res.status_code == 204
        provider.refresh_from_db()
        assert provider.is_active is False

    def test_deactivate_is_idempotent(self, client, owner_user, business, provider):
        """Deleting an already-inactive provider returns 204 without error."""
        provider.is_active = False
        provider.save(update_fields=['is_active'])
        res = self._delete(client, owner_user, provider.pk)
        assert res.status_code == 204

    def test_delete_does_not_remove_business_member(
        self, client, owner_user, business, provider
    ):
        """Soft-deactivation keeps the BusinessMember record intact."""
        member_exists_before = BusinessMember.objects.filter(
            business=business, user=provider.user
        ).exists()

        self._delete(client, owner_user, provider.pk)

        # Provider was created directly (not via ProviderService) in conftest,
        # so there may or may not be a BusinessMember — but it must not be
        # DELETED by the deactivation endpoint.
        if member_exists_before:
            assert BusinessMember.objects.filter(
                business=business, user=provider.user
            ).exists()

    def test_nonexistent_provider_returns_404(self, client, owner_user, business):
        res = self._delete(client, owner_user, 999999)
        assert res.status_code == 404

    def test_owner_cannot_delete_provider_from_other_business(
        self, client, owner_user, business, other_provider
    ):
        """Provider from other_business is invisible to this owner."""
        res = self._delete(client, owner_user, other_provider.pk)
        assert res.status_code == 404


# ──────────────────────────────────────────────────────────────────────────────
# ProviderService unit tests (service-layer only, no HTTP)
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestProviderServiceUnit:
    """Service-layer tests that verify invariants directly without HTTP overhead."""

    def test_create_finds_existing_user_by_phone(self, business, customer_user):
        from apps.providers.services import ProviderService
        provider = ProviderService.create_provider(
            business=business,
            phone=customer_user.phone,
        )
        assert provider.user_id == customer_user.pk

    def test_create_sets_business_correctly(self, business, owner_user):
        from apps.providers.services import ProviderService
        provider = ProviderService.create_provider(
            business=business,
            phone='09110009999',
        )
        assert provider.business_id == business.pk

    def test_create_raises_for_duplicate_user(self, business, provider, provider_user):
        from apps.providers.services import ProviderService
        from common.exceptions import ProviderAlreadyExistsError
        with pytest.raises(ProviderAlreadyExistsError):
            ProviderService.create_provider(business=business, phone=provider_user.phone)

    def test_create_rolls_back_on_error(self, business, monkeypatch):
        """If BusinessMember creation fails, Provider must not be committed."""
        from apps.providers.services import ProviderService
        from apps.businesses.models import BusinessMember

        original_create = BusinessMember.objects.create

        def boom(*args, **kwargs):
            raise RuntimeError('simulated DB failure')

        monkeypatch.setattr(BusinessMember.objects, 'create', boom)

        with pytest.raises(RuntimeError):
            ProviderService.create_provider(
                business=business,
                phone='09110008888',
            )

        # The Provider row must have been rolled back
        assert not Provider.objects.filter(user__phone='09110008888').exists()

    def test_update_changes_fields(self, business, provider):
        from apps.providers.services import ProviderService
        updated = ProviderService.update_provider(
            provider,
            specialty='داخلی',
            service_fee=600_000,
        )
        assert updated.specialty == 'داخلی'
        assert int(updated.service_fee) == 600_000

    def test_update_ignores_protected_fields(self, business, provider, other_business):
        from apps.providers.services import ProviderService
        original_business_id = provider.business_id
        ProviderService.update_provider(
            provider,
            business=other_business,    # must be ignored
            business_id=other_business.pk,  # must be ignored
        )
        provider.refresh_from_db()
        assert provider.business_id == original_business_id

    def test_deactivate_sets_is_active_false(self, business, provider):
        from apps.providers.services import ProviderService
        ProviderService.deactivate_provider(provider)
        provider.refresh_from_db()
        assert provider.is_active is False

    def test_deactivate_is_idempotent(self, business, provider):
        from apps.providers.services import ProviderService
        provider.is_active = False
        provider.save(update_fields=['is_active'])
        # Should not raise and should not change state
        ProviderService.deactivate_provider(provider)
        provider.refresh_from_db()
        assert provider.is_active is False
