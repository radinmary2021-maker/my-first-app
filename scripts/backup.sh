#!/bin/sh
# ══════════════════════════════════════════════════════
#  NobatYar — PostgreSQL Backup Script
#  نگهداری ۷ نسخه آخر بکاپ
# ══════════════════════════════════════════════════════
set -e

BACKUP_DIR="${BACKUP_DIR:-/backups}"
KEEP_DAYS="${KEEP_DAYS:-7}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/nobatYar_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting backup..."

PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
    -h "${POSTGRES_HOST}" \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    --no-password \
    --format=plain \
    | gzip > "${BACKUP_FILE}"

SIZE=$(du -sh "${BACKUP_FILE}" | cut -f1)
echo "[$(date)] Backup created: ${BACKUP_FILE} (${SIZE})"

# ── Keep only the newest KEEP_DAYS backups ────────────────────────────────────
# ls -t lists newest first; tail skips the first KEEP_DAYS entries; xargs -r
# skips the rm when nothing is piped in (no backups to remove yet).
ls -t "${BACKUP_DIR}"/nobatYar_*.sql.gz 2>/dev/null \
    | tail -n "+$((KEEP_DAYS + 1))" \
    | xargs -r rm -f \
    && echo "[$(date)] Pruned backups older than position ${KEEP_DAYS}." \
    || true

echo "[$(date)] Backup complete. Current backups:"
ls -lh "${BACKUP_DIR}"/nobatYar_*.sql.gz 2>/dev/null || echo "  (none)"
