from django.urls import path

from .views import (
    BranchDetailView,
    BranchListView,
    BusinessCreateView,
    MemberDetailView,
    MemberListView,
    MyBusinessView,
)

urlpatterns = [
    # Business CRUD
    path('',                                 BusinessCreateView.as_view(), name='business-create'),
    path('me/',                              MyBusinessView.as_view(),     name='business-me'),

    # Member management
    path('me/members/',                      MemberListView.as_view(),       name='member-list'),
    path('me/members/<int:pk>/',             MemberDetailView.as_view(),     name='member-detail'),
    path('me/members/<int:pk>/role/',        MemberDetailView.as_view(),     name='member-role'),

    # Branch management
    path('me/branches/',                     BranchListView.as_view(),       name='branch-list'),
    path('me/branches/<int:pk>/',            BranchDetailView.as_view(),     name='branch-detail'),
]
