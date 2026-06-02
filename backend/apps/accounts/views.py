from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView

from .rate_limit import increment_rate_counters, is_rate_limited
from .serializers import SendOTPSerializer, UserSerializer, VerifyOTPSerializer
from .services import generate_otp, get_or_create_user, issue_jwt_tokens, verify_otp

_RATE_LIMIT_RESPONSE = {
    'success': False,
    'message': 'Too many requests. Please try again later.',
}


def _get_client_ip(request) -> str:
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '0.0.0.0')


class SendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone = serializer.validated_data['phone']
        ip = _get_client_ip(request)

        if is_rate_limited(phone, ip):
            return Response(_RATE_LIMIT_RESPONSE, status=status.HTTP_429_TOO_MANY_REQUESTS)

        code = generate_otp(phone)
        increment_rate_counters(phone, ip)

        from apps.notifications.tasks import send_otp_sms
        send_otp_sms.delay(phone, code)

        response = {'success': True}
        if settings.DEBUG:
            response['dev_code'] = code

        return Response(response, status=status.HTTP_200_OK)


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone = serializer.validated_data['phone']
        code = serializer.validated_data['otp']

        if not verify_otp(phone, code):
            return Response(
                {'error': 'کد وارد شده نادرست یا منقضی شده است.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user, _ = get_or_create_user(phone)
        tokens = issue_jwt_tokens(user)

        return Response({
            **tokens,
            'user': UserSerializer(user).data,
        }, status=status.HTTP_200_OK)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
