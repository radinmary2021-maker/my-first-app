# راهنمای تنظیم Sentry برای NobatYar

## ۱. ساخت پروژه در Sentry

1. به **https://sentry.io** بروید
2. Sign up / Login کنید
3. **New Project** بسازید:
   - Platform: **Django** (برای backend)
   - Platform: **React** (برای frontend)
4. DSN را کپی کنید

---

## ۲. تنظیم Backend (Django)

### در فایل `.env` یا `.env.prod`:

```env
SENTRY_DSN=https://xxxx@oXXXX.ingest.sentry.io/YYYY
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

### تأیید نصب:

```bash
docker compose exec backend python -c "import sentry_sdk; print('Sentry OK')"
```

### تست ارسال خطا:

```bash
docker compose exec backend python manage.py shell -c "
import sentry_sdk
sentry_sdk.capture_message('Test message from NobatYar backend')
print('Message sent to Sentry')
"
```

---

## ۳. تنظیم Frontend (React)

### نصب package:

```bash
cd frontend
npm install @sentry/react
```

### در فایل `.env` پروژه:

```env
VITE_SENTRY_DSN=https://xxxx@oXXXX.ingest.sentry.io/ZZZZ
VITE_SENTRY_ENVIRONMENT=production
```

> **نکته:** DSN فرانت‌اند باید از پروژه **React** باشد، نه پروژه Django.

---

## ۴. آنچه Sentry ثبت می‌کند

| لایه | خطاهای ثبت‌شده |
|------|----------------|
| Django | Unhandled exceptions, 500 errors |
| Celery | Task failures, retries exhausted |
| React | JS errors, component crashes |
| Logging | `ERROR` level logs |

---

## ۵. Performance Monitoring

با `SENTRY_TRACES_SAMPLE_RATE=0.1`، ۱۰٪ از درخواست‌ها trace می‌شوند.
برای محیط dev می‌توانید `1.0` (۱۰۰٪) استفاده کنید.

---

## ۶. Alert تنظیم کنید

در داشبورد Sentry:
1. **Alerts** → **Create Alert**
2. برای `error rate > 5%` یا `new issue` alert بسازید
3. **Notification** را به Telegram یا Email وصل کنید

---

## ۷. Source Maps (اختیاری)

برای نمایش کد خطا در React:

```bash
# در vite.config.js
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: "your-org",
      project: "nobatYar-frontend",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  build: { sourcemap: true },
});
```
