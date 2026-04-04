# Claude Code Prompt: Automated Marketing Agency SaaS Platform

## Project Codename: **ReachPilot** (or user's preferred name)

---

## MASTER PROMPT — Paste this into Claude Code

```
You are building ReachPilot — a production-ready, multi-tenant automated marketing agency SaaS platform. This is a serious commercial product, not a prototype. Every decision must be production-grade: secure, scalable, observable, and legally compliant with platform TOS.

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes + dedicated FastAPI microservices for heavy async work (campaign orchestration, analytics aggregation, webhook processing)
- **Database**: PostgreSQL 16 (via Docker), Prisma ORM v6
- **Queue/Jobs**: BullMQ + Redis for campaign scheduling, post publishing, analytics sync
- **Auth**: NextAuth.js v5 with Google/email providers, RBAC (Owner, Admin, Editor, Viewer)
- **File Storage**: Cloudflare R2 (S3-compatible) for media assets, creatives, reports
- **Email**: Resend for transactional emails (campaign alerts, reports, invitations)
- **Logging/Observability**: Axiom for structured logs, OpenTelemetry traces
- **Deployment**: Docker Compose on VPS (production), with GHCR for container registry
- **CI/CD**: GitHub Actions with self-hosted runner
- **Reverse Proxy**: Cloudflare Tunnel + Caddy

### Monorepo Structure (Turborepo)
```
reachpilot/
├── apps/
│   ├── web/                    # Next.js 15 frontend + API routes
│   ├── orchestrator/           # FastAPI campaign orchestration service
│   └── webhook-ingress/        # FastAPI webhook receiver (platform callbacks)
├── packages/
│   ├── db/                     # Prisma schema, migrations, seed
│   ├── shared/                 # Shared types, utils, constants
│   ├── platform-sdk/           # Unified SDK wrapping all platform APIs
│   └── ui/                     # Shared UI components (shadcn/ui based)
├── docker-compose.yml
├── docker-compose.prod.yml
├── turbo.json
└── .github/workflows/
```

---

## PHASE 1: Foundation (Do this first)

### 1.1 Database Schema (Prisma)

Design the schema with multi-tenancy at the core. Every row belongs to an `organization`.

Core models:
- **Organization** — tenant (name, slug, plan, billing, createdAt)
- **User** — belongs to org via membership (email, name, avatar, role enum)
- **Membership** — join table (userId, orgId, role: OWNER|ADMIN|EDITOR|VIEWER)
- **PlatformConnection** — OAuth credentials per platform per org
  - Fields: orgId, platform (enum: FACEBOOK, INSTAGRAM, TIKTOK, LINKEDIN, TWITTER_X, GOOGLE_ADS, YOUTUBE, PINTEREST, SNAPCHAT), accessToken (encrypted), refreshToken (encrypted), tokenExpiresAt, platformUserId, platformAccountName, scopes[], status (ACTIVE|EXPIRED|REVOKED), connectedBy (userId), metadata (JSON)
  - Unique constraint: [orgId, platform, platformUserId]
- **Campaign** — marketing campaign container
  - Fields: orgId, name, objective (AWARENESS|TRAFFIC|ENGAGEMENT|CONVERSIONS|LEADS), status (DRAFT|SCHEDULED|ACTIVE|PAUSED|COMPLETED|FAILED), budget, currency, startDate, endDate, targetPlatforms[], audienceConfig (JSON), createdBy
- **Post** — individual content piece within a campaign
  - Fields: campaignId, orgId, platform, content (text), mediaUrls[], scheduledAt, publishedAt, platformPostId, status (DRAFT|SCHEDULED|PUBLISHING|PUBLISHED|FAILED|DELETED), engagementSnapshot (JSON), errorMessage
- **Creative** — media asset library
  - Fields: orgId, name, type (IMAGE|VIDEO|CAROUSEL|STORY|REEL), r2Key, r2Url, thumbnailUrl, dimensions, fileSizeBytes, mimeType, tags[], usedInPosts[]
- **AnalyticsSnapshot** — periodic metrics pull
  - Fields: postId, platform, snapshotAt, impressions, reach, clicks, likes, comments, shares, saves, videoViews, spend, conversions, ctr, cpc, cpm, rawPayload (JSON)
- **AuditLog** — every mutation logged
  - Fields: orgId, userId, action, entityType, entityId, before (JSON), after (JSON), ipAddress, userAgent, createdAt
- **WebhookEvent** — inbound webhook log
  - Fields: platform, eventType, payload (JSON), signature, verified (bool), processedAt, processingError

IMPORTANT: All tokens must be encrypted at rest using AES-256-GCM with a per-org encryption key derived from a master key in environment variables. Never store plaintext tokens.

### 1.2 Authentication & Authorization

Implement NextAuth.js v5 with:
- Google OAuth + Magic Link (email) sign-in
- Session strategy: JWT with httpOnly cookies
- Middleware that enforces auth on all /dashboard/* routes
- RBAC middleware: create a `withRole(requiredRole)` wrapper
- Organization context: after login, user selects org (or auto-select if only one)
- Invitation system: invite by email, accept flow, role assignment

### 1.3 Platform Connection System (OAuth2 Flows)

This is the most critical integration piece. Each platform connection is added BY THE USER (the agency's client or the agency operator) through an OAuth consent flow.

Build a unified `PlatformConnectionService` that handles:

#### Facebook / Instagram (Meta Business Suite)
- OAuth2 via Facebook Login
- Required scopes: `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`, `instagram_manage_insights`, `ads_management`, `business_management`
- Exchange code for long-lived token (60-day), store refresh mechanism
- Instagram publishing requires a Facebook Page linked to an Instagram Business account
- Webhook subscription: subscribe to page webhooks for real-time engagement updates
- API version: pin to latest stable (v21.0+), log deprecation warnings

#### TikTok
- OAuth2 via TikTok for Business / TikTok Login Kit
- Required scopes: `video.publish`, `video.list`, `user.info.basic`, `video.insights`
- Note: TikTok content publishing API has specific requirements — videos must be uploaded first, then published (two-step process via `POST /v2/post/publish/video/init/` and status polling)
- Rate limits are aggressive — implement exponential backoff
- Webhook: subscribe to `video.publish.complete` and `comment.create`

#### LinkedIn
- OAuth2 via LinkedIn Marketing Developer Platform
- Required scopes: `r_liteprofile`, `r_organization_social`, `w_organization_social`, `rw_organization_admin`, `r_organization_social_feed`
- Posts via UGC Post API or new Posts API (v2)
- Image/video uploads require a two-step register + upload flow

#### Twitter/X
- OAuth 2.0 with PKCE (User Context)
- Required scopes: `tweet.read`, `tweet.write`, `users.read`, `offline.access`
- Media upload via chunked upload endpoint before tweeting
- Rate limits: track per-endpoint, implement sliding window

#### Google Ads / YouTube
- OAuth2 via Google Identity Services
- YouTube: `youtube.upload`, `youtube.readonly` scopes
- Google Ads: requires a developer token + Manager Account structure
- Note: Google Ads API approval process can take weeks — build the integration but flag this to users

#### Pinterest
- OAuth2 via Pinterest API v5
- Required scopes: `boards:read`, `pins:read`, `pins:write`, `user_accounts:read`
- Pin creation with image/video upload

#### Snapchat
- OAuth2 via Snap Marketing API
- Required scopes: `snapchat-marketing-api`
- Requires approved Snap Marketing API application

#### Unified Connection Flow
Build a `/dashboard/settings/connections` page with:
1. Platform cards showing connection status (Connected/Expired/Not Connected)
2. "Connect" button triggers OAuth redirect with correct scopes
3. Callback route `/api/auth/callback/[platform]` handles code exchange
4. Token encryption + storage
5. "Refresh" button for expired tokens
6. "Disconnect" button (revoke + delete)
7. Health check: periodic token validation job (BullMQ cron every 6 hours)

Token refresh strategy:
- Background job checks `tokenExpiresAt` daily
- If expiring within 7 days: attempt silent refresh
- If refresh fails: mark as EXPIRED, notify user via email + in-app banner
- Log all token lifecycle events to AuditLog

---

## PHASE 2: Campaign Engine

### 2.1 Campaign Builder UI

Build a multi-step campaign creation wizard:
1. **Objective** — select campaign goal (maps to platform-specific objectives)
2. **Platforms** — select target platforms (only connected ones shown)
3. **Content** — rich text editor with media upload, platform-specific previews (character limits, aspect ratios), AI content suggestions (optional Claude API integration)
4. **Schedule** — date/time picker with timezone support, recurring post option
5. **Audience** — platform-specific targeting config (age, location, interests — stored as JSON, validated per-platform)
6. **Review** — summary with estimated reach, cost preview, platform compliance checks
7. **Launch** — schedule or publish immediately

### 2.2 Campaign Orchestrator (FastAPI Service)

The orchestrator is the brain. It:
- Consumes jobs from BullMQ queues
- Calls platform APIs via the unified SDK
- Handles the publish lifecycle: SCHEDULED → PUBLISHING → PUBLISHED/FAILED
- Implements retry logic with exponential backoff (max 3 retries)
- Tracks rate limits per platform per connection
- Emits events to the webhook-ingress service for status updates

Key queues:
- `campaign:publish` — publish a post to a platform
- `campaign:schedule` — schedule future posts (cron-triggered)
- `analytics:sync` — pull latest metrics for active posts
- `token:refresh` — refresh expiring platform tokens
- `media:process` — resize/transcode media for platform requirements

### 2.3 Media Processing Pipeline

Each platform has specific media requirements:
- Facebook: Images max 30MB, videos up to 10GB, aspect ratios vary
- Instagram: Square (1:1), Portrait (4:5), Story (9:16), Reels (9:16)
- TikTok: 9:16 vertical, 720p minimum, MP4/WebM
- LinkedIn: 1:1 or 1.91:1 for images, various for video
- Twitter: 5MB images, 512MB video, various aspect ratios

Build a media processing service using Sharp (images) and FFmpeg (video) that:
- Auto-generates platform-specific variants from a single upload
- Creates thumbnails for the asset library
- Validates dimensions/format/filesize before publish
- Stores all variants in R2 with structured key paths: `{orgId}/creatives/{creativeId}/{platform}/{variant}.{ext}`

---

## PHASE 3: Analytics & Reporting

### 3.1 Analytics Sync Engine

BullMQ cron job (every 4 hours for active campaigns, daily for completed):
- Pull engagement metrics from each platform API
- Normalize into the `AnalyticsSnapshot` model
- Calculate derived metrics: CTR, CPC, CPM, engagement rate
- Store raw API response in `rawPayload` for debugging

### 3.2 Analytics Dashboard

Build dashboard pages:
- **Overview**: total reach, impressions, engagement across all platforms (Recharts)
- **Campaign Detail**: per-platform breakdown, time-series charts, top-performing posts
- **Platform Comparison**: side-by-side performance across platforms
- **Export**: CSV/PDF report generation (background job)

### 3.3 AI Insights (Optional Enhancement)

If user enables AI features:
- Feed analytics data to Claude API for performance insights
- Generate recommendations: best posting times, content themes, budget allocation
- Weekly digest email with AI-generated summary

---

## PHASE 4: Production Hardening

### 4.1 Security Checklist
- [ ] All platform tokens encrypted at rest (AES-256-GCM)
- [ ] CSRF protection on all mutation endpoints
- [ ] Rate limiting on auth endpoints (express-rate-limit or similar)
- [ ] Content Security Policy headers
- [ ] Input validation with Zod on every API route
- [ ] SQL injection prevention (Prisma handles this, but validate raw queries)
- [ ] XSS prevention (React handles this, but sanitize user-generated content)
- [ ] Webhook signature verification for every platform
- [ ] Environment variables via `.env.local` (never committed)
- [ ] Secrets management: document which secrets exist and how to rotate them
- [ ] CORS configuration: restrict to known domains
- [ ] Cookie security: httpOnly, secure, sameSite=strict

### 4.2 Error Handling & Resilience
- Global error boundary in Next.js
- Platform API error classification: retriable (429, 500, 503) vs permanent (400, 401, 403)
- Dead letter queue for failed jobs after max retries
- Circuit breaker pattern for platform APIs (prevent cascading failures)
- Graceful degradation: if one platform API is down, don't block others

### 4.3 Observability
- Structured logging with Axiom (every API call, every platform interaction)
- Request tracing with correlation IDs (x-request-id header)
- Health check endpoints: `/api/health` (app), `/api/health/db`, `/api/health/redis`
- Platform API latency tracking
- Alert on: token expiry, publish failures, API quota approaching limits

### 4.4 Testing Strategy
- Unit tests: Vitest for business logic, SDK methods, encryption utils
- Integration tests: platform SDK with mocked API responses (MSW)
- E2E tests: Playwright for critical flows (login, connect platform, create campaign, publish)
- Load tests: k6 scripts for publish queue throughput

### 4.5 Deployment
Docker Compose production config:
- `web` — Next.js app (port 3000)
- `orchestrator` — FastAPI campaign engine (port 8000)
- `webhook-ingress` — FastAPI webhook receiver (port 8001)
- `postgres` — PostgreSQL 16 (port 5432, persistent volume)
- `redis` — Redis 7 (port 6379, persistent volume)
- `worker` — BullMQ worker process

GitHub Actions workflow:
- On push to `main`: build, test, push to GHCR, deploy via SSH
- Self-hosted runner on Proxmox to avoid CI minute costs
- Environment secrets for production credentials

---

## PHASE 5: User-Facing Features

### 5.1 Multi-Tenant Onboarding
1. Sign up → create organization
2. Invite team members with roles
3. Connect platforms (guided walkthrough)
4. Create first campaign (template-based quickstart)

### 5.2 Content Calendar
- Monthly/weekly calendar view of scheduled posts
- Drag-and-drop rescheduling
- Color-coded by platform
- Click to edit/preview

### 5.3 Approval Workflow
- Editor creates content → submits for approval
- Admin/Owner reviews → approves or requests changes
- Only approved content can be scheduled/published
- Email notifications at each stage

### 5.4 Template Library
- Pre-built post templates by industry/objective
- User can save their own templates
- Platform-specific formatting applied automatically

### 5.5 White-Label Support (Future)
- Custom domain per organization
- Custom branding (logo, colors)
- Remove ReachPilot branding on higher plans

---

## CRITICAL IMPLEMENTATION NOTES

### Platform API Compliance
Each platform has strict policies. Build compliance into the system:
- **Facebook/Meta**: App Review required for production access. Start with test users. Document all permission justifications. Comply with Meta Platform Terms.
- **TikTok**: Content API requires app approval. Rate limits are 600 requests/day for content publishing. Respect content guidelines.
- **LinkedIn**: Marketing Developer Platform access requires company page and app review.
- **Twitter/X**: API access tiers (Free/Basic/Pro/Enterprise). Free tier is extremely limited. Plan for Pro tier ($5000/month) or partner program.
- **Google**: API quotas vary by product. YouTube API has daily quota units. Google Ads requires developer token approval.

Build a `PlatformComplianceService` that:
- Validates content against platform rules before publish
- Checks rate limits before making API calls
- Logs all API interactions for audit
- Provides user-facing warnings for policy violations

### Data Privacy
- Implement data deletion flow (user requests account deletion → cascade delete all platform connections, content, analytics)
- GDPR/privacy: data export endpoint, consent tracking
- Platform data: respect each platform's data retention policies
- Never store end-user data from platform audiences (only aggregate metrics)

### Billing Integration (Stripe)
- Plans: Free (1 org, 2 platforms, 10 posts/month), Pro ($49/mo, 5 platforms, unlimited posts), Agency ($149/mo, unlimited everything + white-label + API access)
- Usage tracking: post count, connected platforms, team members
- Webhook handling for subscription lifecycle

---

## GitHub Repository Setup

Repository: https://github.com/HallyAus/aimarketing (Private)
- Branch strategy: main (production), develop (staging), feature/* branches
- PR template with checklist (tests pass, security review, platform compliance)
- Dependabot for dependency updates
- GitHub Actions secrets for all production credentials

### README Requirements
Include these support items:
- Buy Me a Coffee link: https://buymeacoffee.com/printforge
- Starlink referral: "Here's one free month of Starlink service! Starlink high-speed internet is great for streaming"

### Commit Convention
All commits must include the Buy Me a Coffee and Starlink referral support icons/links.

---

## EXECUTION ORDER

Start building in this exact order:
1. Initialize Turborepo monorepo with all packages
2. Set up PostgreSQL + Redis Docker containers
3. Write Prisma schema, run initial migration
4. Implement NextAuth.js with Google + email providers
5. Build organization + membership system
6. Build platform connection OAuth flows (start with Facebook/Instagram, then TikTok)
7. Build the unified Platform SDK with mock/sandbox modes
8. Implement BullMQ job infrastructure
9. Build campaign CRUD + scheduler
10. Build post publishing pipeline
11. Build analytics sync + dashboard
12. Add media processing pipeline
13. Implement approval workflow
14. Add content calendar UI
15. Production hardening (security, observability, error handling)
16. Stripe billing integration
17. Write tests (unit, integration, E2E)
18. Docker Compose production config
19. CI/CD pipeline
20. Deploy

Remember: this will be used by real agencies managing real client accounts. Every failure (missed post, expired token, lost data) costs real money and trust. Build accordingly.
```

