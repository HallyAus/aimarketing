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

# Check pg_dump exit code (via pipe) — verify backup is non-empty
if [[ ! -s "$BACKUP_PATH" ]]; then
    echo "[$(date)] ERROR: Backup file is empty. pg_dump likely failed."
    rm -f "$BACKUP_PATH"
    exit 1
fi

SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
echo "[$(date)] Backup created: ${BACKUP_FILE} (${SIZE})"

# ─── Upload to R2 ─────────────────────────────────────────────────────────

if [[ "$UPLOAD" == true ]]; then
    # Source R2 credentials from .env (matching .env.example variable names)
    source <(grep -E '^R2_BUCKET_NAME=|^R2_ACCOUNT_ID=|^R2_ACCESS_KEY_ID=|^R2_SECRET_ACCESS_KEY=' .env 2>/dev/null || true)

    R2_BUCKET="${R2_BUCKET_NAME:-adpilot-backups}"
    R2_ENDPOINT="https://${R2_ACCOUNT_ID:-}.r2.cloudflarestorage.com"

    if [[ -z "${R2_ACCOUNT_ID:-}" ]] || [[ -z "${R2_ACCESS_KEY_ID:-}" ]]; then
        echo "[$(date)] WARNING: R2 credentials not configured. Skipping upload."
        echo "  Set R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in .env"
    else
        if ! command -v aws &>/dev/null; then
            echo "[$(date)] Installing AWS CLI for R2 upload..."
            apt-get install -y awscli 2>/dev/null || pip3 install awscli 2>/dev/null || true
        fi

        if command -v aws &>/dev/null; then
            echo "[$(date)] Uploading to R2..."
            AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
            AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
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

    # Build a list of backups to keep: daily (last N days), weekly (Sundays), monthly (1st of month)
    declare -A KEEP_FILES

    # Keep last KEEP_DAILY daily backups (most recent per day)
    declare -A SEEN_DAYS
    while IFS= read -r f; do
        # Extract date from filename: adpilot_YYYYMMDD_HHMMSS.sql.gz
        DAY=$(basename "$f" | sed 's/adpilot_\([0-9]\{8\}\)_.*/\1/')
        if [[ -z "${SEEN_DAYS[$DAY]:-}" ]] && [[ ${#SEEN_DAYS[@]} -lt $KEEP_DAILY ]]; then
            KEEP_FILES["$f"]=1
            SEEN_DAYS["$DAY"]=1
        fi
    done < <(ls -t "${BACKUP_DIR}"/adpilot_*.sql.gz 2>/dev/null)

    # Keep last KEEP_WEEKLY weekly backups (most recent per ISO week)
    declare -A SEEN_WEEKS
    WEEK_COUNT=0
    while IFS= read -r f; do
        DAY=$(basename "$f" | sed 's/adpilot_\([0-9]\{8\}\)_.*/\1/')
        WEEK=$(date -d "${DAY:0:4}-${DAY:4:2}-${DAY:6:2}" '+%G-W%V' 2>/dev/null || echo "$DAY")
        if [[ -z "${SEEN_WEEKS[$WEEK]:-}" ]] && [[ $WEEK_COUNT -lt $KEEP_WEEKLY ]]; then
            KEEP_FILES["$f"]=1
            SEEN_WEEKS["$WEEK"]=1
            WEEK_COUNT=$((WEEK_COUNT + 1))
        fi
    done < <(ls -t "${BACKUP_DIR}"/adpilot_*.sql.gz 2>/dev/null)

    # Keep last KEEP_MONTHLY monthly backups (most recent per month)
    declare -A SEEN_MONTHS
    MONTH_COUNT=0
    while IFS= read -r f; do
        MONTH=$(basename "$f" | sed 's/adpilot_\([0-9]\{6\}\).*/\1/')
        if [[ -z "${SEEN_MONTHS[$MONTH]:-}" ]] && [[ $MONTH_COUNT -lt $KEEP_MONTHLY ]]; then
            KEEP_FILES["$f"]=1
            SEEN_MONTHS["$MONTH"]=1
            MONTH_COUNT=$((MONTH_COUNT + 1))
        fi
    done < <(ls -t "${BACKUP_DIR}"/adpilot_*.sql.gz 2>/dev/null)

    # Remove files not in keep list
    while IFS= read -r f; do
        if [[ -z "${KEEP_FILES[$f]:-}" ]]; then
            echo "[$(date)] Removing old backup: $(basename "$f")"
            rm -f "$f"
        fi
    done < <(ls -t "${BACKUP_DIR}"/adpilot_*.sql.gz 2>/dev/null)
fi

echo "[$(date)] Backup complete."
