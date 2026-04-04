# ReachPilot — Foundation Design Spec

**Date:** 2026-03-29
**Status:** Approved
**Scope:** Full system architecture for ReachPilot, an automated marketing agency SaaS platform

---

## 1. Overview

ReachPilot is a production-ready, multi-tenant marketing agency SaaS platform that enables agencies to connect client social media accounts and manage campaigns across 9 platform connections from a single dashboard.

**Canonical platform list (9 connections):**
- **Meta** (2 connections): Facebook (via Meta Business), Instagram (via Meta Business, requires linked FB Page)
- **TikTok** (1): TikTok for Business
- **LinkedIn** (1): LinkedIn Marketing Developer Platform
- **Twitter/X** (1): Twitter API v2
- **Google** (2 connections): YouTube, Google Ads (separate OAuth scopes and connections)
- **Pinterest** (1): Pinterest API v5
- **Snapchat** (1): Snap Marketing API

Note: Facebook and Instagram share a Meta OAuth flow but are stored as separate PlatformConnection records (different platformUserId). Google Ads and YouTube are fully independent connections.

**Key capabilities:**
- Multi-platform OAuth connection management with encrypted token storage
- Campaign creation, scheduling, and automated publishing
- Cross-platform analytics normalization and reporting
- Multi-tenant RBAC with team invitations
- Stripe billing with plan-gated feature enforcement
- Approval workflows for content review
- Feature flags via PostHog Cloud

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js API routes (all server-side logic) |
| Worker | Standalone Node.js BullMQ consumer process |
| Database | PostgreSQL 16 (self-hosted Docker on Proxmox) |
| Cache/Queue | Redis 7 (BullMQ backing store) |
| ORM | Prisma v6 |
| Auth | NextAuth.js v5 (Google OAuth + Magic Link via Resend) |
| File Storage | Cloudflare R2 (S3-compatible) |
| Email | Resend (transactional) |
| Logging | Axiom (structured JSON logs + OpenTelemetry traces) |
| Analytics | Umami (self-hosted, page/product analytics) |
| Feature Flags | PostHog Cloud (flags + experiments only) |
| Billing | Stripe (Checkout, Webhooks, Customer Portal) |
| Deployment | Docker Compose on Proxmox VM via Cloudflare Tunnel |
| CI/CD | GitHub Actions with self-hosted runner |
| Monorepo | Turborepo |

**Decision: All TypeScript.** No FastAPI/Python. The worker is a Node.js process consuming BullMQ queues. Webhook ingestion is handled by Next.js API routes. This eliminates cross-language operational complexity with no loss of capability for this workload (API calls + queue processing).

---

## 3. Monorepo Structure

```
reachpilot/
├── apps/
│   ├── web/                    # Next.js 15 App Router
│   └── worker/                 # Standalone BullMQ worker process
├── packages/
│   ├── db/                     # Prisma schema, client, migrations, seed
│   ├── platform-sdk/           # Unified wrapper for all 7 platform APIs
│   ├── shared/                 # Types, constants, encryption, validators
│   └── ui/                     # Shared shadcn/ui components
├── docker-compose.yml          # Dev: postgres + redis
├── docker-compose.prod.yml     # Prod: all services + cloudflared
├── turbo.json
├── package.json                # Root workspace config (pnpm)
├── .env.example
└── .github/workflows/
    └── deploy.yml
```

**Docker services (production):**

| Service | Image | Port | Dev Limits | Prod Limits | Notes |
|---------|-------|------|-----------|-------------|-------|
| web | Multi-stage Next.js | 3000 | 512MB | 1GB | App + API routes |
| worker | Same image, different entrypoint | None | 512MB | 512MB | BullMQ consumer |
| postgres | postgres:16-alpine | 5432 | 512MB | 1.5GB | Named volume |
| redis | redis:7-alpine | 6379 | 256MB | 256MB | allkeys-lru eviction |
| cloudflared | cloudflare/cloudflared:latest | None | 128MB | 128MB | Tunnel profile |

---

## 4. Database Schema

Multi-tenant core — every table scoped to `organizationId`.

### Models

**Organization** — tenant root
- id, name, slug (unique), plan (FREE/PRO/AGENCY), stripeCustomerId, stripeSubscriptionId, billingEmail, billingCycleAnchor, createdAt, updatedAt, deletedAt (nullable, for soft-delete)

