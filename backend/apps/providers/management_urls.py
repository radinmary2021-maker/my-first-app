"""
URL patterns for the business-owner Provider Management API.

Mounted at /api/v1/businesses/ in config/urls.py — so the full paths are:
  GET    /api/v1/businesses/me/providers/
  POST   /api/v1/businesses/me/providers/
  PATCH  /api/v1/businesses/me/providers/{provider_id}/
  DELETE /api/v1/businesses/me/providers/{provider_id}/
"""

from django.urls import path

from .views import BusinessProviderListView, BusinessProviderDetailView

urlpatterns = [
    path(
        'me/providers/',
        BusinessProviderListView.as_view(),
        name='business-provider-list',
    ),
    path(
        'me/providers/<int:provider_id>/',
        BusinessProviderDetailView.as_view(),
        name='business-provider-detail',
    ),
]
