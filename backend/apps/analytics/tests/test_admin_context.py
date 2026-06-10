"""
apps/analytics/tests/test_admin_context.py

Regression tests for get_analytics_context().

These tests prevent a recurrence of the crash caused by referencing
removed UserRole enums (UserRole.DOCTOR, UserRole.PATIENT) that was
identified in the Phase-0 blocking-bug audit.
"""

import pytest

from apps.accounts.models import User, UserRole
from apps.analytics.admin import get_analytics_context


@pytest.mark.django_db
class TestAnalyticsContext:
    """get_analytics_context() must not raise and must return expected keys."""

    REQUIRED_KEYS = {
        'total_users',
        'total_owners',
        'total_customers',
        'new_users_today',
        'appointments_today',
        'appointments_month',
        'appointments_cancelled',
        'appointments_completed',
        'appointments_confirmed',
        'total_revenue',
        'monthly_revenue',
        'daily_data',
        'max_count',
    }

    def test_returns_without_error_on_empty_db(self):
        """Must not raise even with no users, appointments, or payments."""
        ctx = get_analytics_context()
        assert ctx is not None

    def test_all_required_keys_present(self):
        ctx = get_analytics_context()
        missing = self.REQUIRED_KEYS - ctx.keys()
        assert not missing, f'Missing context keys: {missing}'

    def test_does_not_use_removed_doctor_role(self):
        """UserRole.DOCTOR must not exist — ensures analytics stays in sync."""
        assert not hasattr(UserRole, 'DOCTOR'), (
            'UserRole.DOCTOR was re-introduced. '
            'Update analytics/admin.py accordingly.'
        )

    def test_does_not_use_removed_patient_role(self):
        """UserRole.PATIENT must not exist — ensures analytics stays in sync."""
        assert not hasattr(UserRole, 'PATIENT'), (
            'UserRole.PATIENT was re-introduced. '
            'Update analytics/admin.py accordingly.'
        )

    def test_total_owners_counts_owner_role(self):
        User.objects.create_user(phone='09110000001', role=UserRole.OWNER)
        ctx = get_analytics_context()
        assert ctx['total_owners'] >= 1

    def test_total_owners_counts_legacy_provider_role(self):
        """Legacy 'provider' role accounts must be counted in total_owners."""
        User.objects.create_user(phone='09110000002', role=UserRole.PROVIDER)
        ctx = get_analytics_context()
        assert ctx['total_owners'] >= 1

    def test_total_customers_counts_customer_role(self):
        User.objects.create_user(phone='09110000003', role=UserRole.CUSTOMER)
        ctx = get_analytics_context()
        assert ctx['total_customers'] >= 1

    def test_daily_data_has_30_entries(self):
        ctx = get_analytics_context()
        assert len(ctx['daily_data']) == 30

    def test_daily_data_entries_have_correct_shape(self):
        ctx = get_analytics_context()
        for entry in ctx['daily_data']:
            assert 'date'  in entry, 'daily_data entry missing "date"'
            assert 'count' in entry, 'daily_data entry missing "count"'
            assert isinstance(entry['count'], int)

    def test_revenue_fields_are_formatted_strings(self):
        """Revenue is returned as a locale-formatted string, not a raw number."""
        ctx = get_analytics_context()
        assert isinstance(ctx['total_revenue'],   str)
        assert isinstance(ctx['monthly_revenue'], str)

    def test_max_count_is_at_least_one(self):
        """max_count must be >= 1 to avoid division-by-zero in the template."""
        ctx = get_analytics_context()
        assert ctx['max_count'] >= 1
