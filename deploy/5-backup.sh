#!/usr/bin/env bash
# =============================================================================
# AdPilot Database Backup — Run INSIDE the LXC
# =============================================================================
# pg_dump with optional R2 upload and retention policy.
#
# Usage:
#   bash 5-backup.sh                    # local backup only
#   bash 5-backup.sh --upload           # backup + upload to R2
#   bash 5-backup.sh --upload --cleanup # backup + upload + enforce retention
#   bash 5-backup.sh --install          # install daily cron at 2am
# =============================================================================

set -euo pipefail

APP_DIR="/opt/adpilot"
BACKUP_DIR="/opt/adpilot/backups"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="adpilot_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

UPLOAD=false
CLEANUP=false

KEEP_DAILY=7
KEEP_WEEKLY=4
KEEP_MONTHLY=3

# ─── Parse Args ───────────────────────────────────────────────────────────

for arg in "$@"; do
    case "$arg" in
        --upload)   UPLOAD=true ;;
        --cleanup)  CLEANUP=true ;;
        --install)
            SCRIPT_PATH="$(readlink -f "${BASH_SOURCE[0]}")"
            LOG_PATH="/var/log/adpilot-backup.log"
            CRON_LINE="0 2 * * * ${SCRIPT_PATH} --upload --cleanup >> ${LOG_PATH} 2>&1"
            (crontab -l 2>/dev/null | grep -v "adpilot.*backup\|${SCRIPT_PATH}"; echo "$CRON_LINE") | crontab -
            echo "Backup cron installed: daily at 2am"
            echo "  Script: ${SCRIPT_PATH}"
            echo "  Log:    ${LOG_PATH}"
            exit 0
            ;;
    esac
done

# ─── Create Backup ────────────────────────────────────────────────────────

mkdir -p "$BACKUP_DIR"

# Source .env for database credentials
cd "$APP_DIR"
source <(grep -E '^DB_PASSWORD=' .env)

echo "[$(date)] Creating backup..."

docker compose -f docker-compose.prod.yml exec -T db \
    pg_dump -U adpilot -d adpilot --no-owner --no-acl | gzip > "$BACKUP_PATH"

SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
echo "[$(date)] Backup created: ${BACKUP_FILE} (${SIZE})"

# ─── Upload to R2 ─────────────────────────────────────────────────────────

if [[ "$UPLOAD" == true ]]; then
    # Source R2 credentials from .env
    source <(grep -E '^R2_BUCKET=|^R2_ENDPOINT=|^AWS_ACCESS_KEY_ID=|^AWS_SECRET_ACCESS_KEY=' .env 2>/dev/null || true)

    R2_BUCKET="${R2_BUCKET:-adpilot-backups}"
    R2_ENDPOINT="${R2_ENDPOINT:-}"

    if [[ -z "$R2_ENDPOINT" ]] || [[ -z "${AWS_ACCESS_KEY_ID:-}" ]]; then
        echo "[$(date)] WARNING: R2 credentials not configured. Skipping upload."
        echo "  Set R2_BUCKET, R2_ENDPOINT, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY in .env"
    else
        if ! command -v aws &>/dev/null; then
            echo "[$(date)] Installing AWS CLI for R2 upload..."
            apt-get install -y awscli 2>/dev/null || pip3 install awscli 2>/dev/null || true
        fi

        if command -v aws &>/dev/null; then
            echo "[$(date)] Uploading to R2..."
            aws s3 cp "$BACKUP_PATH" "s3://${R2_BUCKET}/backups/${BACKUP_FILE}" \
                --endpoint-url "$R2_ENDPOINT" 2>/dev/null
            echo "[$(date)] Uploaded to R2: s3://${R2_BUCKET}/backups/${BACKUP_FILE}"
        else
            echo "[$(date)] WARNING: AWS CLI not available. Skipping upload."
        fi
    fi
fi

# ─── Retention Cleanup ────────────────────────────────────────────────────

if [[ "$CLEANUP" == true ]]; then
    echo "[$(date)] Enforcing local retention policy..."

    # Keep the most recent KEEP_DAILY backups
    TOTAL_KEEP=$((KEEP_DAILY + KEEP_WEEKLY + KEEP_MONTHLY))
    ls -t "${BACKUP_DIR}"/adpilot_*.sql.gz 2>/dev/null | tail -n +$((TOTAL_KEEP + 1)) | while read -r old; do
        echo "[$(date)] Removing old backup: $(basename "$old")"
        rm -f "$old"
    done
fi

echo "[$(date)] Backup complete."