**User** — auth identity
- id, email (unique), name, avatar, emailVerified, createdAt

**Membership** — org-user join with role
- userId, orgId, role (OWNER/ADMIN/EDITOR/VIEWER), invitedBy, acceptedAt, createdAt
- Unique: [userId, orgId]

**Invitation** — pending invite
- id, orgId, email, role, token (unique), expiresAt, invitedBy, acceptedAt

**PlatformConnection** — OAuth credentials per platform per org
- orgId, platform (FACEBOOK/INSTAGRAM/TIKTOK/LINKEDIN/TWITTER_X/GOOGLE_ADS/YOUTUBE/PINTEREST/SNAPCHAT), accessToken (encrypted), refreshToken (encrypted), tokenExpiresAt, platformUserId, platformAccountName, scopes[], status (ACTIVE/EXPIRED/REVOKED), connectedBy, metadata (JSON)
- Unique: [orgId, platform, platformUserId]

**Campaign** — campaign container
- orgId, name, objective (AWARENESS/TRAFFIC/ENGAGEMENT/CONVERSIONS/LEADS), status (DRAFT/SCHEDULED/ACTIVE/PAUSED/COMPLETED/FAILED), budget, currency, startDate, endDate, targetPlatforms[], audienceConfig (JSON), createdBy, updatedAt, version (Int, for optimistic concurrency)
- `audienceConfig` example shape: `{ ageMin: 18, ageMax: 65, locations: ["US", "AU"], interests: ["marketing"], gender: "all" }` — validated per-platform at publish time

**Post** — content piece within a campaign
- campaignId, orgId, platform, content, mediaUrls[], scheduledAt, publishedAt, platformPostId, status (DRAFT/PENDING_APPROVAL/APPROVED/REJECTED/SCHEDULED/PUBLISHING/PUBLISHED/FAILED/DELETED), approvedBy, rejectionReason, engagementSnapshot (JSON), errorMessage, updatedAt, version (Int)
- `engagementSnapshot` is a denormalized cache of the latest AnalyticsSnapshot metrics for quick display (updated by analytics:sync job). AnalyticsSnapshot stores the full time-series history.

**Approval state machine:**
```
DRAFT → PENDING_APPROVAL (Editor submits for review)
PENDING_APPROVAL → APPROVED (Admin/Owner approves) → SCHEDULED
PENDING_APPROVAL → REJECTED (Admin/Owner rejects with reason) → DRAFT (Editor revises)
```
Notifications sent via `email:send` queue at each transition.

**Creative** — media asset
- orgId, name, type (IMAGE/VIDEO/CAROUSEL/STORY/REEL), r2Key, r2Url, thumbnailUrl, dimensions, fileSizeBytes, mimeType, tags[]
- Upload limits: Free 50MB/file, Pro 200MB/file, Agency 500MB/file
- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif, video/mp4, video/webm, video/quicktime
- Rejected uploads return 400 with specific reason (size, format, dimensions)

**AnalyticsSnapshot** — periodic metrics
- postId, platform, snapshotAt, impressions, reach, clicks, likes, comments, shares, saves, videoViews, spend, conversions, ctr, cpc, cpm, rawPayload (JSON)
- Rollup strategy: raw snapshots retained for 90 days, then aggregated to daily summaries. Daily summaries retained for 2 years. Table partitioned by snapshotAt (monthly partitions).

**AuditLog** — immutable mutation log
- orgId, userId, action, entityType, entityId, before (JSON), after (JSON), ipAddress, userAgent, createdAt

**WebhookEvent** — inbound webhook log
- platform, eventType, platformEventId (unique per platform for idempotency), payload (JSON), signature, verified, processedAt, processingError
- Unique constraint on [platform, platformEventId] prevents duplicate processing
- If platform doesn't provide an event ID, use SHA-256 hash of (platform + eventType + signature) as deduplication key

### Cascade/deletion rules
- Organization deletion: soft-delete via `deletedAt` timestamp on Organization only. Cascade hard-delete all child records (Memberships, PlatformConnections with token revocation, Campaigns, Posts, Creatives with R2 cleanup, AnalyticsSnapshots). AuditLog entries preserved (orgId retained for compliance). Requires Owner role + confirmation. Background job handles R2 cleanup and platform token revocation.
- User deletion (GDPR): remove User record, anonymize AuditLog entries (userId → null), delete all Memberships. Org survives if other members exist; orphaned orgs are flagged for admin cleanup.

