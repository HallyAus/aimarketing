#!/usr/bin/env bash
# =============================================================================
# ReachPilot Auto-Deploy — Run INSIDE the LXC
# =============================================================================
# Checks GitHub for new commits every 5 minutes, pulls and rebuilds if changed.
#
# Usage:
#   bash 4-auto-deploy.sh              # run once
#   bash 4-auto-deploy.sh --install    # install cron job
# =============================================================================

set -euo pipefail

APP_DIR="/opt/reachpilot"
BRANCH="${BRANCH:-main}"
LOCK_FILE="/tmp/reachpilot-deploy.lock"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"

# ─── Install Mode ─────────────────────────────────────────────────────────

if [[ "${1:-}" == "--install" ]]; then
    SCRIPT_PATH="$(readlink -f "${BASH_SOURCE[0]}")"
    LOG_PATH="/var/log/reachpilot-deploy.log"
    CRON_LINE="*/5 * * * * ${SCRIPT_PATH} >> ${LOG_PATH} 2>&1"

    (crontab -l 2>/dev/null | grep -v "reachpilot.*auto-deploy\|${SCRIPT_PATH}"; echo "$CRON_LINE") | crontab -

    echo "Auto-deploy cron installed"
    echo "  Script: ${SCRIPT_PATH}"
    echo "  Log:    ${LOG_PATH}"
    echo "  Cron:   ${CRON_LINE}"
    exit 0
fi

# ─── Lock ─────────────────────────────────────────────────────────────────

if [[ -f "$LOCK_FILE" ]]; then
    LOCK_PID=$(cat "$LOCK_FILE")
    if kill -0 "$LOCK_PID" 2>/dev/null; then
        echo "${LOG_PREFIX} Deploy already running (PID: ${LOCK_PID}), skipping"
        exit 0
    fi
    rm -f "$LOCK_FILE"
fi
echo $$ > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

# ─── Check for Changes ────────────────────────────────────────────────────

cd "$APP_DIR"

git fetch origin "$BRANCH" --quiet

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/${BRANCH}")

if [[ "$LOCAL" == "$REMOTE" ]]; then
    echo "${LOG_PREFIX} No changes detected"
    exit 0
fi

echo "${LOG_PREFIX} Changes detected: ${LOCAL:0:8} -> ${REMOTE:0:8}"

# ─── Tag current images for rollback ─────────────────────────────────────

echo "${LOG_PREFIX} Tagging current images as 'previous' for rollback..."
docker tag "$(docker compose -f docker-compose.prod.yml images web -q 2>/dev/null)" reachpilot-web:previous 2>/dev/null || true
docker tag "$(docker compose -f docker-compose.prod.yml images worker -q 2>/dev/null)" reachpilot-worker:previous 2>/dev/null || true

# ─── Deploy ───────────────────────────────────────────────────────────────

echo "${LOG_PREFIX} Pulling latest..."
git pull origin "$BRANCH"

echo "${LOG_PREFIX} Running migrations..."
if ! docker compose -f docker-compose.prod.yml run --rm web sh -c "npx prisma migrate deploy --schema=/app/packages/db/prisma/schema.prisma" 2>&1; then
    echo "${LOG_PREFIX} ERROR: Migration failed. Halting deploy."
    exit 1
fi

echo "${LOG_PREFIX} Rebuilding and restarting..."
docker compose -f docker-compose.prod.yml up -d --build web worker

echo "${LOG_PREFIX} Cleaning up old images..."
docker image prune -f --filter "until=72h" 2>/dev/null || true

# ─── Health check with rollback ──────────────────────────────────────────

sleep 15
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health/db 2>/dev/null || echo "000")
if [[ "$STATUS" == "200" ]]; then
    echo "${LOG_PREFIX} Deploy complete. App healthy."
else
    echo "${LOG_PREFIX} WARNING: App returned ${STATUS} after deploy. Rolling back..."
    if docker image inspect reachpilot-web:previous &>/dev/null; then
        docker compose -f docker-compose.prod.yml stop web worker
        docker tag reachpilot-web:previous "$(docker compose -f docker-compose.prod.yml images web --format '{{.Repository}}:{{.Tag}}' 2>/dev/null | head -1)" 2>/dev/null || true
        docker tag reachpilot-worker:previous "$(docker compose -f docker-compose.prod.yml images worker --format '{{.Repository}}:{{.Tag}}' 2>/dev/null | head -1)" 2>/dev/null || true
        docker compose -f docker-compose.prod.yml up -d web worker
        echo "${LOG_PREFIX} Rolled back to previous images. Check logs!"
    else
        echo "${LOG_PREFIX} No previous images available for rollback. Check logs!"
    fi
    exit 1
fi
