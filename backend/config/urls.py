from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
import time


def health_check(request):
    """Health check endpoint for load balancers and monitoring."""
    start = time.monotonic()
    checks = {}

    # DB check
    try:
        connection.ensure_connection()
        checks['database'] = 'ok'
    except Exception as e:
        checks['database'] = f'error: {e}'

    # Redis check
    try:
        cache.set('health_check', '1', 5)
        cache.get('health_check')
        checks['redis'] = 'ok'
    except Exception as e:
        checks['redis'] = f'error: {e}'

    all_ok = all(v == 'ok' for v in checks.values())
    status = 200 if all_ok else 503
    checks['latency_ms'] = round((time.monotonic() - start) * 1000, 2)

    return JsonResponse({'status': 'ok' if all_ok else 'degraded', 'checks': checks}, status=status)


urlpatterns = [
    path('admin/', admin.site.urls),

    # ── Auth ──────────────────────────────────────────────────────────────
    path('api/auth/', include('apps.accounts.urls')),

    # ── SaaS Tenant Core ──────────────────────────────────────────────────
    path('api/v1/businesses/', include('apps.businesses.urls')),

    # ── Scheduling & Appointments v1 (under businesses context) ──────────
    path('api/v1/businesses/', include('apps.scheduling.urls')),
    path('api/v1/businesses/', include('apps.providers.management_urls')),
    path('api/v1/appointments/', include('apps.appointments.urls')),

    # ── Legacy URLs (kept for backward-compat during transition) ──────────
    path('api/providers/',    include('apps.providers.urls')),
    path('api/appointments/', include('apps.appointments.urls')),
    path('api/payments/',     include('apps.payments.urls')),

    # ── Infra ─────────────────────────────────────────────────────────────
    path('health/', health_check, name='health-check'),
]
