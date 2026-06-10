"""
Provider model tests.

Old tests covered Doctor/WeeklySchedule/ScheduleException from apps.doctors
(which has been removed). These tests cover the Provider model and its
relationship with the scheduling engine.
"""
import pytest
from datetime import time

from django.core.exceptions import ValidationError

from apps.providers.models import Provider
from apps.scheduling.models import WorkingHours


@pytest.mark.django_db
class TestProviderModel:
    def test_provider_str(self, provider):
        assert provider.business_name in str(provider)

    def test_provider_linked_to_business(self, provider, business):
        assert provider.business == business

    def test_provider_linked_to_user(self, provider, provider_user):
        assert provider.user == provider_user

    def test_provider_is_active_by_default(self, provider):
        assert provider.is_active is True

    def test_provider_user_reverse_relation(self, provider, provider_user):
        assert provider_user.provider_profile == provider

    def test_slot_duration_default(self, provider):
        assert provider.slot_duration >= 5

    def test_provider_specialty_stored(self, provider):
        assert provider.specialty == 'قلب و عروق'


@pytest.mark.django_db
class TestWorkingHoursValidation:
    """WorkingHours lives in apps.scheduling but is the primitive that
    backs provider availability — tested here for proximity to providers."""

    def test_valid_hours_created(self, business, provider):
        wh = WorkingHours(
            business=business, provider=provider,
            weekday=1, start_time=time(9, 0), end_time=time(13, 0),
        )
        wh.full_clean()  # should not raise

    def test_start_after_end_raises(self, business, provider):
        wh = WorkingHours(
            business=business, provider=provider,
            weekday=1, start_time=time(14, 0), end_time=time(9, 0),
        )
        with pytest.raises(ValidationError):
            wh.full_clean()

    def test_start_equals_end_raises(self, business, provider):
        wh = WorkingHours(
            business=business, provider=provider,
            weekday=1, start_time=time(9, 0), end_time=time(9, 0),
        )
        with pytest.raises(ValidationError):
            wh.full_clean()

    def test_weekday_0_is_saturday(self):
        """Iranian convention: weekday 0 = Saturday."""
        from apps.scheduling.models import Weekday
        assert Weekday.SATURDAY == 0
        assert Weekday.FRIDAY   == 6


@pytest.mark.django_db
class TestProviderAvailableWeekdays:
    def test_returns_empty_when_no_schedule(self, provider):
        from apps.providers.serializers import ProviderSerializer
        data = ProviderSerializer(provider).data
        assert data['available_weekdays'] == []

    def test_returns_weekday_when_schedule_exists(self, provider, working_hours):
        from apps.providers.serializers import ProviderSerializer
        data = ProviderSerializer(provider).data
        assert 0 in data['available_weekdays']  # Saturday

    def test_inactive_schedule_not_included(self, business, provider):
        WorkingHours.objects.create(
            business=business, provider=provider,
            weekday=2, start_time=time(9, 0), end_time=time(12, 0),
            is_active=False,
        )
        from apps.providers.serializers import ProviderSerializer
        data = ProviderSerializer(provider).data
        assert 2 not in data['available_weekdays']
