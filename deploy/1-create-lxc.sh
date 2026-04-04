#!/usr/bin/env bash
# =============================================================================
# ReachPilot LXC Creation — Run ON Proxmox Host
# =============================================================================
# Creates a Debian 12 LXC container with Docker support for ReachPilot.
#
# Usage:
#   bash 1-create-lxc.sh
#   bash 1-create-lxc.sh --storage local-lvm --bridge vmbr0
# =============================================================================

set -euo pipefail

# ─── Configuration ────────────────────────────────────────────────────────

CTID="${CTID:-900}"
HOSTNAME="${HOSTNAME:-reachpilot}"
MEMORY="${MEMORY:-8192}"        # 8GB RAM per spec
SWAP="${SWAP:-1024}"            # 1GB swap
CORES="${CORES:-4}"             # 4 cores per spec
DISK="${DISK:-40}"              # 40GB disk per spec
STORAGE="${STORAGE:-local-lvm}"
BRIDGE="${BRIDGE:-vmbr0}"
TEMPLATE_STORAGE="${TEMPLATE_STORAGE:-local}"

# Auto-detect latest Debian 12 template
TEMPLATE=""
TEMPLATE_PATH=""

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
        --ctid)     CTID="$2"; shift 2 ;;
        --storage)  STORAGE="$2"; shift 2 ;;
        --bridge)   BRIDGE="$2"; shift 2 ;;
        --memory)   MEMORY="$2"; shift 2 ;;
        --cores)    CORES="$2"; shift 2 ;;
        --disk)     DISK="$2"; shift 2 ;;
        *) err "Unknown flag: $1"; exit 1 ;;
    esac
done

# ─── Pre-checks ───────────────────────────────────────────────────────────

if ! command -v pct &>/dev/null; then
    err "pct not found. Run this script ON your Proxmox host."
    exit 1
fi

if pct status "$CTID" &>/dev/null; then
    err "Container $CTID already exists. Pick a different CTID or remove it first."
    exit 1
fi

# ─── Download Template ────────────────────────────────────────────────────

log "Finding latest Debian 12 template..."
pveam update >/dev/null 2>&1 || true
TEMPLATE=$(pveam available --section system | grep 'debian-12-standard' | tail -1 | sed 's/^[[:space:]]*system[[:space:]]*//' | tr -d '[:space:]' | head -1)

if [[ -z "$TEMPLATE" ]]; then
    err "Could not find Debian 12 template. Run: pveam update"
    exit 1
fi

info "Using template: [${TEMPLATE}]"
TEMPLATE_PATH="${TEMPLATE_STORAGE}:vztmpl/${TEMPLATE}"

if pveam list "$TEMPLATE_STORAGE" | grep -q "$TEMPLATE"; then
    info "Template already downloaded"
else
    log "Downloading ${TEMPLATE}..."
    pveam download "$TEMPLATE_STORAGE" "$TEMPLATE"
fi

# ─── Create LXC ───────────────────────────────────────────────────────────

log "Creating LXC container ${CTID} (${HOSTNAME})..."
log "  Specs: ${CORES} cores, ${MEMORY}MB RAM, ${DISK}GB disk"

pct create "$CTID" "$TEMPLATE_PATH" \
    --hostname "$HOSTNAME" \
    --memory "$MEMORY" \
    --swap "$SWAP" \
    --cores "$CORES" \
    --rootfs "${STORAGE}:${DISK}" \
    --net0 "name=eth0,bridge=${BRIDGE},ip=dhcp,firewall=1" \
    --features "nesting=1,keyctl=1" \
    --onboot 1 \
    --unprivileged 1 \
    --ostype debian \
    --start 0

log "LXC $CTID created successfully"

# ─── Start Container ──────────────────────────────────────────────────────

log "Starting container..."
pct start "$CTID"
sleep 5

# Wait for network
log "Waiting for network..."
for i in {1..30}; do
    IP=$(pct exec "$CTID" -- hostname -I 2>/dev/null | awk '{print $1}')
    if [[ -n "$IP" ]]; then
        break
    fi
    sleep 2
done

if [[ -z "${IP:-}" ]]; then
    warn "Could not detect IP. Container is running but may need manual network config."
else
    log "Container IP: $IP"
fi

# ─── Install Docker + Dependencies ────────────────────────────────────────

log "Installing packages inside LXC..."

pct exec "$CTID" -- bash -c '
set -euo pipefail

# Update system
apt-get update && apt-get upgrade -y

# Install essentials
apt-get install -y \
    curl \
    wget \
    git \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    htop \
    unzip \
    jq

# Install Docker via official script
curl -fsSL https://get.docker.com | sh

# Enable Docker
systemctl enable docker
systemctl start docker

# Install Docker Compose plugin (comes with Docker now, but ensure it)
docker compose version

# Configure UFW
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw --force enable

echo "============================================"
echo "Docker and dependencies installed successfully"
echo "============================================"
'

log "Docker installed and UFW configured"

# ─── Summary ──────────────────────────────────────────────────────────────

echo ""
echo "============================================"
echo -e "${GREEN}  ReachPilot LXC Created Successfully${NC}"
echo "============================================"
echo "  CTID:     $CTID"
echo "  Hostname: $HOSTNAME"
echo "  IP:       ${IP:-unknown (check manually)}"
echo "  Specs:    ${CORES} cores, ${MEMORY}MB RAM, ${DISK}GB disk"
echo "  Docker:   installed"
echo "  UFW:      enabled (SSH only)"
echo ""
echo "Next steps:"
echo "  1. Copy your SSH key:  ssh-copy-id root@${IP:-<IP>}"
echo "  2. SSH in:             ssh root@${IP:-<IP>}"
echo "  3. Run setup script:   bash /opt/reachpilot/deploy/2-setup-app.sh"
echo "============================================"
