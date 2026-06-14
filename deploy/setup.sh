#!/usr/bin/env bash
# =============================================================================
#  Nobatic — VPS Production Setup
#  Ubuntu 22.04 LTS | 1 vCPU / 1 GB RAM | Domain: nobatiic.ir
#
#  Usage:
#    sudo bash setup.sh
#
#  Idempotent — safe to run multiple times. Each step checks whether
#  it has already been done before executing.
# =============================================================================
set -euo pipefail

# ── User-configurable ─────────────────────────────────────────────────────────
DOMAIN="nobatiic.ir"
CERTBOT_EMAIL="your-email@example.com"   # ← set your email before running
APP_DIR="/opt/nobatic"
REPO_URL="https://github.com/radinmary2021-maker/my-first-app.git"
SECRETS_FILE="/root/.env.production"     # master secrets — stays outside repo

# ── Colour output ─────────────────────────────────────────────────────────────
G="\033[0;32m"; Y="\033[1;33m"; R="\033[0;31m"; B="\033[1;34m"; NC="\033[0m"
ok()    { echo -e "${G}  ✔  $*${NC}"; }
info()  { echo -e "${Y}  →  $*${NC}"; }
step()  { echo -e "\n${B}══ $* ${NC}"; }
err()   { echo -e "${R}  ✖  $*${NC}"; exit 1; }

# ── Preflight checks ──────────────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && err "Run as root: sudo bash setup.sh"

if [[ "$CERTBOT_EMAIL" == "your-email@example.com" ]]; then
    err "Set CERTBOT_EMAIL at the top of this script before running."
fi

echo -e "${B}"
echo "  ╔═══════════════════════════════════════════╗"
echo "  ║   Nobatic — Production Setup              ║"
echo "  ║   Domain : ${DOMAIN}              ║"
echo "  ║   Dir    : ${APP_DIR}             ║"
echo "  ╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# =============================================================================
# STEP 1 — System update
# =============================================================================
step "1/9  System update"
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq \
    -o Dpkg::Options::="--force-confdef" \
    -o Dpkg::Options::="--force-confold"
apt-get install -y -qq \
    curl git ufw openssl ca-certificates gnupg lsb-release
ok "Packages up to date"

# =============================================================================
# STEP 2 — Swap (npm build needs >512 MB RAM on 1 GB VPS)
# =============================================================================
step "2/9  Swap (2 GB)"
if [[ -f /swapfile ]]; then
    ok "Swap already exists — skipped"
else
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap  /swapfile  >/dev/null
    swapon  /swapfile
    grep -q '/swapfile' /etc/fstab \
        || echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ok "2 GB swap created and mounted"
fi

# =============================================================================
# STEP 3 — Docker Engine + Compose plugin
# =============================================================================
step "3/9  Docker"
if ! command -v docker &>/dev/null; then
    curl -fsSL https://get.docker.com | sh -s -- --quiet
    systemctl enable --now docker
    ok "Docker Engine installed"
else
    ok "Docker already installed ($(docker --version | cut -d' ' -f3 | tr -d ','))"
fi

if ! docker compose version &>/dev/null 2>&1; then
    apt-get install -y -qq docker-compose-plugin
    ok "docker compose plugin installed"
else
    ok "docker compose available ($(docker compose version --short))"
fi

# =============================================================================
# STEP 4 — Clone / update repository
# =============================================================================
step "4/9  Repository"
if [[ ! -d "${APP_DIR}/.git" ]]; then
    git clone --quiet "${REPO_URL}" "${APP_DIR}"
    ok "Repository cloned → ${APP_DIR}"
else
    git -C "${APP_DIR}" fetch --quiet origin main
    git -C "${APP_DIR}" reset --hard origin/main --quiet
    ok "Repository updated to latest main"
fi

# Make sure the backups dir exists (the backup service bind-mounts it)
mkdir -p "${APP_DIR}/backups"

# =============================================================================
# STEP 5 — Generate secrets (only once)
# =============================================================================
step "5/9  Secrets"

if [[ -f "${SECRETS_FILE}" ]]; then
    ok "Secrets file already exists — loading from ${SECRETS_FILE}"
    # shellcheck source=/dev/null
    set -a; source "${SECRETS_FILE}"; set +a
else
    info "Generating new secrets..."

    _SECRET_KEY=$(openssl rand -hex 50)
    _DB_PASSWORD=$(openssl rand -hex 24)

    cat > "${SECRETS_FILE}" <<EOF
# Nobatic production secrets
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Location : ${SECRETS_FILE}
# WARNING  : Do not commit or share this file.

SECRET_KEY=${_SECRET_KEY}
DB_NAME=nobatic_db
DB_USER=nobatic_user
DB_PASSWORD=${_DB_PASSWORD}
EOF
    chmod 600 "${SECRETS_FILE}"
    ok "Secrets generated → ${SECRETS_FILE}  (chmod 600, readable only by root)"

    set -a; source "${SECRETS_FILE}"; set +a
fi

# =============================================================================
# STEP 6 — Write docker-compose .env files from secrets
# =============================================================================
step "6/9  Env files"

# Root .env — consumed by docker-compose variable substitution
# (used by the 'db' and 'backup' services in docker-compose.prod.yml)
cat > "${APP_DIR}/.env" <<EOF
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
EOF
chmod 600 "${APP_DIR}/.env"

# Backend .env.prod — env_file for backend / celery / celery-beat
cat > "${APP_DIR}/backend/.env.prod" <<EOF
SECRET_KEY=${SECRET_KEY}
DEBUG=False
ALLOWED_HOSTS=${DOMAIN},www.${DOMAIN},localhost,127.0.0.1

DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_HOST=db
DB_PORT=5432

REDIS_URL=redis://redis:6379/0

