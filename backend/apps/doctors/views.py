from datetime import date

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Doctor
from .serializers import AvailableSlotsSerializer, DoctorSerializer
from .services import get_available_slots


class DoctorListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        doctors = Doctor.objects.filter(is_active=True).select_related('user')
        return Response(DoctorSerializer(doctors, many=True).data)


class DoctorDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            doctor = Doctor.objects.select_related('user').get(pk=pk, is_active=True)
        except Doctor.DoesNotExist:
            return Response({'error': 'پزشک یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(DoctorSerializer(doctor).data)


class DoctorAvailableSlotsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            doctor = Doctor.objects.get(pk=pk, is_active=True)
        except Doctor.DoesNotExist:
            return Response({'error': 'پزشک یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        date_str = request.query_params.get('date')
        if not date_str:
            return Response({'error': 'پارامتر date الزامی است.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_date = date.fromisoformat(date_str)
        except ValueError:
            return Response({'error': 'فرمت تاریخ نادرست است. از YYYY-MM-DD استفاده کنید.'}, status=status.HTTP_400_BAD_REQUEST)

        slots = get_available_slots(doctor, target_date)
        serializer = AvailableSlotsSerializer({'date': target_date, 'slots': slots})
        return Response(serializer.data)
