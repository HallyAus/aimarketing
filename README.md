# ReachPilot

AI-powered marketing automation SaaS platform. Manage campaigns across Facebook, Instagram, TikTok, LinkedIn, Twitter/X, YouTube, Google Ads, Pinterest, and Snapchat from one dashboard. Built in Australia, used by teams worldwide.

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-printforge-yellow?style=flat&logo=buy-me-a-coffee)](https://buymeacoffee.com/printforge)

> Here's one free month of Starlink service! Starlink high-speed internet is great for streaming.

## Tech Stack

- **Frontend:** Next.js 15 App Router, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes, BullMQ workers
- **Database:** PostgreSQL 16, Prisma ORM v6
- **Queue:** Redis 7, BullMQ
- **Auth:** NextAuth.js v5 (Google OAuth, Microsoft, email/password, magic link)
- **AI:** Claude API (content generation, brand voice training)
- **Billing:** Stripe (Free / Pro $49/mo / Agency $299/mo)
- **Storage:** Cloudflare R2 (S3-compatible)
- **Email:** Resend
- **Analytics:** Umami (self-hosted) + PostHog (feature flags)
- **Deployment:** Vercel (web) + Docker Compose on Proxmox (worker/infra)
- **CI/CD:** GitHub Actions
- **Monorepo:** Turborepo + pnpm

## Architecture

```
Internet -> Cloudflare Edge (CDN, SSL, DDoS)
  -> Vercel (Next.js web app)
  -> Proxmox VM -> Docker Compose
    -> worker (BullMQ, 8 queues)
    -> postgres (PostgreSQL 16)
    -> redis (Redis 7)
```

### Monorepo Structure

```
reachpilot/
├── apps/web/               # Next.js frontend + API routes
├── apps/worker/            # BullMQ queue consumer
├── packages/db/            # Prisma schema (27 models)
├── packages/shared/        # Types, validators, encryption, plan limits
├── packages/platform-sdk/  # 9 OAuth adapters + token management
└── packages/ui/            # Shared UI components
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
| NEXTAUTH_SECRET | JWT signing secret (`openssl rand -base64 32`) |
| MASTER_ENCRYPTION_KEY | Token encryption key (`openssl rand -hex 32`) |
| FACEBOOK_APP_ID | Meta app credentials |
| TIKTOK_CLIENT_KEY | TikTok app credentials |
| ANTHROPIC_API_KEY | Claude API for AI features |
| STRIPE_SECRET_KEY | Stripe billing |
| RESEND_API_KEY | Transactional email |

## Deployment

### Vercel (Web App)

Push to `main` triggers automatic deployment to Vercel.

### Proxmox (Worker + Infrastructure)

```bash
docker compose -f docker-compose.prod.yml up -d
```

### CI/CD

Push to `main` triggers GitHub Actions:
1. Install + test + build
2. Deploy to Vercel (web)
3. Push Docker images to GHCR (worker)

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

| Feature | Free | Pro ($49/mo) | Agency ($299/mo) |
|---------|------|-------------|------------------|
| Platform connections | 3 | 9 | Unlimited |
| Posts per month | 30 | Unlimited | Unlimited |
| Team members | 1 | 5 | Unlimited |
| AI Content Studio | Basic | Full | Full |
| Smart Scheduling | Yes | Yes | Yes |
| Timezone auto-detect | Yes | Yes | Yes |
| Approval workflow | No | Yes | Yes |
| White-label reports | No | No | Yes |
| API access | No | No | Yes |

## Key Features

- **Smart Timezone Scheduling** — Auto-detects user timezone on signup. Team members each see times in their local timezone. AI recommends optimal posting times across audience timezones.
- **AI Content Studio** — Generate on-brand posts, ad copy, and captions powered by Claude AI.
- **9-Platform Publishing** — Single dashboard for all major social platforms.
- **Team Collaboration** — Role-based access, approval workflows, and audit trails.
- **Campaign Analytics** — Real-time engagement, reach, and conversion tracking.

## Database Setup

```bash
# Generate Prisma client
cd packages/db && npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed demo data
npx prisma db seed
```

## Testing

```bash
# Run all tests
pnpm test

# Run specific package tests
pnpm test --filter=@reachpilot/shared
pnpm test --filter=@reachpilot/web
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Private. All rights reserved.

---

☕ [Buy Me a Coffee](https://buymeacoffee.com/printforge)

🛰️ Here's one free month of Starlink service! Starlink high-speed internet is great for streaming.