---

## SUPERPOWER SKILL BRAINSTORMING

Below is the skill-creator methodology applied to identify the **10 custom skills** this project would benefit from. Each skill is designed to be reusable, testable, and trigger-optimized.

### Skill 1: `platform-oauth-flow`
- **What it does**: Generates complete OAuth2 integration for any social media platform — callback routes, token exchange, encrypted storage, refresh logic, revocation
- **Trigger**: "connect to [platform]", "add OAuth for", "platform integration", "social media auth"
- **Why it matters**: Every platform has different OAuth quirks (PKCE, long-lived tokens, two-step exchanges). This skill encodes all the gotchas

### Skill 2: `social-media-publisher`
- **What it does**: Generates the publish pipeline for a specific platform — media upload (chunked if needed), post creation, status polling, error handling
- **Trigger**: "publish to [platform]", "post to TikTok", "send to Instagram", "social media posting"
- **Why it matters**: Publishing APIs are the most complex and error-prone part. TikTok's two-step publish, Instagram's container system, LinkedIn's UGC API — each needs specialized handling

### Skill 3: `campaign-orchestrator`
- **What it does**: Builds async campaign execution logic — job queues, retry policies, rate limit tracking, multi-platform coordination, status state machines
- **Trigger**: "campaign engine", "schedule posts", "queue system", "orchestrate publishing"
- **Why it matters**: The orchestrator is the most architecturally complex service. Getting the state machine and failure handling right is critical

