from django.urls import path

from .views import BookAppointmentView, CancelAppointmentView, MyAppointmentsView

urlpatterns = [
    path('', BookAppointmentView.as_view(), name='book-appointment'),
    path('mine/', MyAppointmentsView.as_view(), name='my-appointments'),
    path('<int:pk>/cancel/', CancelAppointmentView.as_view(), name='cancel-appointment'),
]