FRONTEND_BASE_URL=https://${DOMAIN}
CORS_ALLOWED_ORIGINS=https://${DOMAIN},https://www.${DOMAIN}

DEBUG_OTP=False

# Fill these in after initial setup:
ZARINPAL_MERCHANT_ID=
ZARINPAL_SANDBOX=False
ZARINPAL_CALLBACK_BASE_URL=https://${DOMAIN}

KAVENEGAR_API_KEY=

SENTRY_DSN=
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.05
EOF
chmod 600 "${APP_DIR}/backend/.env.prod"

ok "Root .env and backend/.env.prod written"

# =============================================================================
# STEP 7 — Patch nginx.conf with real domain
# =============================================================================
step "7/9  Nginx config"
NGINX_CONF="${APP_DIR}/nginx/nginx.conf"

# Replace the placeholder domain.  Running sed on an already-patched file is
# a no-op (pattern won't match), so this step is idempotent.
sed -i \
    "s/yourdomain\.com/${DOMAIN}/g; \
     s/www\.yourdomain\.com/www.${DOMAIN}/g" \
    "${NGINX_CONF}"
ok "nginx.conf patched for ${DOMAIN}"

# =============================================================================
# STEP 8 — SSL certificate via Certbot (standalone, port 80 must be free)
# =============================================================================
step "8/9  SSL certificate"
SSL_LIVE="/etc/letsencrypt/live/${DOMAIN}"
SSL_DEST="${APP_DIR}/nginx/ssl"
mkdir -p "${SSL_DEST}"

if [[ ! -f "${SSL_LIVE}/fullchain.pem" ]]; then
    apt-get install -y -qq certbot

    info "Requesting certificate for ${DOMAIN} and www.${DOMAIN}..."

    # Try apex + www; fall back to apex-only if www has no DNS record.
    if certbot certonly --standalone --non-interactive --agree-tos \
            --email "${CERTBOT_EMAIL}" \
            -d "${DOMAIN}" -d "www.${DOMAIN}" 2>/dev/null; then
        ok "Certificate issued for ${DOMAIN} + www.${DOMAIN}"
    else
        info "www.${DOMAIN} DNS not found — retrying apex domain only..."
        certbot certonly --standalone --non-interactive --agree-tos \
            --email "${CERTBOT_EMAIL}" \
            -d "${DOMAIN}"
        ok "Certificate issued for ${DOMAIN} (apex only)"
    fi
else
    ok "Certificate already exists — skipped"
fi

# Copy certs into bind-mount directory for nginx container
cp -f "${SSL_LIVE}/fullchain.pem" "${SSL_DEST}/fullchain.pem"
cp -f "${SSL_LIVE}/privkey.pem"   "${SSL_DEST}/privkey.pem"
chmod 644 "${SSL_DEST}/fullchain.pem"
chmod 600 "${SSL_DEST}/privkey.pem"
ok "Certs copied → ${SSL_DEST}/"

# Renewal hook: copy certs + reload nginx after every certbot renew
DEPLOY_HOOK="/etc/letsencrypt/renewal-hooks/deploy/nobatic-reload.sh"
if [[ ! -f "${DEPLOY_HOOK}" ]]; then
    cat > "${DEPLOY_HOOK}" <<HOOK
#!/usr/bin/env bash
# Auto-run by certbot after successful renewal
set -euo pipefail
LIVE="/etc/letsencrypt/live/${DOMAIN}"
DEST="${SSL_DEST}"
cp -f "\${LIVE}/fullchain.pem" "\${DEST}/fullchain.pem"
cp -f "\${LIVE}/privkey.pem"   "\${DEST}/privkey.pem"
chmod 644 "\${DEST}/fullchain.pem"
chmod 600 "\${DEST}/privkey.pem"
docker compose -f "${APP_DIR}/docker-compose.prod.yml" \
    exec -T nginx nginx -s reload
echo "[\$(date -u)] Certs renewed and nginx reloaded" >> /var/log/certbot-deploy.log
HOOK
    chmod +x "${DEPLOY_HOOK}"
    ok "Auto-renewal hook installed → ${DEPLOY_HOOK}"
else
    ok "Auto-renewal hook already exists"
fi

# =============================================================================
# STEP 9 — Build and start Docker stack
# =============================================================================
step "9/9  Docker stack (may take 5–15 min on first run)"
cd "${APP_DIR}"

info "Building images..."
docker compose -f docker-compose.prod.yml build

info "Starting services..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

ok "Docker stack is up"

# =============================================================================
# STEP 10 — UFW firewall
# =============================================================================
step "10/9  Firewall"
ufw --force reset       >/dev/null
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw allow 22/tcp   comment 'SSH'   >/dev/null
ufw allow 80/tcp   comment 'HTTP'  >/dev/null
ufw allow 443/tcp  comment 'HTTPS' >/dev/null
ufw --force enable  >/dev/null
ok "UFW enabled: 22/tcp, 80/tcp, 443/tcp"

# =============================================================================
# Done
# =============================================================================
echo ""
echo -e "${G}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${G}║                                                          ║${NC}"
echo -e "${G}║   ✔  Nobatic is running!                                 ║${NC}"
echo -e "${G}║   →  https://${DOMAIN}                         ║${NC}"
echo -e "${G}║                                                          ║${NC}"
echo -e "${G}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${Y}  Secrets file   : ${SECRETS_FILE}  (chmod 600)${NC}"
echo -e "${Y}  App directory  : ${APP_DIR}${NC}"
echo -e "${Y}  Stack status   : docker compose -f ${APP_DIR}/docker-compose.prod.yml ps${NC}"
echo -e "${Y}  Health check   : curl -s https://${DOMAIN}/health/${NC}"
echo ""
