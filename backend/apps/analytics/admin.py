"""
apps/analytics/admin.py

Super-admin analytics dashboard at /admin/analytics/

Metrics are platform-wide (all businesses).
For per-business analytics see Priority 4: Analytics REST API.

Role mapping (current UserRole enum in apps/accounts/models.py):
  customer  — end-users booking appointments
  owner     — business owners
  provider  — LEGACY backward-compat alias for owner (pre-SaaS-refactor accounts)
  admin     — system admins
"""

from django.contrib import admin
from django.template.response import TemplateResponse
from django.urls import path
from django.utils import timezone
from django.db.models import Sum
from datetime import timedelta


def get_analytics_context():
    from apps.accounts.models import User, UserRole
    from apps.appointments.models import Appointment, AppointmentStatus
    from apps.payments.models import Payment, PaymentStatus

    today       = timezone.localdate()
    month_start = today.replace(day=1)

    # ── User stats ────────────────────────────────────────────────────────────
    total_users = User.objects.count()

    # Business owners: role='owner' (new) + role='provider' (legacy BC)
    total_owners = User.objects.filter(
        role__in=[UserRole.OWNER, UserRole.PROVIDER],
        is_active=True,
    ).count()

    total_customers = User.objects.filter(role=UserRole.CUSTOMER).count()
    new_users_today = User.objects.filter(created_at__date=today).count()

    # ── Appointment stats ─────────────────────────────────────────────────────
    appointments_today = Appointment.objects.filter(date=today).count()
    appointments_month = Appointment.objects.filter(date__gte=month_start).count()

    appointments_cancelled = Appointment.objects.filter(
        status=AppointmentStatus.CANCELLED
    ).count()
    appointments_completed = Appointment.objects.filter(
        status=AppointmentStatus.COMPLETED
    ).count()
    appointments_confirmed = Appointment.objects.filter(
        status=AppointmentStatus.CONFIRMED, date__gte=today
    ).count()

    # ── Revenue ───────────────────────────────────────────────────────────────
    total_revenue = (
        Payment.objects.filter(status=PaymentStatus.PAID)
        .aggregate(total=Sum('amount'))['total'] or 0
    )
    monthly_revenue = (
        Payment.objects.filter(status=PaymentStatus.PAID, created_at__date__gte=month_start)
        .aggregate(total=Sum('amount'))['total'] or 0
    )

    # ── Chart: appointments registered per day (last 30 days) ─────────────────
    daily_data = []
    for i in range(29, -1, -1):
        day   = today - timedelta(days=i)
        count = Appointment.objects.filter(created_at__date=day).count()
        daily_data.append({'date': day.strftime('%m/%d'), 'count': count})

    max_count = max((d['count'] for d in daily_data), default=1) or 1

    return {
        'total_users':            total_users,
        'total_owners':           total_owners,
        'total_customers':        total_customers,
        'new_users_today':        new_users_today,
        'appointments_today':     appointments_today,
        'appointments_month':     appointments_month,
        'appointments_cancelled': appointments_cancelled,
        'appointments_completed': appointments_completed,
        'appointments_confirmed': appointments_confirmed,
        'total_revenue':          f'{int(total_revenue):,}',
        'monthly_revenue':        f'{int(monthly_revenue):,}',
        'daily_data':             daily_data,
        'max_count':              max_count,
    }


# ── Patch Django admin to add the analytics URL ──────────────────────────────

_original_get_urls = admin.site.__class__.get_urls


def _analytics_view(self, request):
    if not request.user.is_staff:
        from django.contrib.auth.views import redirect_to_login
        return redirect_to_login(request.get_full_path())

    context = {
        **self.each_context(request),
        'title': 'داشبورد آماری',
        **get_analytics_context(),
    }
    return TemplateResponse(request, 'admin/analytics/dashboard.html', context)


def _patched_get_urls(self):
    urls   = _original_get_urls(self)
    custom = [
        path(
            'analytics/',
            self.admin_view(_analytics_view.__get__(self)),
            name='analytics_dashboard',
        ),
    ]
    return custom + urls


admin.site.__class__.get_urls = _patched_get_urls
