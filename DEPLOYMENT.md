# راهنمای استقرار NobatYar در Production

## پیش‌نیازها

- VPS با حداقل **2 CPU / 4GB RAM / 40GB SSD**
- Ubuntu 22.04 LTS
- دامنه تنظیم‌شده (مثلاً nobatYar.ir)

---

## ۱. آماده‌سازی VPS

```bash
# به‌روزرسانی سیستم
apt update && apt upgrade -y

# نصب ابزارهای پایه
apt install -y git curl wget vim ufw fail2ban

# تنظیم Firewall
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable

# ایجاد user غیر root
adduser deploy
usermod -aG sudo deploy
su - deploy
```

---

## ۲. نصب Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# خروج و ورود مجدد

# تأیید نصب
docker --version
docker compose version
```

---

## ۳. کلون کردن پروژه

```bash
cd /home/deploy
git clone https://github.com/youruser/nobatYar.git
cd nobatYar
```

---

## ۴. تنظیم Environment Variables

```bash
cp backend/.env.example backend/.env.prod
nano backend/.env.prod
```

مقادیر مهم برای production:

```env
SECRET_KEY=<یک کلید تصادفی قوی - python -c "import secrets; print(secrets.token_hex(50))">
DEBUG=False
ALLOWED_HOSTS=nobatYar.ir,www.nobatYar.ir
DB_NAME=nobatYar_prod
DB_USER=nobatYar_user
DB_PASSWORD=<رمز قوی>
DB_HOST=db
REDIS_URL=redis://redis:6379/0
ZARINPAL_SANDBOX=False
ZARINPAL_MERCHANT_ID=<merchant-id-واقعی>
ZARINPAL_CALLBACK_BASE_URL=https://nobatYar.ir
CORS_ALLOWED_ORIGINS=https://nobatYar.ir,https://www.nobatYar.ir
FRONTEND_BASE_URL=https://nobatYar.ir
SENTRY_DSN=<dsn-از-sentry>
SENTRY_ENVIRONMENT=production
KAVENEGAR_API_KEY=<api-key>
```

---

## ۵. Build فرانت‌اند

```bash
cd frontend
npm ci
VITE_API_BASE_URL=https://nobatYar.ir npm run build
# خروجی در frontend/dist/
cd ..
```

---

## ۶. تنظیم Nginx

```bash
# ویرایش nginx.conf
nano nginx/nginx.conf
# server_name را به دامنه خود تغییر دهید
```

---

## ۷. SSL با Let's Encrypt

```bash
apt install -y certbot

# دریافت گواهی (قبل از راه‌اندازی Docker)
certbot certonly --standalone -d nobatYar.ir -d www.nobatYar.ir

# کپی گواهی‌ها
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/nobatYar.ir/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/nobatYar.ir/privkey.pem   nginx/ssl/

# تمدید خودکار (هر ۳ ماه)
echo "0 3 * * * certbot renew --quiet && docker compose -f /home/deploy/nobatYar/docker-compose.prod.yml restart nginx" | crontab -
```

---

## ۸. اجرای Production

```bash
# ساخت image‌ها
docker compose -f docker-compose.prod.yml build

# اجرای migration
docker compose -f docker-compose.prod.yml run --rm backend \
    python manage.py migrate

# ساخت superuser
docker compose -f docker-compose.prod.yml run --rm backend \
    python manage.py createsuperuser

# راه‌اندازی همه سرویس‌ها
docker compose -f docker-compose.prod.yml up -d

# بررسی وضعیت
docker compose -f docker-compose.prod.yml ps
```

---

## ۹. بکاپ دیتابیس

### بکاپ دستی:

```bash
docker compose -f docker-compose.prod.yml exec backup /backup.sh
```

### لیست بکاپ‌ها:

```bash
ls -lh backups/
```

### بازیابی از بکاپ:

```bash
# فایل بکاپ را انتخاب کنید
BACKUP_FILE="backups/nobatYar_20250101_020000.sql.gz"

# اجرای restore
docker compose -f docker-compose.prod.yml run --rm \
    -e BACKUP_FILE="/backups/$(basename $BACKUP_FILE)" \
    -v $(pwd)/backups:/backups \
    backup sh /backup.sh restore "/backups/$(basename $BACKUP_FILE)"
```

### بازیابی مستقیم:

```bash
# ۱. وارد container backup شوید
docker compose -f docker-compose.prod.yml run --rm \
    -v $(pwd)/backups:/backups \
    backup sh

# ۲. داخل container:
sh /backup.sh   # برای بکاپ جدید
# یا:
gunzip -c /backups/nobatYar_XXXXXX.sql.gz | \
    PGPASSWORD=$POSTGRES_PASSWORD psql -h db -U $POSTGRES_USER $POSTGRES_DB
```

---

## ۱۰. مانیتورینگ

```bash
# لاگ‌های live
docker compose -f docker-compose.prod.yml logs -f backend

# وضعیت health check
curl https://nobatYar.ir/health/

# وضعیت container‌ها
docker compose -f docker-compose.prod.yml ps
docker stats
```

---

## ۱۱. آپدیت پروژه

```bash
cd /home/deploy/nobatYar

# دریافت آخرین کد
git pull origin main

# Build مجدد
docker compose -f docker-compose.prod.yml build backend celery celery-beat

# اعمال migration‌های جدید
docker compose -f docker-compose.prod.yml run --rm backend python manage.py migrate

# restart سرویس‌ها
docker compose -f docker-compose.prod.yml up -d --no-deps backend celery celery-beat

echo "✅ Update complete"
```

---

## ۱۲. عیب‌یابی رایج

| مشکل | راه‌حل |
|------|--------|
| `502 Bad Gateway` | `docker compose logs backend` را بررسی کنید |
| خطای migration | `docker compose run backend python manage.py migrate --check` |
| Redis قطع | `docker compose restart redis` |
| بکاپ نمی‌گیرد | `docker compose logs backup` را بررسی کنید |
| SSL منقضی | `certbot renew --force-renewal` |

---

## ساختار فایل‌های Production

```
nobatYar/
├── backend/
│   ├── .env.prod          ← متغیرهای محیطی production
│   └── Dockerfile.prod    ← Dockerfile بهینه‌شده
├── nginx/
│   ├── nginx.conf         ← تنظیمات Nginx
│   └── ssl/               ← گواهی‌های SSL
├── backups/               ← فایل‌های بکاپ (7 نسخه)
├── scripts/
│   ├── backup.sh          ← اسکریپت بکاپ
│   └── restore.sh         ← اسکریپت بازیابی
└── docker-compose.prod.yml
```
