#!/bin/sh
# ══════════════════════════════════════════════════════
#  NobatYar — PostgreSQL Restore Script
#  استفاده: ./restore.sh <backup_file.sql.gz>
# ══════════════════════════════════════════════════════
set -e

BACKUP_FILE="$1"

if [ -z "${BACKUP_FILE}" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -lh /backups/nobatYar_*.sql.gz 2>/dev/null || echo "  No backups found"
    exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Error: File not found: ${BACKUP_FILE}"
    exit 1
fi

echo "══════════════════════════════════════════"
echo "  RESTORE FROM: ${BACKUP_FILE}"
echo "  TARGET DB   : ${POSTGRES_DB}"
echo "  TARGET HOST : ${POSTGRES_HOST}"
echo "══════════════════════════════════════════"
echo ""
echo "WARNING: This will REPLACE all data in ${POSTGRES_DB}!"
printf "Type 'yes' to continue: "
read CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo "[$(date)] Dropping existing connections..."
PGPASSWORD="${POSTGRES_PASSWORD}" psql \
    -h "${POSTGRES_HOST}" \
    -U "${POSTGRES_USER}" \
    -d postgres \
    -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${POSTGRES_DB}' AND pid <> pg_backend_pid();" \
    > /dev/null 2>&1 || true

echo "[$(date)] Restoring from backup..."
gunzip -c "${BACKUP_FILE}" | PGPASSWORD="${POSTGRES_PASSWORD}" psql \
    -h "${POSTGRES_HOST}" \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    --no-password

echo "[$(date)] Restore complete successfully!"
