# AdPilot

Automated marketing agency SaaS platform. Manage campaigns across Facebook, Instagram, TikTok, LinkedIn, Twitter/X, YouTube, Google Ads, Pinterest, and Snapchat from one dashboard.

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-printforge-yellow?style=flat&logo=buy-me-a-coffee)](https://buymeacoffee.com/printforge)

> Here's one free month of Starlink service! Starlink high-speed internet is great for streaming.

## Tech Stack

- **Frontend:** Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API routes, BullMQ workers
- **Database:** PostgreSQL 16, Prisma ORM v6
- **Queue:** Redis 7, BullMQ
- **Auth:** NextAuth.js v5 (Google OAuth + Magic Link)
- **Billing:** Stripe (Free / Pro $49/mo / Agency $149/mo)
- **Storage:** Cloudflare R2 (S3-compatible)
- **Email:** Resend
- **Analytics:** Umami (self-hosted) + PostHog (feature flags)
- **Deployment:** Docker Compose on Proxmox via Cloudflare Tunnel
- **CI/CD:** GitHub Actions
- **Monorepo:** Turborepo + pnpm

## Architecture

```
Internet -> Cloudflare Edge (CDN, SSL, DDoS) -> Cloudflare Tunnel
  -> Proxmox VM -> Docker Compose
    -> web (Next.js 15, port 3000)
    -> worker (BullMQ, 8 queues)
    -> postgres (PostgreSQL 16)
    -> redis (Redis 7)
```

### Monorepo Structure

```
adpilot/
├── apps/web/           # Next.js frontend + API routes
├── apps/worker/        # BullMQ queue consumer
├── packages/db/        # Prisma schema (15 models)
├── packages/shared/    # Types, validators, encryption, plan limits
├── packages/platform-sdk/  # 9 OAuth adapters + token management
└── packages/ui/        # Shared UI components
```

## Quick Start

```bash
# Prerequisites: Node.js 20+, pnpm 9+, Docker

# Clone
git clone https://github.com/HallyAus/aimarketing.git
cd aimarketing

# Install dependencies
pnpm install

# Start infrastructure
docker compose up -d

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migration
cd packages/db && npx prisma migrate dev --name init

# Seed demo data
npx prisma db seed

# Start dev servers
cd ../.. && pnpm dev
```

Visit http://localhost:3000

## Environment Variables

See `.env.example` for the complete list. Key variables:

| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| REDIS_URL | Redis connection string |
| NEXTAUTH_SECRET | JWT signing secret (openssl rand -base64 32) |
| MASTER_ENCRYPTION_KEY | Token encryption key (openssl rand -hex 32) |
| FACEBOOK_APP_ID | Meta app credentials |
| TIKTOK_CLIENT_KEY | TikTok app credentials |
| STRIPE_SECRET_KEY | Stripe billing |
| NEXT_PUBLIC_POSTHOG_KEY | PostHog feature flags |

## Deployment

### Production (Proxmox + Cloudflare Tunnel)

```bash
# On Proxmox VM
docker compose -f docker-compose.prod.yml --profile tunnel up -d
```

### CI/CD

Push to `main` triggers GitHub Actions:
1. Install + test + build
2. Push Docker images to GHCR
3. SSH deploy to Proxmox VM

## Platform Connections

| Platform | OAuth | Publish | Analytics |
|----------|-------|---------|-----------|
| Facebook | Yes | Yes | Yes |
| Instagram | Yes | Yes | Yes |
| TikTok | Yes | Yes | Yes |
| LinkedIn | Yes | Yes | Yes |
| Twitter/X | Yes (PKCE) | Yes | Yes |
| YouTube | Yes | Yes | Yes |
| Google Ads | Yes | Yes | Yes |
| Pinterest | Yes | Yes | Yes |
| Snapchat | Yes | Yes | Yes |

## Plans

| Feature | Free | Pro ($49/mo) | Agency ($149/mo) |
|---------|------|-------------|------------------|
| Platform connections | 2 | 5 | Unlimited |
| Posts per month | 10 | Unlimited | Unlimited |
| Team members | 1 | 5 | Unlimited |
| Approval workflow | No | Yes | Yes |
| AI insights | No | No | Yes |
| White-label | No | No | Yes |

## License

Private. All rights reserved.

---

[![Buy Me a Coffee](https://img.shields.io/badge/Support-Buy%20Me%20a%20Coffee-yellow?style=for-the-badge&logo=buy-me-a-coffee)](https://buymeacoffee.com/printforge)
