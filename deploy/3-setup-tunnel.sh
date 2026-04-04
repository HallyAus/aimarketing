#!/usr/bin/env bash
# =============================================================================
# ReachPilot Cloudflare Tunnel Setup — Run INSIDE the LXC
# =============================================================================
# Starts a Cloudflare Tunnel to expose ReachPilot securely.
#
# Prerequisites:
#   1. Go to https://one.dash.cloudflare.com
#   2. Networks > Tunnels > Create a tunnel
#   3. Name: "reachpilot"
#   4. Select Docker, copy the token (starts with eyJ...)
#   5. Add public hostname:
#        Domain: yourdomain.com → http://reachpilot-web:3000
#        www.yourdomain.com    → http://reachpilot-web:3000
#
# Usage:
#   CF_TUNNEL_TOKEN="eyJ..." bash 3-setup-tunnel.sh
#   bash 3-setup-tunnel.sh --domain reachpilot.yourdomain.com
# =============================================================================

set -euo pipefail

INSTALL_DIR="/opt/reachpilot"
DOMAIN="${DOMAIN:-}"

# Colours
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[+]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[x]${NC} $1" >&2; }

while [[ $# -gt 0 ]]; do
    case $1 in
        --domain) DOMAIN="$2"; shift 2 ;;
        *) shift ;;
    esac
done

cd "$INSTALL_DIR"

# Check for tunnel token
if [[ -z "${CF_TUNNEL_TOKEN:-}" ]]; then
    # Try reading from .env
    CF_TUNNEL_TOKEN=$(grep -oP 'CF_TUNNEL_TOKEN=\K.+' .env 2>/dev/null || true)
fi

if [[ -z "${CF_TUNNEL_TOKEN:-}" ]]; then
    err "CF_TUNNEL_TOKEN not set."
    echo ""
    echo "To get a tunnel token:"
    echo "  1. Go to https://one.dash.cloudflare.com"
    echo "  2. Networks > Tunnels > Create a tunnel"
    echo "  3. Name: reachpilot"
    echo "  4. Select Docker, copy the token"
    echo "  5. Add public hostname:"
    echo "       Domain: yourdomain.com"
    echo "       Service: http://reachpilot-web:3000"
    echo ""
    echo "Then run:"
    echo "  CF_TUNNEL_TOKEN=\"eyJ...\" bash deploy/3-setup-tunnel.sh"
    exit 1
fi

# Update .env with tunnel token
if grep -q "^CF_TUNNEL_TOKEN=" .env; then
    sed -i "s|^CF_TUNNEL_TOKEN=.*|CF_TUNNEL_TOKEN=${CF_TUNNEL_TOKEN}|" .env
else
    echo "CF_TUNNEL_TOKEN=${CF_TUNNEL_TOKEN}" >> .env
fi

# Update domain in .env if provided
if [[ -n "$DOMAIN" ]]; then
    APP_URL="https://${DOMAIN}"
    sed -i "s|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=${APP_URL}|" .env
    sed -i "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=${APP_URL}|" .env
    log "Domain set to ${DOMAIN}"
fi

# Start tunnel via Docker Compose profile
log "Starting Cloudflare Tunnel..."
docker compose -f docker-compose.prod.yml --profile tunnel up -d cloudflared

# Verify tunnel
sleep 5
if docker logs reachpilot-tunnel 2>&1 | grep -qi "registered"; then
    log "Tunnel connected and registered!"
else
    warn "Tunnel started but may not be registered yet. Check: docker logs reachpilot-tunnel"
fi

# Rebuild web with new URL if domain was set
if [[ -n "$DOMAIN" ]]; then
    log "Rebuilding web with new domain..."
    docker compose -f docker-compose.prod.yml up -d --build web
    sleep 10
fi

echo ""
echo "============================================"
echo -e "${GREEN}  Cloudflare Tunnel Active${NC}"
echo "============================================"
if [[ -n "$DOMAIN" ]]; then
    echo "  URL: https://${DOMAIN}"
    echo ""
    echo "  Verify: curl -s https://${DOMAIN}/api/health"
fi
echo ""
echo "  Tunnel logs: docker logs -f reachpilot-tunnel"
echo "============================================"
