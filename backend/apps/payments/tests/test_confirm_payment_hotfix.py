import pytest
from unittest.mock import patch, call

from apps.appointments.models import AppointmentStatus
from apps.payments.models import Payment, PaymentStatus
from apps.payments.services import PaymentError, confirm_payment, initiate_payment
from apps.payments.zarinpal import ZarinpalError

from .conftest import SATURDAY, SLOT_9_00


def _create_payment(pending_appointment, authority='AUTH-HF'):
    with patch('apps.payments.services.request_payment') as mock_req:
        mock_req.return_value = {'authority': authority, 'gate_url': 'https://zp.test/'}
        initiate_payment(pending_appointment, 'http://cb.test/')
    return Payment.objects.get(appointment=pending_appointment)


@pytest.mark.django_db
class TestDoubleCallbackGuard:
    def test_second_callback_returns_same_payment(self, pending_appointment):
        _create_payment(pending_appointment, 'AUTH-DC')

        with patch('apps.payments.services.verify_payment') as mock_v:
            mock_v.return_value = 'REF-1'
            p1 = confirm_payment('AUTH-DC')

        with patch('apps.payments.services.verify_payment') as mock_v2:
            mock_v2.return_value = 'REF-2'
            p2 = confirm_payment('AUTH-DC')
            mock_v2.assert_not_called()

        assert p1.pk == p2.pk
        assert p2.ref_id == 'REF-1'

    def test_paid_payment_no_zarinpal_call(self, pending_appointment):
        _create_payment(pending_appointment, 'AUTH-IDEM')

        with patch('apps.payments.services.verify_payment') as mock_v:
            mock_v.return_value = 'REF-ORIG'
            confirm_payment('AUTH-IDEM')

        with patch('apps.payments.services.verify_payment') as mock_v2:
            confirm_payment('AUTH-IDEM')
            mock_v2.assert_not_called()

    def test_paid_payment_status_unchanged(self, pending_appointment):
        _create_payment(pending_appointment, 'AUTH-ST')

        with patch('apps.payments.services.verify_payment') as mock_v:
            mock_v.return_value = 'REF-ST'
            confirm_payment('AUTH-ST')

        confirm_payment('AUTH-ST')

        payment = Payment.objects.get(appointment=pending_appointment)
        assert payment.status == PaymentStatus.PAID
        assert payment.ref_id == 'REF-ST'


@pytest.mark.django_db
class TestAtomicConfirmPayment:
    def test_payment_and_appointment_update_together(self, pending_appointment):
        _create_payment(pending_appointment, 'AUTH-AT')

        with patch('apps.payments.services.verify_payment') as mock_v:
            mock_v.return_value = 'REF-AT'
            confirm_payment('AUTH-AT')

        payment = Payment.objects.get(appointment=pending_appointment)
        pending_appointment.refresh_from_db()

        assert payment.status == PaymentStatus.PAID
        assert pending_appointment.status == AppointmentStatus.CONFIRMED

    def test_zarinpal_failure_after_lock_leaves_payment_failed(self, pending_appointment):
        """
        If Zarinpal.verify raises AFTER we've acquired the lock (but before
        we write to the DB), the payment must be marked FAILED and the
        appointment must stay PENDING — not CONFIRMED.

        This replaces the old .save()-patch test, which broke when the
        implementation switched from .save() to QuerySet.update().
        """
        from apps.payments.zarinpal import ZarinpalError

        _create_payment(pending_appointment, 'AUTH-RB')

        with patch('apps.payments.services.verify_payment') as mock_v:
            mock_v.side_effect = ZarinpalError('forced failure')
            with pytest.raises(PaymentError):
                confirm_payment('AUTH-RB')

        payment = Payment.objects.get(appointment=pending_appointment)
        assert payment.status == PaymentStatus.FAILED
        assert payment.ref_id is None

        pending_appointment.refresh_from_db()
        assert pending_appointment.status == AppointmentStatus.PENDING
