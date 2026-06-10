"""
apps/scheduling/urls.py

Mounted under: /api/v1/businesses/
(see config/urls.py and apps/businesses/urls.py for the include chain)
"""

from django.urls import path

from .views import (
    ServiceListView,
    ServiceDetailView,
    WorkingHoursListView,
    WorkingHoursDetailView,
    WorkingHoursBulkView,
    TimeOffListView,
    TimeOffDetailView,
    AvailabilityView,
    AvailabilityRangeView,
)

urlpatterns = [
    # Services
    path('me/services/',         ServiceListView.as_view(),   name='service-list'),
    path('me/services/<int:pk>/', ServiceDetailView.as_view(), name='service-detail'),

    # Working Hours
    path('me/working-hours/',             WorkingHoursListView.as_view(),   name='working-hours-list'),
    path('me/working-hours/bulk/',        WorkingHoursBulkView.as_view(),   name='working-hours-bulk'),
    path('me/working-hours/<int:pk>/',    WorkingHoursDetailView.as_view(), name='working-hours-detail'),

    # Time Off
    path('me/timeoffs/',          TimeOffListView.as_view(),   name='timeoff-list'),
    path('me/timeoffs/<int:pk>/', TimeOffDetailView.as_view(), name='timeoff-detail'),

    # Availability (customer-facing)
    path('me/availability/',        AvailabilityView.as_view(),      name='availability'),
    path('me/availability/range/',  AvailabilityRangeView.as_view(), name='availability-range'),
]