### Skill 4: `analytics-normalizer`
- **What it does**: Generates platform-specific analytics fetching + normalization into a unified schema — handles different metric names, time ranges, pagination
- **Trigger**: "pull analytics", "sync metrics", "engagement data", "platform insights"
- **Why it matters**: Every platform names metrics differently (impressions vs views vs reach) and paginates differently. This skill produces consistent, comparable data

### Skill 5: `token-vault`
- **What it does**: Implements encrypted token storage with AES-256-GCM, key derivation, rotation, refresh scheduling, expiry notifications
- **Trigger**: "encrypt tokens", "secure credentials", "token storage", "credential vault"
- **Why it matters**: Storing OAuth tokens securely is non-negotiable. This skill handles the crypto correctly so developers don't roll their own broken encryption

### Skill 6: `webhook-verifier`
- **What it does**: Generates webhook signature verification for each platform — HMAC validation, replay prevention, payload parsing, event routing
- **Trigger**: "webhook handler", "verify webhook", "platform callbacks", "incoming webhooks"
- **Why it matters**: Each platform signs webhooks differently. Getting verification wrong means either accepting spoofed events or rejecting legitimate ones

### Skill 7: `media-pipeline`
- **What it does**: Builds media processing pipelines — Sharp for images, FFmpeg for video, platform-specific resize/transcode, R2 upload with structured paths
- **Trigger**: "resize images", "process media", "video transcoding", "platform media requirements"
- **Why it matters**: Wrong aspect ratio or resolution = publish failure. This skill knows every platform's requirements and auto-generates all variants

