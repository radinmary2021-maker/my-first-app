import logging
from urllib.parse import urlencode

from django.conf import settings
from django.shortcuts import redirect
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.appointments.models import Appointment

from .services import PaymentError, confirm_payment, initiate_payment

logger = logging.getLogger('apps.payments')


class InitiatePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            appointment = Appointment.objects.select_related('provider').get(
                pk=pk, customer=request.user
            )
        except Appointment.DoesNotExist:
            return Response({'error': 'نوبت یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        callback_url = (
            f"{settings.ZARINPAL_CALLBACK_BASE_URL}/api/payments/callback/"
        )

        try:
            result = initiate_payment(appointment, callback_url)
        except PaymentError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(result)


class PaymentCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        authority = request.query_params.get('Authority')
        pay_status = request.query_params.get('Status')
        frontend_result_url = f"{settings.FRONTEND_BASE_URL}/payment/result"

        if pay_status != 'OK' or not authority:
            return redirect(f"{frontend_result_url}?{urlencode({'status': 'failed'})}")

        try:
            payment = confirm_payment(authority)
        except PaymentError as e:
            logger.warning('payment callback failed: authority=%s error=%s', authority, e)
            return redirect(f"{frontend_result_url}?{urlencode({'status': 'failed'})}")

        params = urlencode({
            'status': 'success',
            'tracking_code': payment.appointment.tracking_code,
            'ref_id': payment.ref_id,
        })
        return redirect(f"{frontend_result_url}?{params}")