### Optimistic concurrency
Campaign and Post include a `version` field. All update operations check `WHERE id = ? AND version = ?`. On conflict, return 409 with current version for client retry.

### Key indexes
- orgId on every org-scoped table
- [platform, status] on PlatformConnection
- [scheduledAt, status] on Post
- [snapshotAt] on AnalyticsSnapshot
- [orgId, createdAt] on AuditLog

### Encryption
All tokens encrypted at rest using AES-256-GCM with MASTER_ENCRYPTION_KEY. Random 12-byte IV per encryption operation, IV prepended to ciphertext. Unique IVs ensure cross-row decryption is not possible even with the same key.

Phase 1 uses a single master key for simplicity. Per-org key derivation (HKDF with orgId salt) can be added in Production Hardening if independent key rotation per org is needed.

---

## 5. Authentication & Authorization

### NextAuth.js v5
- Providers: Google OAuth + Magic Link (Resend transport)
- Session: JWT in httpOnly, secure, sameSite=strict cookies
- JWT payload: userId, email, name, currentOrgId, currentRole

### Auth flow
1. Sign in via Google or magic link
2. New user → create User, redirect to org creation
3. Existing user, 1 org → auto-select, set in JWT
4. Existing user, multiple orgs → org picker, selection stored in JWT
5. Org switch via dashboard header dropdown

### RBAC middleware
- `withAuth()` — enforces auth on `/dashboard/*` via Next.js middleware
- `withOrg()` — ensures org context in session
- `withRole(minimumRole)` — checks membership. Hierarchy: VIEWER < EDITOR < ADMIN < OWNER

### Permission matrix

| Action | Viewer | Editor | Admin | Owner |
|--------|--------|--------|-------|-------|
| View dashboards/analytics | Yes | Yes | Yes | Yes |
| Create/edit campaigns | No | Yes | Yes | Yes |
| Publish/schedule posts | No | Yes | Yes | Yes |
| Approve posts | No | No | Yes | Yes |
| Manage platform connections | No | No | Yes | Yes |
| Invite/remove members | No | No | Yes | Yes |
| Billing/plan management | No | No | No | Yes |
| Delete organization | No | No | No | Yes |

### Invitation system
1. Admin/Owner invites by email + role from `/dashboard/settings/team`
2. Invitation record with unique token, email sent via Resend
3. Recipient clicks link → `/invite/[token]` → sign in/up → Membership created
4. Token expires after 7 days, resendable

---

## 6. Platform Connection System

### Unified OAuth2 flow

```
User clicks "Connect" → /api/platforms/[platform]/authorize
  → Generate state token (CSRF) + PKCE code_verifier (where needed)
  → Store in encrypted httpOnly cookie
  → Redirect to platform OAuth consent screen

Platform redirects → /api/platforms/[platform]/callback
  → Validate state token
  → Exchange code for tokens
  → Encrypt tokens (AES-256-GCM, master key + unique IV)
  → Create/update PlatformConnection
  → Redirect to /dashboard/settings/connections
```

### Platform-specific details

| Platform | Token Expiry | Refresh Method | Special Notes |
|----------|-------------|----------------|---------------|
| Facebook/Instagram | 60 days (long-lived) | Exchange endpoint | IG requires FB Page link. Subscribe to page webhooks. |
| TikTok | 24 hours | Refresh token (365 days) | Two-step publish. 600 publishes/day limit. |
| LinkedIn | 60 days | Refresh token (365 days) | Two-step media upload (register + upload). |
| Twitter/X | 2 hours | Refresh token (6 months) | OAuth2 + PKCE. Chunked media upload. Per-endpoint rate limits. |
| Google/YouTube | 1 hour | Refresh token (no expiry) | Ads needs developer token + manager account. YouTube quota units. |
| Pinterest | 1 hour | Refresh token (365 days) | API v5. Pin creation with media. |
| Snapchat | 30 min | Refresh token (no explicit expiry) | Requires approved Snap Marketing API app. |

### Token lifecycle (two-layer strategy)

**Layer 1: Lazy refresh on use (primary mechanism for short-lived tokens)**
- Before every platform API call, the SDK checks `tokenExpiresAt`
- If expired or expiring within 5 minutes → refresh inline before the call
- If refresh fails → return 401, trigger re-auth notification
- This handles Snapchat (30min), Twitter/X (2h), Google/YouTube (1h), Pinterest (1h)

