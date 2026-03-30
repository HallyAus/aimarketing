#!/usr/bin/env bash
# =============================================================================
# AdPilot App Setup — Run INSIDE the LXC
# =============================================================================
# Clones the repo, generates secrets, configures .env, builds and starts
# the entire stack (web + worker + postgres + redis).
#
# Usage:
#   bash 2-setup-app.sh
#   bash 2-setup-app.sh --domain adpilot.yourdomain.com
#   GITHUB_TOKEN=ghp_xxx bash 2-setup-app.sh   # for private repos
# =============================================================================

set -euo pipefail

# ─── Configuration ────────────────────────────────────────────────────────

REPO_URL="${REPO_URL:-https://github.com/HallyAus/aimarketing.git}"
PROJECT_NAME="adpilot"
INSTALL_DIR="/opt/${PROJECT_NAME}"
BRANCH="${BRANCH:-main}"
DOMAIN="${DOMAIN:-}"

# ─── Colours ──────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${GREEN}[+]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[x]${NC} $1" >&2; }
info() { echo -e "${BLUE}[i]${NC} $1"; }

# ─── Parse Flags ──────────────────────────────────────────────────────────

while [[ $# -gt 0 ]]; do
    case $1 in
        --domain)   DOMAIN="$2"; shift 2 ;;
        --branch)   BRANCH="$2"; shift 2 ;;
        --repo)     REPO_URL="$2"; shift 2 ;;
        *) err "Unknown flag: $1"; exit 1 ;;
    esac
done

# ─── Clone Repository ─────────────────────────────────────────────────────

if [[ -d "$INSTALL_DIR" ]]; then
    warn "Directory ${INSTALL_DIR} already exists. Pulling latest..."
    cd "$INSTALL_DIR"
    git fetch origin "$BRANCH"
    git reset --hard "origin/${BRANCH}"
else
    log "Cloning repository..."
    # If GITHUB_TOKEN is set, use it for private repos
    if [[ -n "${GITHUB_TOKEN:-}" ]]; then
        CLONE_URL="${REPO_URL/https:\/\//https://${GITHUB_TOKEN}@}"
    else
        CLONE_URL="$REPO_URL"
    fi
    git clone --branch "$BRANCH" "$CLONE_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

log "Repository cloned to ${INSTALL_DIR}"

# ─── Generate Secrets ─────────────────────────────────────────────────────

log "Generating secrets..."

DB_PASSWORD=$(openssl rand -hex 16)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
MASTER_ENCRYPTION_KEY=$(openssl rand -hex 32)

# ─── Create .env File ─────────────────────────────────────────────────────

ENV_FILE="${INSTALL_DIR}/.env"

if [[ -f "$ENV_FILE" ]]; then
    warn ".env already exists. Backing up to .env.backup"
    cp "$ENV_FILE" "${ENV_FILE}.backup"
fi

APP_URL="http://localhost:3000"
if [[ -n "$DOMAIN" ]]; then
    APP_URL="https://${DOMAIN}"
fi

log "Writing .env file..."

cat > "$ENV_FILE" << EOF
# ═══════════════════════════════════════════════════════════════════════
# AdPilot Production Environment
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# ═══════════════════════════════════════════════════════════════════════

# App
NEXT_PUBLIC_APP_URL=${APP_URL}
NODE_ENV=production

# Database (internal Docker network)
DATABASE_URL=postgresql://adpilot:${DB_PASSWORD}@db:5432/adpilot
DB_PASSWORD=${DB_PASSWORD}

# Redis (internal Docker network)
REDIS_URL=redis://redis:6379

# Auth
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=${APP_URL}
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Encryption (for platform tokens)
MASTER_ENCRYPTION_KEY=${MASTER_ENCRYPTION_KEY}

# Facebook/Meta
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_WEBHOOK_VERIFY_TOKEN=

# TikTok
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=

# LinkedIn
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

# Twitter/X
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=

# Google (YouTube + Ads)
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_DEVELOPER_TOKEN=

# Pinterest
PINTEREST_APP_ID=
PINTEREST_APP_SECRET=

# Snapchat
SNAPCHAT_CLIENT_ID=
SNAPCHAT_CLIENT_SECRET=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=adpilot-media
R2_PUBLIC_URL=

# Resend (Email)
RESEND_API_KEY=
EMAIL_FROM=AdPilot <noreply@adpilot.com>

# Axiom (Logging)
AXIOM_DATASET=adpilot
AXIOM_TOKEN=

# Stripe (Billing)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRO_PRICE_ID=
STRIPE_AGENCY_PRICE_ID=

# PostHog (Feature Flags)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Umami (Analytics)
NEXT_PUBLIC_UMAMI_URL=
NEXT_PUBLIC_UMAMI_WEBSITE_ID=

# Claude API (AI features — Agency plan only)
ANTHROPIC_API_KEY=

# Cloudflare Tunnel (set to enable tunnel profile)
CF_TUNNEL_TOKEN=
EOF

log ".env file created with generated secrets"
warn "IMPORTANT: Edit .env to add your API keys (Google, Facebook, Stripe, etc.)"

# ─── Build and Start ──────────────────────────────────────────────────────

log "Building and starting AdPilot..."

# Start infrastructure first
docker compose -f docker-compose.prod.yml up -d db redis
log "Waiting for database to be healthy..."
sleep 10

# Check if DB is ready
for i in {1..30}; do
    if docker compose -f docker-compose.prod.yml exec -T db pg_isready -U adpilot &>/dev/null; then
        break
    fi
    sleep 2
done

# Build app images
log "Building Docker images (this may take a few minutes)..."
docker compose -f docker-compose.prod.yml build web worker

# Run database migration
log "Running database migrations..."
docker compose -f docker-compose.prod.yml run --rm web sh -c "cd /app && npx prisma migrate deploy --schema=/app/packages/db/prisma/schema.prisma" || {
    echo "ERROR: migrate deploy failed. Fix migrations before deploying." && exit 1
}

# Start all services
log "Starting all services..."
docker compose -f docker-compose.prod.yml up -d web worker

# ─── Health Check ─────────────────────────────────────────────────────────

log "Waiting for app to start..."
sleep 15

for i in {1..20}; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
    if [[ "$STATUS" == "200" ]]; then
        log "App is healthy!"
        break
    fi
    sleep 3
done

if [[ "$STATUS" != "200" ]]; then
    warn "App may not be fully healthy yet. Check: docker compose -f docker-compose.prod.yml logs -f web"
fi

# ─── Summary ──────────────────────────────────────────────────────────────

echo ""
echo "============================================"
echo -e "${GREEN}  AdPilot Deployed Successfully${NC}"
echo "============================================"
echo "  Location:    ${INSTALL_DIR}"
echo "  URL:         ${APP_URL}"
echo "  Status:      $(docker compose -f docker-compose.prod.yml ps --format 'table {{.Name}}\t{{.Status}}' 2>/dev/null || echo 'check manually')"
echo ""
echo "  Services:"
docker compose -f docker-compose.prod.yml ps --format '    {{.Name}}: {{.Status}}' 2>/dev/null || true
echo ""
echo "Next steps:"
echo "  1. Edit .env with your API keys: nano ${ENV_FILE}"
echo "  2. Set up Cloudflare Tunnel:     bash deploy/3-setup-tunnel.sh --domain yourdomain.com"
echo "  3. Set up auto-deploy:           bash deploy/4-auto-deploy.sh --install"
echo "  4. Set up backups:               bash deploy/5-backup.sh --install"
echo "============================================"
