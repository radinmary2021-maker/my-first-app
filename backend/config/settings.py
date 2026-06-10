import environ
import logging
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, False),
    DB_PORT=(int, 5432),
    SENTRY_DSN=(str, ''),
    SENTRY_ENVIRONMENT=(str, 'development'),
    SENTRY_TRACES_SAMPLE_RATE=(float, 0.1),
)

# Read .env file when present (local dev / Docker).
# On Render / cloud PaaS the file won't exist; env vars come from the dashboard.
_env_file = BASE_DIR / '.env'
if _env_file.exists():
    environ.Env.read_env(_env_file)

SECRET_KEY = env('SECRET_KEY')
DEBUG = env('DEBUG')
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['*'])

# ── Validate required env vars in production ──────────────────────────────────
if not DEBUG:
    # Accept either a DATABASE_URL (Render / cloud PaaS) or individual DB_* vars
    # (Docker Compose self-hosted).  At least one form must be present.
    _has_database_url  = bool(env('DATABASE_URL',  default=''))
    _has_individual_db = bool(env('DB_NAME', default=''))
    _required_base = ['SECRET_KEY', 'REDIS_URL', 'ALLOWED_HOSTS', 'CORS_ALLOWED_ORIGINS']
    _required_individual = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST']
    _missing = [k for k in _required_base if not env(k, default='')]
    if not _has_database_url and not _has_individual_db:
        _missing += _required_individual
    if _missing:
        raise RuntimeError(f"Missing required env vars: {', '.join(_missing)}")

DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    'django_celery_beat',
]

LOCAL_APPS = [
    'apps.accounts',
    'apps.businesses',    # ← tenant core (must come before providers)
    'apps.providers',
    'apps.scheduling',    # ← booking engine (after providers, before appointments)
    'apps.appointments',
    'apps.payments',
    'apps.notifications',
    'apps.analytics',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    # WhiteNoise serves static files in production; Django dev server handles
    # them in development (DEBUG=True) so the package is not required in dev.
    *(['whitenoise.middleware.WhiteNoiseMiddleware'] if not DEBUG else []),
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Support DATABASE_URL (Render / Heroku / Railway) and individual vars (Docker Compose).
_database_url = env('DATABASE_URL', default='')
if _database_url:
    DATABASES = {'default': env.db('DATABASE_URL')}
    DATABASES['default'].update({
        'CONN_MAX_AGE': 60,
        'CONN_HEALTH_CHECKS': True,
        'OPTIONS': {'connect_timeout': 10},
    })
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': env('DB_NAME'),
            'USER': env('DB_USER'),
            'PASSWORD': env('DB_PASSWORD'),
            'HOST': env('DB_HOST'),
            'PORT': env('DB_PORT'),
            'CONN_MAX_AGE': 60,
            'CONN_HEALTH_CHECKS': True,
            'OPTIONS': {'connect_timeout': 10},
        }
    }

REDIS_URL = env('REDIS_URL')

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': REDIS_URL,
    }
}

AUTH_USER_MODEL = 'accounts.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'apps.accounts.authentication.SilentJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '60/minute',
        'user': '300/minute',
    },
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Tehran'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
# WhiteNoise compressed storage is only used in production.
# In development Django's built-in static file serving is sufficient.
if not DEBUG:
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ── Security Headers ─────────────────────────────────────────────────────────
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
REFERRER_POLICY = 'strict-origin-when-cross-origin'

if not DEBUG:
    # Start with 5 minutes during beta so HSTS can be safely rolled back if needed.
    # Ramp to 31536000 (1 year) + HSTS preload only after the domain is confirmed stable.
    SECURE_HSTS_SECONDS = env.int('SECURE_HSTS_SECONDS', default=300)
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = False   # only enable after ramping to 1 year
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    CSRF_COOKIE_HTTPONLY = True
    # Required when Django sits behind an SSL-terminating reverse proxy (nginx).
    # Without this, SECURE_SSL_REDIRECT sees every request as HTTP and
    # produces an infinite 301 redirect loop.
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    USE_X_FORWARDED_HOST = True

# ── Logging ───────────────────────────────────────────────────────────────────
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {module} — {message}',
            'style': '{',
        },
        'simple': {
            'format': '[{levelname}] {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO' if DEBUG else 'WARNING',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
        'celery': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# ── Sentry ────────────────────────────────────────────────────────────────────
SENTRY_DSN = env('SENTRY_DSN', default='')
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.celery import CeleryIntegration
    from sentry_sdk.integrations.logging import LoggingIntegration

    sentry_logging = LoggingIntegration(
        level=logging.INFO,
        event_level=logging.ERROR,
    )

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            DjangoIntegration(transaction_style='url'),
            CeleryIntegration(monitor_beat_tasks=True),
            sentry_logging,
        ],
        traces_sample_rate=env('SENTRY_TRACES_SAMPLE_RATE', default=0.1),
        environment=env('SENTRY_ENVIRONMENT', default='development'),
        send_default_pii=False,
        attach_stacktrace=True,
        _experiments={
            'continuous_profiling_auto_start': False,
        },
    )

# ── Application Settings ──────────────────────────────────────────────────────
OTP_EXPIRY_SECONDS = 120
OTP_MAX_ATTEMPTS = 5

PAYMENT_EXPIRY_MINUTES = 15
ZARINPAL_MERCHANT_ID = env('ZARINPAL_MERCHANT_ID', default='')
ZARINPAL_SANDBOX = env.bool('ZARINPAL_SANDBOX', default=True)
ZARINPAL_CALLBACK_BASE_URL = env('ZARINPAL_CALLBACK_BASE_URL', default='http://localhost:8000')

CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_TIMEZONE = 'Asia/Tehran'
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_TRACK_STARTED = True
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True

KAVENEGAR_API_KEY = env('KAVENEGAR_API_KEY', default='')

CORS_ALLOWED_ORIGINS = env.list(
    'CORS_ALLOWED_ORIGINS',
    default=['http://localhost:5173'],
)
CORS_ALLOW_CREDENTIALS = True

# CSRF_TRUSTED_ORIGINS is required by Django 4.x when the Host header differs
# from the origin (e.g. behind a reverse proxy, or when using HTTPS custom domains).
# Must include every origin that POSTs to the admin or API.
CSRF_TRUSTED_ORIGINS = env.list(
    'CSRF_TRUSTED_ORIGINS',
    default=['http://localhost:5173', 'http://localhost:8000'],
)

FRONTEND_BASE_URL = env('FRONTEND_BASE_URL', default='http://localhost:5173')
