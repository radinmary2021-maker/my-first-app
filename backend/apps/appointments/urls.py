"""
apps/appointments/urls.py
"""

from django.urls import path

from .views import (
    BookAppointmentView,
    MyAppointmentsView,
    CancelAppointmentView,
    TrackingView,
    ProviderAppointmentsView,
    BusinessAppointmentsView,
    ConfirmAppointmentView,
    CompleteAppointmentView,
    NoShowAppointmentView,
)

urlpatterns = [
    # Customer
    path('',                        BookAppointmentView.as_view(),    name='book-appointment'),
    path('mine/',                   MyAppointmentsView.as_view(),     name='my-appointments'),
    path('<int:pk>/cancel/',        CancelAppointmentView.as_view(),  name='cancel-appointment'),
    path('track/<str:code>/',       TrackingView.as_view(),           name='track-appointment'),

    # Staff / Provider
    path('provider/',               ProviderAppointmentsView.as_view(),  name='provider-appointments'),
    path('business/',               BusinessAppointmentsView.as_view(),  name='business-appointments'),
    path('<int:pk>/confirm/',       ConfirmAppointmentView.as_view(),     name='confirm-appointment'),
    path('<int:pk>/complete/',      CompleteAppointmentView.as_view(),    name='complete-appointment'),
    path('<int:pk>/no-show/',       NoShowAppointmentView.as_view(),      name='no-show-appointment'),
]
