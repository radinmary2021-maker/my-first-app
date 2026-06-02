import pytest
from unittest.mock import patch, MagicMock

from apps.appointments.models import AppointmentStatus
from apps.payments.models import Payment, PaymentStatus
from apps.payments.services import PaymentError, confirm_payment, initiate_payment
from apps.payments.zarinpal import ZarinpalError

from .conftest import SATURDAY, SLOT_9_00


@pytest.mark.django_db
class TestInitiatePayment:
    def test_creates_payment_record(self, pending_appointment):
        with patch('apps.payments.services.request_payment') as mock_req:
            mock_req.return_value = {'authority': 'AUTH123', 'gate_url': 'https://zp.test/'}
            initiate_payment(pending_appointment, 'http://cb.test/')

        assert Payment.objects.filter(appointment=pending_appointment).exists()

    def test_returns_gate_url(self, pending_appointment):
        with patch('apps.payments.services.request_payment') as mock_req:
            mock_req.return_value = {'authority': 'AUTH123', 'gate_url': 'https://zp.test/pay'}
            result = initiate_payment(pending_appointment, 'http://cb.test/')

        assert result['gate_url'] == 'https://zp.test/pay'
        assert result['tracking_code'] == pending_appointment.tracking_code

    def test_saves_authority(self, pending_appointment):
        with patch('apps.payments.services.request_payment') as mock_req:
            mock_req.return_value = {'authority': 'AUTH-XYZ', 'gate_url': 'https://zp.test/'}
            initiate_payment(pending_appointment, 'http://cb.test/')

        payment = Payment.objects.get(appointment=pending_appointment)
        assert payment.authority == 'AUTH-XYZ'

    def test_zarinpal_error_raises_payment_error(self, pending_appointment):
        with patch('apps.payments.services.request_payment') as mock_req:
            mock_req.side_effect = ZarinpalError('خطای اتصال')
            with pytest.raises(PaymentError, match='خطای اتصال'):
                initiate_payment(pending_appointment, 'http://cb.test/')

    def test_second_initiate_reuses_payment_record(self, pending_appointment):
        with patch('apps.payments.services.request_payment') as mock_req:
            mock_req.return_value = {'authority': 'AUTH1', 'gate_url': 'https://zp.test/'}
            initiate_payment(pending_appointment, 'http://cb.test/')
            mock_req.return_value = {'authority': 'AUTH2', 'gate_url': 'https://zp.test/'}
            initiate_payment(pending_appointment, 'http://cb.test/')

        assert Payment.objects.filter(appointment=pending_appointment).count() == 1


@pytest.mark.django_db
class TestConfirmPayment:
    def _create_payment_with_authority(self, pending_appointment, authority='AUTH-TEST'):
        with patch('apps.payments.services.request_payment') as mock_req:
            mock_req.return_value = {'authority': authority, 'gate_url': 'https://zp.test/'}
            initiate_payment(pending_appointment, 'http://cb.test/')
        return Payment.objects.get(appointment=pending_appointment)

    def test_successful_confirmation_marks_paid(self, pending_appointment):
        self._create_payment_with_authority(pending_appointment, 'AUTH-OK')

        with patch('apps.payments.services.verify_payment') as mock_v:
            mock_v.return_value = 'REF-999'
            payment = confirm_payment('AUTH-OK')

        payment.refresh_from_db()
        assert payment.status == PaymentStatus.PAID
        assert payment.ref_id == 'REF-999'

    def test_successful_confirmation_confirms_appointment(self, pending_appointment):
        self._create_payment_with_authority(pending_appointment, 'AUTH-OK')

        with patch('apps.payments.services.verify_payment') as mock_v:
            mock_v.return_value = 'REF-999'
            confirm_payment('AUTH-OK')

        pending_appointment.refresh_from_db()
        assert pending_appointment.status == AppointmentStatus.CONFIRMED

    def test_zarinpal_verify_failure_marks_failed(self, pending_appointment):
        self._create_payment_with_authority(pending_appointment, 'AUTH-FAIL')

        with patch('apps.payments.services.verify_payment') as mock_v:
            mock_v.side_effect = ZarinpalError('تأیید ناموفق')
            with pytest.raises(PaymentError):
                confirm_payment('AUTH-FAIL')

        payment = Payment.objects.get(appointment=pending_appointment)
        assert payment.status == PaymentStatus.FAILED

    def test_unknown_authority_raises(self):
        with pytest.raises(PaymentError, match='یافت نشد'):
            confirm_payment('UNKNOWN-AUTH')
