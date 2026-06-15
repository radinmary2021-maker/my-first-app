from django.urls import path

from .views import (
    BusinessCategoryListView,
    MyProviderProfileView,
    ProviderAvailableSlotsView,
    ProviderDetailView,
    ProviderListView,
    ProviderServicesView,
)
from apps.reviews.views import ProviderReviewListView

urlpatterns = [
    path('',                    ProviderListView.as_view(),          name='provider-list'),
    path('categories/',         BusinessCategoryListView.as_view(),  name='business-categories'),
    path('me/',                 MyProviderProfileView.as_view(),     name='my-provider-profile'),
    path('<str:pk>/',            ProviderDetailView.as_view(),        name='provider-detail'),
    path('<int:pk>/slots/',     ProviderAvailableSlotsView.as_view(), name='provider-slots'),
    path('<int:pk>/services/',  ProviderServicesView.as_view(),      name='provider-services'),
    path('<int:pk>/reviews/',   ProviderReviewListView.as_view(),    name='provider-reviews'),
]