**Layer 2: Proactive background refresh (BullMQ jobs)**
- `token:health-check` — every 6 hours, validate each active token against platform API
- `token:refresh` — every 12 hours, proactively refresh tokens expiring within 7 days (catches Facebook 60-day, LinkedIn 60-day, TikTok 24h)
- On refresh failure → mark EXPIRED, send email + in-app banner via Resend

Both layers log all token lifecycle events to AuditLog.

### Connection management UI (`/dashboard/settings/connections`)
- Grid of platform cards: logo, name, status badge, connected account name
- Connect → OAuth redirect
- Refresh → silent token refresh, fallback to re-auth
- Disconnect → confirm, revoke at platform, delete record, audit logged

---

## 7. BullMQ Job Infrastructure

### Worker
Single Node.js process (`apps/worker`) consuming from Redis-backed queues. Shares `packages/db` and `packages/platform-sdk` with the web app.

### Queues

| Queue | Purpose | Concurrency | Schedule |
|-------|---------|-------------|----------|
| campaign:publish | Publish a post to a platform | 5 | On-demand |
| campaign:schedule | Check for posts due for publishing | 1 | Every minute |
| analytics:sync | Pull metrics for active posts | 3 | Every 4h (active), daily (completed) |
| token:refresh | Proactive refresh of expiring tokens | 2 | Every 12h |
| token:health-check | Validate active tokens against platform API | 2 | Every 6h |
| media:process | Resize/transcode media per platform | 2 | On-demand |
| email:send | Transactional emails via Resend | 3 | On-demand |
| webhook:process | Process inbound platform webhooks | 3 | On-demand |

### Retry & failure
- Retriable (429, 500, 503): exponential backoff, max 3 attempts (30s → 2min → 10min)
- Permanent (400, 401, 403): fail immediately
- 401 → trigger token refresh, re-enqueue original job on success
- Dead letter queue (`dlq:*`) for exhausted retries

### Rate limiting (two distinct layers)

**Layer 1: Inbound request rate limiting (API routes)**
- `rate-limiter-flexible` middleware on Next.js API routes
- Auth endpoints: 5 requests/min per IP
- Platform connect: 10 requests/min per user
- General API: 100 requests/min per user
- Returns 429 with `Retry-After` header

**Layer 2: Outbound platform API rate limiting (worker/SDK)**
- Redis sliding window per platform per connection
- Check before each platform API call in the SDK; if at limit, delay the BullMQ job with calculated wait time
- Platform limits stored in config (e.g., TikTok 600 publishes/day, Twitter per-endpoint windows)
- These two layers are independent — Layer 1 protects ReachPilot, Layer 2 protects platform API quotas

### Circuit breaker (deferred to Phase 7 — Production Hardening)
Design documented here for reference, built during hardening phase:
- Per-platform: closed → open → half-open
- Opens after 5 consecutive failures in 5 minutes
- Open: jobs delayed 5 minutes (not failed)
- Half-open: 1 test request, close on success
- Cross-platform isolation — one platform's failure doesn't affect others

### Webhook ingestion
- `POST /api/webhooks/[platform]` — Next.js API routes
- Verify signature per platform
- Log to WebhookEvent table
- Enqueue to `webhook:process` for async handling
- Return 200 immediately

---

## 8. Stripe Billing & Plan Gating

### Plans

| Feature | Free | Pro ($49/mo) | Agency ($149/mo) |
|---------|------|-------------|------------------|
| Organizations (owned by user) | 1 | 1 | Unlimited (one per client) |
| Platform connections | 2 | 5 | Unlimited |
| Posts per month | 10 | Unlimited | Unlimited |
| Team members | 1 | 5 | Unlimited |
| Analytics retention | 30 days | 1 year | Unlimited |
| Approval workflow | No | Yes | Yes |
| AI insights | No | No | Yes |
| White-label | No | No | Yes |
| API access | No | No | Yes |

### Stripe integration
- Org creation → create Stripe Customer, store stripeCustomerId
- Upgrade → Stripe Checkout Session → hosted payment → webhook confirms
- Downgrade → scheduled at end of billing period
- Cancellation → access continues until period end, reverts to Free

