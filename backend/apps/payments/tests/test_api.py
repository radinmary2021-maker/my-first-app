import pytest
from unittest.mock import patch

from apps.accounts.services import issue_jwt_tokens
from apps.appointments.models import AppointmentStatus

from .conftest import SATURDAY, SLOT_9_00


def auth(user):
    return {'HTTP_AUTHORIZATION': f'Bearer {issue_jwt_tokens(user)["access"]}'}


@pytest.mark.django_db
class TestInitiatePaymentAPI:
    def test_unauthenticated_returns_401(self, client, pending_appointment):
        res = client.post(f'/api/payments/{pending_appointment.pk}/initiate/')
        assert res.status_code == 401

    def test_returns_gate_url(self, client, patient, pending_appointment):
        with patch('apps.payments.services.request_payment') as mock_req:
            mock_req.return_value = {'authority': 'AUTH1', 'gate_url': 'https://zp.test/pay'}
            res = client.post(
                f'/api/payments/{pending_appointment.pk}/initiate/',
                **auth(patient),
            )
        assert res.status_code == 200
        assert 'gate_url' in res.json()

    def test_wrong_patient_returns_404(self, client, doctor_user, pending_appointment):
        res = client.post(
            f'/api/payments/{pending_appointment.pk}/initiate/',
            **auth(doctor_user),
        )
        assert res.status_code == 404

    def test_expired_appointment_returns_400(self, client, patient, pending_appointment):
        from datetime import timedelta
        from django.utils import timezone
        pending_appointment.created_at = timezone.now() - timedelta(minutes=16)
        pending_appointment.save(update_fields=['created_at'])

        res = client.post(
            f'/api/payments/{pending_appointment.pk}/initiate/',
            **auth(patient),
        )
        assert res.status_code == 400
        assert 'منقضی' in res.json()['error']

    def test_nonexistent_appointment_returns_404(self, client, patient):
        res = client.post('/api/payments/9999/initiate/', **auth(patient))
        assert res.status_code == 404


@pytest.mark.django_db
class TestPaymentCallbackAPI:
    def test_cancelled_by_user_returns_400(self, client):
        res = client.get('/api/payments/callback/?Status=NOK&Authority=AUTH1')
        assert res.status_code == 400

    def test_missing_authority_returns_400(self, client):
        res = client.get('/api/payments/callback/?Status=OK')
        assert res.status_code == 400

    def test_successful_callback_returns_ref_id(self, client, patient, pending_appointment):
        with patch('apps.payments.services.request_payment') as mock_req:
            mock_req.return_value = {'authority': 'AUTH-CB', 'gate_url': 'https://zp.test/'}
            client.post(
                f'/api/payments/{pending_appointment.pk}/initiate/',
                **auth(patient),
            )

        with patch('apps.payments.services.verify_payment') as mock_v:
            mock_v.return_value = 'REF-42'
            res = client.get('/api/payments/callback/?Status=OK&Authority=AUTH-CB')

        assert res.status_code == 200
        data = res.json()
        assert data['ref_id'] == 'REF-42'
        assert data['tracking_code'] == pending_appointment.tracking_code

    def test_unknown_authority_returns_400(self, client):
        with patch('apps.payments.services.verify_payment') as mock_v:
            from apps.payments.zarinpal import ZarinpalError
            mock_v.side_effect = ZarinpalError('not found')
            res = client.get('/api/payments/callback/?Status=OK&Authority=UNKNOWN')
        assert res.status_code == 400
