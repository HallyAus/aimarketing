#!/usr/bin/env bash
# =============================================================================
# AdPilot Auto-Deploy — Run INSIDE the LXC
# =============================================================================
# Checks GitHub for new commits every 5 minutes, pulls and rebuilds if changed.
#
# Usage:
#   bash 4-auto-deploy.sh              # run once
#   bash 4-auto-deploy.sh --install    # install cron job
# =============================================================================

set -euo pipefail

APP_DIR="/opt/adpilot"
BRANCH="${BRANCH:-master}"
LOCK_FILE="/tmp/adpilot-deploy.lock"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"

# ─── Install Mode ─────────────────────────────────────────────────────────

if [[ "${1:-}" == "--install" ]]; then
    SCRIPT_PATH="$(readlink -f "${BASH_SOURCE[0]}")"
    LOG_PATH="/var/log/adpilot-deploy.log"
    CRON_LINE="*/5 * * * * ${SCRIPT_PATH} >> ${LOG_PATH} 2>&1"

    (crontab -l 2>/dev/null | grep -v "adpilot.*auto-deploy\|${SCRIPT_PATH}"; echo "$CRON_LINE") | crontab -

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

# ─── Deploy ───────────────────────────────────────────────────────────────

echo "${LOG_PREFIX} Pulling latest..."
git pull origin "$BRANCH"

echo "${LOG_PREFIX} Running migrations..."
docker compose -f docker-compose.prod.yml run --rm web sh -c "npx prisma migrate deploy --schema=/app/packages/db/prisma/schema.prisma" 2>/dev/null || true

echo "${LOG_PREFIX} Rebuilding and restarting..."
docker compose -f docker-compose.prod.yml up -d --build web worker

echo "${LOG_PREFIX} Cleaning up old images..."
docker image prune -f --filter "until=72h" 2>/dev/null || true

# Health check
sleep 15
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
if [[ "$STATUS" == "200" ]]; then
    echo "${LOG_PREFIX} Deploy complete. App healthy."
else
    echo "${LOG_PREFIX} WARNING: App returned ${STATUS} after deploy. Check logs!"
fi
