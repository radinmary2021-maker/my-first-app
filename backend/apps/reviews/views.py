"""
apps/reviews/views.py

POST /api/appointments/<pk>/review/   — customer submits a review
GET  /api/providers/<pk>/reviews/     — public paginated list of reviews
"""

from rest_framework import generics, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.appointments.models import Appointment, AppointmentStatus
from .models import Review
from .serializers import CreateReviewSerializer, ReviewSerializer


class ReviewPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class AppointmentReviewView(APIView):
    """POST /api/appointments/<pk>/review/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            appointment = (
                Appointment.objects
                .select_related('customer', 'provider')
                .get(pk=pk)
            )
        except Appointment.DoesNotExist:
            return Response(
                {'error': 'نوبت یافت نشد.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if appointment.customer_id != request.user.id:
            return Response(
                {'error': 'دسترسی به این نوبت ندارید.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if appointment.status != AppointmentStatus.COMPLETED:
            return Response(
                {'error': 'فقط برای نوبت‌های تکمیل‌شده می‌توانید نظر ثبت کنید.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Review.objects.filter(appointment=appointment).exists():
            return Response(
                {'error': 'شما قبلاً برای این نوبت نظر ثبت کرده‌اید.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = CreateReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        review = Review.objects.create(
            appointment=appointment,
            provider=appointment.provider,
            customer=request.user,
            rating=serializer.validated_data['rating'],
            comment=serializer.validated_data.get('comment', ''),
        )

        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class ProviderReviewListView(generics.ListAPIView):
    """GET /api/providers/<pk>/reviews/"""
    serializer_class   = ReviewSerializer
    permission_classes = [AllowAny]
    pagination_class   = ReviewPagination

    def get_queryset(self):
        return (
            Review.objects
            .filter(provider_id=self.kwargs['pk'])
            .select_related('customer')
            .order_by('-created_at')
        )
