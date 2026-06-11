from datetime import date

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q

from apps.scheduling.models import Service
from apps.scheduling.serializers import ServiceSerializer

from common.exceptions import ProviderAlreadyExistsError
from common.mixins import BusinessContextMixin
from common.permissions import IsBusinessMember, IsBusinessOwner

from .models import BusinessCategory, Provider
from .serializers import (
    AvailableSlotsSerializer,
    BusinessProviderSerializer,
    CreateProviderSerializer,
    ProviderSerializer,
    UpdateProviderProfileSerializer,
    UpdateProviderSerializer,
)
from .services import ProviderService, get_available_slots


class ProviderListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Provider.objects.filter(is_active=True).select_related('user')
        category = request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        q = request.query_params.get('q', '').strip()
        if q:
            qs = qs.filter(
                Q(user__full_name__icontains=q) |
                Q(specialty__icontains=q) |
                Q(business_name__icontains=q) |
                Q(category__icontains=q)
            )
        return Response(ProviderSerializer(qs, many=True).data)


class ProviderDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            provider = Provider.objects.select_related('user').get(pk=pk, is_active=True)
        except Provider.DoesNotExist:
            return Response({'error': 'ارائه‌دهنده یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ProviderSerializer(provider).data)


class BusinessCategoryListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        categories = [{'value': v, 'label': l} for v, l in BusinessCategory.choices]
        return Response(categories)


class MyProviderProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_provider(self, user):
        try:
            return user.provider_profile
        except Provider.DoesNotExist:
            return None

    def get(self, request):
        provider = self._get_provider(request.user)
        if not provider:
            return Response({'error': 'پروفایل ارائه‌دهنده یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ProviderSerializer(provider).data)

    def patch(self, request):
        provider = self._get_provider(request.user)
        if not provider:
            return Response({'error': 'پروفایل ارائه‌دهنده یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = UpdateProviderProfileSerializer(provider, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ProviderSerializer(provider).data)


class ProviderServicesView(APIView):
    """
    GET /api/providers/{pk}/services/

    Public — lists active services offered by the provider's business.
    Used by the booking flow so customers can choose a service before booking.
    """
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            provider = Provider.objects.select_related('business').get(pk=pk, is_active=True)
        except Provider.DoesNotExist:
            return Response({'error': 'ارائه‌دهنده یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        services = Service.objects.filter(
            business=provider.business,
            is_active=True,
        ).order_by('name')
        return Response(ServiceSerializer(services, many=True).data)


class ProviderAvailableSlotsView(APIView):
    """
    DEPRECATED — use /api/v1/businesses/me/availability/ instead.
    Kept for frontend backward-compatibility during transition.
    """
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            provider = Provider.objects.get(pk=pk, is_active=True)
        except Provider.DoesNotExist:
            return Response({'error': 'ارائه‌دهنده یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        date_str = request.query_params.get('date')
        if not date_str:
            return Response({'error': 'پارامتر date الزامی است.'}, status=status.HTTP_400_BAD_REQUEST)

        service_id_str = request.query_params.get('service_id')
        if not service_id_str:
            return Response({'error': 'پارامتر service_id الزامی است.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_date = date.fromisoformat(date_str)
        except ValueError:
            return Response({'error': 'فرمت تاریخ نادرست است.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            service_id = int(service_id_str)
        except ValueError:
            return Response({'error': 'service_id باید عدد باشد.'}, status=status.HTTP_400_BAD_REQUEST)

        slots = get_available_slots(provider, target_date, service_id=service_id)
        return Response(AvailableSlotsSerializer({'date': target_date, 'slots': slots}).data)


# ──────────────────────────────────────────────────────────────────────────────
# Business-owner management  (requires BusinessContextMixin)
# ──────────────────────────────────────────────────────────────────────────────

class BusinessProviderListView(BusinessContextMixin, APIView):
    """
    GET  /api/v1/businesses/me/providers/
         Lists ALL providers for the authenticated business (incl. inactive).
         Any business member (owner or staff) may read.

    POST /api/v1/businesses/me/providers/
         Creates a new provider, finds or creates the linked User by phone,
         and adds a BusinessMember(STAFF) record so the provider can log in.
         Owner only.
    """

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsBusinessOwner()]
        return [IsAuthenticated(), IsBusinessMember()]

    def get(self, request):
        qs = (
            Provider.objects
            .filter(business=self.business)
            .select_related('user')
            .order_by('-is_active', 'id')   # active first
        )
        return Response(BusinessProviderSerializer(qs, many=True).data)

    def post(self, request):
        serializer = CreateProviderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        try:
            provider = ProviderService.create_provider(
                business=self.business,
                phone=d['phone'],
                full_name=d.get('full_name', ''),
                specialty=d.get('specialty', ''),
                bio=d.get('bio', ''),
                address=d.get('address', ''),
                service_fee=d.get('service_fee', 0),
                slot_duration=d.get('slot_duration', 30),
                category=d.get('category', ''),
            )
        except ProviderAlreadyExistsError as exc:
            return Response({'error': exc.message}, status=status.HTTP_409_CONFLICT)

        return Response(
            BusinessProviderSerializer(provider).data,
            status=status.HTTP_201_CREATED,
        )


class BusinessProviderDetailView(BusinessContextMixin, APIView):
    """
    PATCH  /api/v1/businesses/me/providers/{provider_id}/
           Partial update. Cannot change the linked user or business.
           Owner only.

    DELETE /api/v1/businesses/me/providers/{provider_id}/
           Soft-deactivates the provider (is_active=False). Idempotent.
           Owner only.
    """
    permission_classes = [IsAuthenticated, IsBusinessOwner]
    http_method_names  = ['patch', 'delete', 'head', 'options']

    def _get_provider_or_404(self, provider_id):
        try:
            return (
                Provider.objects
                .select_related('user')
                .get(pk=provider_id, business=self.business)
            )
        except Provider.DoesNotExist:
            return None

    def patch(self, request, provider_id):
        provider = self._get_provider_or_404(provider_id)
        if provider is None:
            return Response(
                {'error': 'ارائه‌دهنده یافت نشد.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = UpdateProviderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not serializer.validated_data:
            return Response(
                {'error': 'هیچ فیلدی برای به‌روزرسانی ارسال نشده است.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        updated = ProviderService.update_provider(provider, **serializer.validated_data)
        return Response(BusinessProviderSerializer(updated).data)

    def delete(self, request, provider_id):
        provider = self._get_provider_or_404(provider_id)
        if provider is None:
            return Response(
                {'error': 'ارائه‌دهنده یافت نشد.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        ProviderService.deactivate_provider(provider)
        return Response(status=status.HTTP_204_NO_CONTENT)
