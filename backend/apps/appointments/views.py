from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Appointment
from .serializers import AppointmentSerializer, BookAppointmentSerializer
from .services import BookingError, book_appointment, cancel_appointment


class BookAppointmentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BookAppointmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        doctor = serializer.validated_data['doctor_id']
        appt_date = serializer.validated_data['date']
        start_time = serializer.validated_data['start_time']

        try:
            appointment = book_appointment(request.user, doctor, appt_date, start_time)
        except BookingError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_201_CREATED)


class MyAppointmentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        appointments = (
            Appointment.objects
            .filter(patient=request.user)
            .select_related('doctor__user')
            .order_by('-date', '-start_time')
        )
        return Response(AppointmentSerializer(appointments, many=True).data)


class CancelAppointmentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            appointment = Appointment.objects.get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'error': 'نوبت یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            cancel_appointment(appointment, request.user)
        except BookingError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(AppointmentSerializer(appointment).data)
