# Nobatic — Medical Appointment Booking SaaS

## Render Deployment Checklist

Before deploying / after each new Render service setup, verify these env vars in
the **Render dashboard** (Dashboard → your service → Environment):

| Variable | Production Value | Notes |
|----------|-----------------|-------|
| `DEBUG` | `False` | **Critical** — `True` exposes all URL patterns on 404 pages |
| `DEBUG_OTP` | `False` | **Critical** — `True` leaks OTP codes in API responses |
| `SECRET_KEY` | (auto-generated) | Never commit this |
| `ALLOWED_HOSTS` | `nobatic-api.onrender.com` | Add custom domain when ready |
| `CORS_ALLOWED_ORIGINS` | `https://nobatic-frontend.onrender.com` | Add custom domain |
| `CSRF_TRUSTED_ORIGINS` | both frontend + API origins | Same as CORS |
| `KAVENEGAR_API_KEY` | (set manually) | Never commit this |

> **Warning:** If you created the Render service manually (not via `render.yaml`
> Blueprint), the `render.yaml` env vars are NOT applied automatically. You must
> set `DEBUG=False` and `DEBUG_OTP=False` manually in the Render dashboard.

## Local Development

```bash
# Backend
cd backend
cp ../.env.example .env   # edit with local DB/Redis settings
pip install -r requirements/base.txt
python manage.py migrate
python manage.py runserver

# Frontend
cd frontend
npm install
npm run dev
```
