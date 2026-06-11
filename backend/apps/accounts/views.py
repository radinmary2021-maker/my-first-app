import logging

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView

logger = logging.getLogger(__name__)

from .rate_limit import increment_rate_counters, is_rate_limited
from .serializers import SendOTPSerializer, UpdateProfileSerializer, UserSerializer, VerifyOTPSerializer
from .services import generate_otp, get_business_context, get_or_create_user, issue_jwt_tokens, verify_otp

def _rate_limit_response(retry_after: int) -> dict:
    return {
        'success': False,
        'error': 'تعداد درخواست‌ها بیش از حد مجاز است',
        'retry_after_seconds': retry_after,
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

        limited, retry_after = is_rate_limited(phone, ip)
        if limited:
            return Response(_rate_limit_response(retry_after), status=status.HTTP_429_TOO_MANY_REQUESTS)

        code = generate_otp(phone)
        increment_rate_counters(phone, ip)

        if settings.KAVENEGAR_API_KEY:
            from apps.notifications.tasks import send_otp_sms
            send_otp_sms.delay(phone, code)
        else:
            # No Kavenegar key — log OTP so it can be found in dev/staging logs.
            logger.info(f"[OTP] {phone}: {code}")

        response = {'success': True, 'message': 'OTP sent successfully'}
        # DEBUG_OTP alone is sufficient — no need for DEBUG=True as well.
        # This lets staging/production use DEBUG_OTP=True without exposing the
        # debug toolbar or detailed error pages (which DEBUG=True would enable).
        if settings.DEBUG_OTP:
            response['debug_otp'] = code

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
        tokens   = issue_jwt_tokens(user)
        business = get_business_context(user)

        return Response({
            **tokens,
            'user':     UserSerializer(user).data,
            'business': business,   # None for new/customer users
        }, status=status.HTTP_200_OK)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UpdateProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)