### Skill 8: `multi-tenant-rbac`
- **What it does**: Generates organization-scoped RBAC — middleware, permission checks, invitation system, org switching, data isolation queries
- **Trigger**: "multi-tenant", "team roles", "organization access", "RBAC system"
- **Why it matters**: Every query must be scoped to the current org. Missing a `WHERE orgId = ?` is a data leak. This skill makes isolation systematic

### Skill 9: `rate-limit-guardian`
- **What it does**: Implements per-platform, per-connection rate limit tracking — sliding windows, token buckets, backoff strategies, quota dashboards
- **Trigger**: "rate limiting", "API quotas", "throttle requests", "platform rate limits"
- **Why it matters**: Hitting rate limits means failed publishes and angry users. Proactive tracking prevents this entirely

### Skill 10: `compliance-checker`
- **What it does**: Validates content against platform-specific rules before publishing — character limits, media specs, forbidden content patterns, content policy warnings
- **Trigger**: "validate content", "platform rules", "compliance check", "content guidelines"
- **Why it matters**: Publishing content that violates platform rules gets accounts suspended. Pre-flight validation protects users

---

## Environment Variables Template

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

# Claude API (AI features)
ANTHROPIC_API_KEY=
```

---

## Platform Developer Portal Links

Register apps and get API credentials here:
- **Meta (Facebook/Instagram)**: https://developers.facebook.com/
- **TikTok**: https://developers.tiktok.com/
- **LinkedIn**: https://www.linkedin.com/developers/
- **Twitter/X**: https://developer.x.com/
- **Google (YouTube/Ads)**: https://console.cloud.google.com/
- **Pinterest**: https://developers.pinterest.com/
- **Snapchat**: https://business.snapchat.com/

---

## Quick Start (After Cloning)

```bash
# Install dependencies
npm install

# Start infrastructure
docker compose up -d postgres redis

# Run migrations
npx prisma migrate dev

# Seed initial data
npx prisma db seed

# Start dev servers
npm run dev
```
