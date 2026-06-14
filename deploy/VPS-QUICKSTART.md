# Nobatic — راهنمای سریع استقرار روی VPS

> این سند راهنمای استفاده از `setup.sh` است که کل محیط production را
> با یک دستور راه‌اندازی می‌کند.

---

## قبل از شروع — چک‌لیست

| مورد | وضعیت |
|------|--------|
| DNS A record برای `nobatiic.ir` → `185.206.93.22` | باید قبلاً تنظیم شده باشد |
| DNS A record برای `www.nobatiic.ir` → `185.206.93.22` | اختیاری (اسکریپت fallback دارد) |
| دسترسی SSH به سرور با دسترسی root | الزامی |
| پورت‌های 80 و 443 روی سرور آزاد باشند | الزامی برای Certbot |

> DNS propagation معمولاً ۱–۲۴ ساعت طول می‌کشد. قبل از اجرای اسکریپت
> با `nslookup nobatiic.ir` تأیید کن که A record درست است.

---

## آپلود و اجرا (یک دستور)

### گام ۱ — یک چیز را در `setup.sh` ویرایش کن

```bash
# روی کامپیوتر خودت:
nano deploy/setup.sh
```

خط زیر را پیدا کن و ایمیلت را وارد کن:

```bash
CERTBOT_EMAIL="your-email@example.com"   # ← این را عوض کن
```

### گام ۲ — آپلود و اجرا

```bash
# از پوشه ریشه پروژه روی کامپیوتر خودت:
scp deploy/setup.sh root@185.206.93.22:/root/setup.sh
ssh root@185.206.93.22 "bash /root/setup.sh"
```

یا اگر SSH key داری:

```bash
scp -i ~/.ssh/my_key deploy/setup.sh root@185.206.93.22:/root/setup.sh
ssh -i ~/.ssh/my_key root@185.206.93.22 "bash /root/setup.sh"
```

> اجرای اول ممکن است ۵–۱۵ دقیقه طول بکشد (npm build + Docker image build).

---

## بعد از اجرا — چک‌لیست تأیید

### ۱. وضعیت container‌ها

```bash
ssh root@185.206.93.22 \
  "docker compose -f /opt/nobatic/docker-compose.prod.yml ps"
```

خروجی مورد انتظار — همه باید `running` یا `healthy` باشند:

```
NAME              STATUS
nobatic-db-1      healthy
nobatic-redis-1   healthy
nobatic-backend-1 healthy
nobatic-celery-1  running
nobatic-nginx-1   running
nobatic-backup-1  running
```

### ۲. Health check

```bash
curl -s https://nobatiic.ir/health/
```

باید JSON برگرداند:

```json
{"status": "ok"}
```

### ۳. صفحه اصلی

```bash
curl -sI https://nobatiic.ir/ | head -5
```

باید `HTTP/2 200` برگرداند.

### ۴. API

```bash
curl -s https://nobatiic.ir/api/providers/ | head -c 100
```

### ۵. SSL

```bash
curl -sI http://nobatiic.ir/ | grep -i location
# باید: Location: https://nobatiic.ir/
```

---

## بازیابی secrets از سرور

Secrets در فایل زیر ذخیره شده‌اند (فقط root می‌تواند بخواند):

```
/root/.env.production
```

برای مشاهده مسیر و تاریخ تولید (بدون دیدن مقادیر):

```bash
ssh root@185.206.93.22 "ls -la /root/.env.production && head -3 /root/.env.production"
```

برای مشاهده کامل (فقط روی خود سرور، نه از راه دور):

```bash
# وارد سرور شو، سپس:
cat /root/.env.production
```

> ⚠️ این فایل را هیچ‌وقت کپی نکن، ایمیل نزن، یا در Slack/Telegram ارسال نکن.

---

## اجرای مجدد (idempotent)

اگر setup.sh دوباره اجرا شود، هر مرحله‌ای که قبلاً انجام شده را رد می‌کند:

```bash
ssh root@185.206.93.22 "bash /root/setup.sh"
```

موارد رد می‌شوند:
- Swap (اگر `/swapfile` وجود داشته باشد)
- Docker (اگر `docker` نصب باشد)
- Secrets (اگر `/root/.env.production` وجود داشته باشد — مقادیر حفظ می‌مانند)
- SSL cert (اگر `/etc/letsencrypt/live/nobatiic.ir/` وجود داشته باشد)

---

## آپدیت پروژه بعد از push جدید

```bash
ssh root@185.206.93.22 << 'EOF'
cd /opt/nobatic
git pull origin main
docker compose -f docker-compose.prod.yml build backend celery celery-beat nginx
docker compose -f docker-compose.prod.yml up -d --no-deps backend celery celery-beat nginx
echo "✔ Update complete"
EOF
```

---

## تنظیمات اختیاری بعد از نصب

### اضافه کردن Kavenegar API (SMS)

```bash
ssh root@185.206.93.22 << 'EOF'
# مقدار را وارد کن:
sed -i 's/KAVENEGAR_API_KEY=/KAVENEGAR_API_KEY=your-key-here/' \
    /opt/nobatic/backend/.env.prod

# سرویس را restart کن:
docker compose -f /opt/nobatic/docker-compose.prod.yml restart backend celery
EOF
```

### اضافه کردن Zarinpal Merchant ID

```bash
ssh root@185.206.93.22 << 'EOF'
sed -i 's/ZARINPAL_MERCHANT_ID=/ZARINPAL_MERCHANT_ID=your-merchant-id/' \
    /opt/nobatic/backend/.env.prod
docker compose -f /opt/nobatic/docker-compose.prod.yml restart backend
EOF
```

### ساخت Django superuser

```bash
ssh root@185.206.93.22 \
  "docker compose -f /opt/nobatic/docker-compose.prod.yml \
   exec backend python manage.py createsuperuser"
```

---

## عیب‌یابی سریع

```bash
# لاگ یک سرویس خاص:
docker compose -f /opt/nobatic/docker-compose.prod.yml logs -f backend

# وضعیت همه سرویس‌ها:
docker compose -f /opt/nobatic/docker-compose.prod.yml ps

# مصرف منابع:
docker stats --no-stream

# تجدید دستی SSL:
certbot renew --dry-run

# UFW وضعیت:
ufw status verbose
```

---

## ساختار فایل‌های secrets روی سرور

```
/root/.env.production          ← master secrets (chmod 600, فقط root)
/opt/nobatic/.env              ← DB vars برای docker-compose (chmod 600)
/opt/nobatic/backend/.env.prod ← backend env (chmod 600)
/opt/nobatic/nginx/ssl/        ← SSL certs (کپی از /etc/letsencrypt/)
```

> فایل master را نگه‌دار. اگر `.env` یا `backend/.env.prod` پاک شوند،
> می‌توانی با اجرای مجدد `setup.sh` آن‌ها را از master بازسازی کنی.
