# ReachPilot Deployment Guide

## Full deployment: LXC creation to running app in 5 commands

### Step 1: Create LXC (on Proxmox host)

```bash
# Copy the deploy folder to your Proxmox host, then:
bash deploy/1-create-lxc.sh
```

This creates LXC **900** with:
- Debian 12, 4 cores, 8GB RAM, 40GB disk
- Docker installed, UFW enabled (SSH only)
- DHCP networking with nesting enabled (Docker-in-LXC)

### Step 2: Set up the app (inside LXC)

```bash
# SSH into the LXC
ssh root@<LXC-IP>

# Clone and set up
git clone https://github.com/HallyAus/aimarketing.git /opt/reachpilot
cd /opt/reachpilot
bash deploy/2-setup-app.sh --domain reachpilot.yourdomain.com
```

This will:
- Generate DB password, auth secret, encryption key
- Write `.env` with all config (edit afterwards for API keys)
- Build Docker images
- Run Prisma migrations
- Start web + worker + postgres + redis

### Step 3: Connect Cloudflare Tunnel (inside LXC)

```bash
# Get your tunnel token from https://one.dash.cloudflare.com
# Networks > Tunnels > Create > Docker > Copy token
# Add hostname: yourdomain.com → http://reachpilot-web:3000

CF_TUNNEL_TOKEN="eyJ..." bash deploy/3-setup-tunnel.sh --domain reachpilot.yourdomain.com
```

### Step 4: Set up auto-deploy (inside LXC)

```bash
bash deploy/4-auto-deploy.sh --install
```

Checks GitHub every 5 minutes. If new commits: pull, migrate, rebuild, restart.

### Step 5: Set up backups (inside LXC)

```bash
bash deploy/5-backup.sh --install
```

Daily pg_dump at 2am with R2 upload (if configured).

---

## Edit API Keys

After setup, edit `/opt/reachpilot/.env` with your actual credentials:

```bash
nano /opt/reachpilot/.env
```

Required for production:
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth
- `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` — Meta platforms
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — billing
- `RESEND_API_KEY` — transactional emails
- `CF_TUNNEL_TOKEN` — Cloudflare Tunnel

After editing, rebuild:
```bash
cd /opt/reachpilot
docker compose -f docker-compose.prod.yml up -d --build web worker
```

---

## Common Commands

```bash
# Status
docker compose -f docker-compose.prod.yml ps

# Logs
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml logs -f web    # web only
docker compose -f docker-compose.prod.yml logs -f worker # worker only

# Restart
docker compose -f docker-compose.prod.yml restart web worker

# Rebuild after code changes
docker compose -f docker-compose.prod.yml up -d --build web worker

# Run migrations
docker compose -f docker-compose.prod.yml run --rm web sh -c "npx prisma migrate deploy --schema=/app/packages/db/prisma/schema.prisma"

# Database shell
docker compose -f docker-compose.prod.yml exec db psql -U reachpilot -d reachpilot

# Manual backup
bash deploy/5-backup.sh --upload

# Health check
curl http://localhost:3000/api/health
```

## Architecture

```
Internet → Cloudflare Edge (CDN, DDoS, SSL)
  → Cloudflare Tunnel (encrypted, no open ports)
    → LXC 900 (Debian 12, Docker)
      → reachpilot-web     (Next.js 15, port 3000)
      → reachpilot-worker  (BullMQ, 8 queues)
      → reachpilot-db      (PostgreSQL 16)
      → reachpilot-redis   (Redis 7)
      → reachpilot-tunnel  (cloudflared)
```
