from django.urls import path

from .views import DoctorAvailableSlotsView, DoctorDetailView, DoctorListView

urlpatterns = [
    path('', DoctorListView.as_view(), name='doctor-list'),
    path('<int:pk>/', DoctorDetailView.as_view(), name='doctor-detail'),
    path('<int:pk>/slots/', DoctorAvailableSlotsView.as_view(), name='doctor-slots'),
]
