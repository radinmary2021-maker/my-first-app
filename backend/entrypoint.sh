#!/bin/sh
# Runs once before the main process starts.
# Docker Compose healthchecks on db + redis guarantee both are ready before
# this container starts, so we do not need an explicit wait loop.
set -e

echo "[entrypoint] Running database migrations..."
python manage.py migrate --noinput

echo "[entrypoint] Starting application..."
exec "$@"