### Webhook handling (`POST /api/webhooks/stripe`)
- `checkout.session.completed` → activate subscription, update plan
- `invoice.payment_succeeded` → extend billing period
- `invoice.payment_failed` → warning email, 3-day grace, then downgrade
- `customer.subscription.deleted` → revert to Free
- Signature verified via `stripe.webhooks.constructEvent()`

### Enforcement
- `PlanLimitService` in `packages/shared` — single source of truth
- Checks at action time in API routes (not just UI hiding):
  - Connect platform → check connection count
  - Create post → check monthly count
  - Invite member → check member count
- Returns `{ allowed, reason, upgradeRequired }` — UI shows upgrade prompt

### Usage tracking
- Monthly post count resets on billing cycle date
- `PlanLimitService.getUsage(orgId)` for current usage
- Dashboard shows usage bar with upgrade CTA

---

## 9. Feature Flags & Analytics

### PostHog Cloud (feature flags + experiments only)
- Server-side: PostHog Node SDK in API routes and middleware
- Client-side: `posthog-js` for UI toggles
- Flag naming: `feature-{name}`, `plan-{name}`, `experiment-{name}`
- Env vars: `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- Complements PlanLimitService: hard limits enforced by PlanLimitService, feature visibility controlled by PostHog flags (gradual rollout, kill switches)

### Umami (self-hosted, product analytics)
- Deployed on separate Proxmox VM per deployment skill
- Tracks page views, events, referrals
- Tracking script injected via Next.js Script component
- Env vars: `NEXT_PUBLIC_UMAMI_URL`, `NEXT_PUBLIC_UMAMI_WEBSITE_ID`

---

## 10. Observability, Security & Error Handling

### Observability
- Structured JSON logging via Axiom
- Correlation ID (`x-request-id`) in Next.js middleware, propagated to worker via job metadata
- Health endpoints: `/api/health`, `/api/health/db`, `/api/health/redis`
- Platform API latency tracked per-call
- Alerts via Resend on: token expiry, publish failure after retries, API quota >80%

### Security
- Token encryption: AES-256-GCM with master key + unique IV per operation (HKDF per-org keys deferred to hardening phase)
- CSRF: Next.js built-in + Zod validation on all mutations
- Rate limiting: `rate-limiter-flexible` — auth (5/min), connect (10/min), API (100/min)
- CSP headers via `next.config.js`
- All input validated with Zod — no raw `req.body` access
- Webhook signature verification per platform
- CORS restricted to `NEXT_PUBLIC_APP_URL`
- Cookies: httpOnly, secure, sameSite=strict

### Error handling
- Global React error boundary with branded fallback
- `withErrorHandler()` wrapper on API routes — catches, classifies, logs, returns `{ error, code, statusCode }`
- Platform API errors: retriable vs permanent classification
- Graceful degradation: platform failures isolated

---

## 11. Testing Strategy

### Unit tests (Vitest)
- Encryption module roundtrip, wrong key, IV uniqueness
- PlanLimitService enforcement per plan
- Zod validators for every API route
- Platform SDK token refresh, error classification, rate limit math
- Job retry logic, backoff timing

### Integration tests (Vitest + MSW)
- Platform OAuth flows with mocked endpoints
- Platform publishing with mocked APIs
- Webhook signature verification per platform
- Stripe webhook event handling
- BullMQ job execution with mocked platform APIs

### E2E tests (Playwright)
- Sign up → create org → dashboard
- Connect platform (mocked OAuth)
- Create campaign → add post → schedule
- Approval workflow (editor → admin)
- Billing upgrade → feature unlock
- Disconnect platform → cleanup

### Infrastructure
- Docker Compose test profile with isolated Postgres + Redis
- MSW for all external API mocking
- GitHub Actions runs full suite on PR
- Coverage target: 80%+ on packages/shared and packages/platform-sdk

---

## 12. Production Deployment

Follows the self-hosted deployment skill (Proxmox + Cloudflare Tunnel + Docker Compose):

1. Proxmox VM: 4 cores, **8GB RAM**, 40GB disk (allows PostgreSQL 1GB+, headroom for growth)
2. Docker Compose prod: web + worker + postgres + redis + cloudflared
3. Cloudflare Tunnel for zero-exposed-ports public access
4. UFW: deny incoming, allow SSH only
5. Auto-deploy via cron (5-min GitHub poll) or GitHub Actions SSH deploy
6. Daily database backups to Cloudflare R2 (7 daily, 4 weekly, 3 monthly retention)
7. Umami analytics on separate VM
8. Maintenance worker on Cloudflare for 502/503 branded fallback
9. Scaling trigger: upgrade VM when P95 memory exceeds 80%

**Updated Docker memory limits (production):**

| Service | Memory Limit | Notes |
|---------|-------------|-------|
| web | 1GB | SSR + API routes under concurrent load |
| worker | 512MB | Queue processing. If media:process causes CPU contention, split to separate container |
| postgres | 1.5GB | Analytics query headroom |
| redis | 256MB | allkeys-lru eviction |
| cloudflared | 128MB | Tunnel only |

**Database migration strategy:**
- Migrations run as a **pre-deploy step** via GitHub Actions: `npx prisma migrate deploy` runs in CI before the new container images are started
- For cron-based auto-deploy: migration runs as part of the deploy script before `docker compose up`
- Zero-downtime: all migrations must be backwards-compatible (additive only — new columns nullable, no column renames/drops in the same release as code changes)

**Environments:**
- `main` branch → production (Proxmox VM, real domain)
- `develop` branch → staging (separate Proxmox VM or LXC, staging subdomain via Cloudflare Tunnel). Initially can be skipped — deploy staging when team size warrants it.
- `feature/*` → local dev only (Docker Compose dev profile)

---

## 13. Data Privacy & GDPR

- **Data deletion flow:** User requests account deletion → background job cascades: revoke platform tokens, delete all org data (campaigns, posts, creatives, analytics, connections), remove R2 assets, anonymize audit logs, delete user record. Confirmation email sent.
- **Data export:** `GET /api/account/export` generates a ZIP of all user and org data (JSON format) per GDPR Article 20. Background job, download link emailed when ready.
- **Consent tracking:** Cookie consent banner on first visit. PostHog and Umami only loaded after consent.
- **Platform data:** Only aggregate metrics stored (impressions, clicks, etc.). No end-user PII from platform audiences is ever stored.
- **Data retention:** Analytics snapshots rolled up per Section 4. Audit logs retained for 2 years. WebhookEvents purged after 90 days.

---

## 14. Execution Order

Build in this sequence (each phase is a separate plan → implement cycle):

1. **Foundation** — Turborepo monorepo, Docker infra, Prisma schema, NextAuth, org/membership, RBAC, Stripe billing skeleton
2. **Platform Connections** — OAuth flows for all 9 platform connections, token vault, refresh jobs, connection UI
3. **Campaign Engine** — BullMQ queues, campaign CRUD, post scheduling, publish pipeline via platform SDK
4. **Media Processing** — Sharp + FFmpeg pipeline, platform-specific variants, R2 upload
5. **Analytics & Reporting** — Sync engine, normalized snapshots, dashboard charts, CSV/PDF export
6. **User Features** — Content calendar, approval workflow, templates, onboarding wizard
7. **Production Hardening** — Security audit, observability, circuit breakers, PostHog flags, comprehensive tests, CI/CD, deploy

---

## 15. Environment Variables

All required environment variables:

```env
# App
NEXT_PUBLIC_APP_URL=https://reachpilot.yourdomain.com
NODE_ENV=production

# Database
DATABASE_URL=postgresql://reachpilot:PASSWORD@localhost:5432/reachpilot

# Redis
REDIS_URL=redis://localhost:6379

# Auth
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=https://reachpilot.yourdomain.com
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Encryption (for platform tokens)
MASTER_ENCRYPTION_KEY=generate-with-openssl-rand-hex-32

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
R2_BUCKET_NAME=reachpilot-media
R2_PUBLIC_URL=

# Resend (Email)
RESEND_API_KEY=

# Axiom (Logging)
AXIOM_DATASET=reachpilot
AXIOM_TOKEN=

# Stripe (Billing)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# PostHog (Feature Flags)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Umami (Analytics)
NEXT_PUBLIC_UMAMI_URL=https://analytics.yourdomain.com
NEXT_PUBLIC_UMAMI_WEBSITE_ID=

# Claude API (AI features — Agency plan only)
ANTHROPIC_API_KEY=
```

---

## 16. GitHub Repository

- Remote: `HallyAus/aimarketing` (private)
- Branch strategy: main (production), develop (staging), feature/* branches
- PR template with checklist (tests, security, platform compliance)
- Dependabot enabled
- GitHub Actions secrets for production credentials
