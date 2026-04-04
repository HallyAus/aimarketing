# ReachPilot Codebase Index

## Architecture

- **Turborepo monorepo** with pnpm workspaces
- `apps/web` — Next.js 15 App Router (main SaaS dashboard + API)
- `apps/worker` — BullMQ consumer for background jobs
- `packages/db` — Prisma schema + generated client (PostgreSQL)
- `packages/shared` — Encryption, validators, plan limits, constants, sanitization
- `packages/platform-sdk` — 9 OAuth adapters, publishers, webhook verifiers, token management

## Database Models (27)

| Model | Purpose |
|---|---|
| Organization | Multi-tenant org with plan, billing, Stripe IDs |
| User | Auth user with email/password, NextAuth accounts |
| Account | NextAuth OAuth provider accounts |
| Session | NextAuth sessions |
| VerificationToken | NextAuth email verification tokens |
| Membership | User-to-org role mapping (OWNER/ADMIN/EDITOR/VIEWER) |
| Invitation | Org invite tokens with expiry |
| PlatformConnection | OAuth tokens for connected platforms (encrypted) |
| Page | Platform page/account (e.g., Facebook Page) with encrypted tokens |
| Campaign | Marketing campaign with objective, budget, status |
| Post | Social media post with scheduling, publishing, approval workflow |
| Creative | Uploaded media assets stored in Cloudflare R2 |
| AnalyticsSnapshot | Point-in-time engagement metrics per post |
| AuditLog | Org-scoped audit trail of all actions |
| WebhookEvent | Inbound platform webhook events |
| PostTemplate | Reusable post templates per org |
| Authenticator | WebAuthn/passkey credentials |
| BrandVoice | AI-generated brand voice profiles per page |
| HashtagSet | Saved hashtag groups per page |
| ContentTemplate | Org-wide or page-specific content templates |
| ApprovalRequest | Post approval workflow (PENDING/APPROVED/REJECTED) |
| RssFeed | RSS-to-post automation per page |
| WebhookRule | Automation rules (trigger + action) per org |
| LeadCapture | CRM lead entries with source tracking |
| UtmLink | UTM-tagged URLs with click tracking |
| PerformanceReport | Generated performance reports (weekly/monthly/custom) |

### Enums

| Enum | Values |
|---|---|
| Plan | FREE, PRO, AGENCY |
| Role | OWNER, ADMIN, EDITOR, VIEWER |
| Platform | FACEBOOK, INSTAGRAM, TIKTOK, LINKEDIN, TWITTER_X, GOOGLE_ADS, YOUTUBE, PINTEREST, SNAPCHAT |
| ConnectionStatus | ACTIVE, EXPIRED, REVOKED |
| CampaignObjective | AWARENESS, TRAFFIC, ENGAGEMENT, CONVERSIONS, LEADS |
| CampaignStatus | DRAFT, SCHEDULED, ACTIVE, PAUSED, COMPLETED, FAILED |
| PostStatus | DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, SCHEDULED, PUBLISHING, PUBLISHED, FAILED, DELETED |
| CreativeType | IMAGE, VIDEO, CAROUSEL, STORY, REEL |

## API Routes (50+)

### Auth (no auth required)
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Email/password registration with org creation |
| POST | `/api/auth/forgot-password` | Request password reset (never leaks email existence) |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth.js OAuth + credentials handler |
| POST | `/api/auth/dev-login` | Dev-only login shortcut |

### Campaigns (VIEWER+ for GET, EDITOR+ for write)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/campaigns` | List campaigns with pagination, pageId filtering |
| POST | `/api/campaigns` | Create new campaign |
| GET | `/api/campaigns/[campaignId]` | Get single campaign |
| PATCH | `/api/campaigns/[campaignId]` | Update campaign |
| GET | `/api/campaigns/[campaignId]/posts` | List posts in campaign |
| POST | `/api/campaigns/[campaignId]/publish` | Publish all campaign posts |
| POST | `/api/campaigns/[campaignId]/auto-schedule` | Auto-schedule campaign posts |

### Posts (EDITOR+ for write, ADMIN+ for approve/reject)
| Method | Path | Purpose |
|---|---|---|
| PATCH | `/api/posts/[postId]` | Edit post (optimistic concurrency via version) |
| DELETE | `/api/posts/[postId]` | Delete post (soft-delete if published) |
| POST | `/api/posts/[postId]/approve` | Approve post (ADMIN+) |
| POST | `/api/posts/[postId]/reject` | Reject post with reason (ADMIN+) |
| POST | `/api/posts/[postId]/schedule` | Schedule single post |
| POST | `/api/posts/[postId]/publish` | Publish single post |
| POST | `/api/posts/schedule` | Schedule single or batch posts |
| POST | `/api/posts/auto-schedule` | AI-powered auto-scheduling with overnight skip |
| POST | `/api/posts/publish-now` | Immediate publish with token decryption |
| POST | `/api/posts/backfill-pages` | Backfill page names on existing posts |

### AI Endpoints (EDITOR+)
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/ai/url-to-posts` | Scrape URL and generate multi-platform posts |
| POST | `/api/ai/brand-voice` | Analyze samples to create brand voice profile |
| POST | `/api/ai/brand-voice/save` | Save brand voice to database |
| POST | `/api/ai/hashtags` | Generate hashtag research by topic/platform |
| POST | `/api/ai/hashtags/save` | Save hashtag set to database |
| POST | `/api/ai/translate` | Translate post into 10 supported languages |
| POST | `/api/ai/repurpose` | Repurpose content into multiple formats |
| POST | `/api/ai/ab-variants` | Generate A/B test variants of a post |
| POST | `/api/ai/carousel` | Generate carousel slide content |
| POST | `/api/ai/story-template` | Generate story/reel content templates |
| POST | `/api/ai/video-script` | Generate video scripts with shot descriptions |
| POST | `/api/ai/trending` | Discover trending topics for a niche |
| POST | `/api/ai/competitor-analysis` | Analyze competitor's content strategy |
| POST | `/api/ai/image-gen` | Generate SVG-based images via sharp |
| POST | `/api/ai/generate-post` | Generate a single post with AI |
| POST | `/api/ai/generate-ideas` | Generate content ideas |
| POST | `/api/ai/improve-post` | Improve existing post content |
| POST | `/api/ai/drafts` | Save AI-generated drafts |

### Connections & Platforms
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/connections` | List active platform connections |
| GET | `/api/platforms/facebook/pages` | List Facebook Pages via Graph API (cached) |
| POST | `/api/platforms/facebook/pages` | Save selected Facebook pages |
| GET | `/api/platforms/google-business` | Google Business profile |
| GET | `/api/platforms/[platform]/authorize` | OAuth authorize redirect |
| GET | `/api/platforms/[platform]/callback` | OAuth callback handler |
| POST | `/api/platforms/[platform]/disconnect` | Disconnect platform |

### Analytics
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/analytics/overview` | Dashboard overview metrics |
| GET | `/api/analytics/audience` | Audience demographics |
| GET | `/api/analytics/benchmarking` | Performance benchmarks |
| GET | `/api/analytics/best-times` | Optimal posting times |
| GET | `/api/analytics/sentiment` | Sentiment analysis |
| GET | `/api/analytics/campaigns/[campaignId]` | Campaign-specific analytics |
| GET | `/api/analytics/dashboard-widgets` | Widget data for dashboard |
| GET | `/api/analytics/export` | Export analytics data |

### CRM & Leads
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/leads` | List leads with search and pagination |
| POST | `/api/leads` | Create lead (also used by embed forms) |
| PATCH | `/api/leads` | Update lead |
| DELETE | `/api/leads` | Delete lead |
| GET | `/api/crm` | CRM dashboard data |

### Reports
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/reports/generate` | List generated reports |
| POST | `/api/reports/generate` | Generate a new performance report |
| GET | `/api/reports/weekly` | List weekly reports |
| POST | `/api/reports/weekly` | Generate and email weekly report |

### Approvals
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/approvals` | List approval requests (filterable by status) |
| POST | `/api/approvals` | Create approval request for a post |
| PATCH | `/api/approvals` | Approve or reject (ADMIN+) |

### UTM Links
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/utm` | List UTM links with pagination |
| POST | `/api/utm` | Create UTM-tagged URL |
| DELETE | `/api/utm` | Delete UTM link |

### RSS Feeds
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/rss` | List RSS feeds |
| POST | `/api/rss` | Create RSS feed |
| PATCH | `/api/rss` | Update RSS feed settings |
| DELETE | `/api/rss` | Delete RSS feed |

### Webhook Rules
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/webhooks/rules` | List webhook automation rules |
| POST | `/api/webhooks/rules` | Create webhook rule (ADMIN+) |
| PATCH | `/api/webhooks/rules` | Update webhook rule (ADMIN+) |
| DELETE | `/api/webhooks/rules` | Delete webhook rule (ADMIN+) |
| POST | `/api/webhooks/stripe` | Stripe webhook handler |
| POST | `/api/webhooks/[platform]` | Platform webhook handler |

### Organizations
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/organizations` | List user's organizations |
| POST | `/api/organizations` | Create new organization |
| POST | `/api/organizations/switch` | Switch active organization |
| POST | `/api/organizations/pause-publishing` | Toggle publishing pause |
| GET | `/api/organizations/[orgId]` | Get org details |
| PATCH | `/api/organizations/[orgId]` | Update org |
| GET | `/api/organizations/[orgId]/members` | List members |
| POST | `/api/organizations/[orgId]/invitations` | Send invite |

### Other
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/health/db` | Database health check |
| GET | `/api/health/redis` | Redis health check |
| GET | `/api/cron/publish-scheduled` | Cron: publish due posts (CRON_SECRET auth) |
| GET | `/api/accounts/active` | Get active account info |
| GET | `/api/pages` | List pages for current org |
| GET/POST | `/api/creatives` | Media asset management |
| POST | `/api/email/campaign` | Send campaign emails |
| POST | `/api/billing/checkout` | Stripe checkout session |
| GET/POST | `/api/templates` | Post template CRUD |

## Dashboard Pages (50+)

### Auth Pages
| Path | Purpose |
|---|---|
| `/signin` | Sign in (credentials + OAuth) |
| `/forgot-password` | Request password reset |
| `/reset-password/[token]` | Reset password form |
| `/invite/[token]` | Accept org invitation |

### Main Dashboard
| Path | Purpose |
|---|---|
| `/dashboard` | Overview with metrics cards and recent activity |
| `/campaigns` | Campaign list with filters |
| `/campaigns/new` | Create new campaign |
| `/campaigns/[campaignId]` | Campaign detail with posts |
| `/campaigns/[campaignId]/posts/new` | Create post in campaign |
| `/calendar` | Visual content calendar |
| `/drafts` | Draft posts management |
| `/approvals` | Approval queue |

### AI Tools
| Path | Purpose |
|---|---|
| `/ai` | AI tools hub |
| `/ai/url-to-posts` | URL-to-posts generator |
| `/ai/brand-voice` | Brand voice analyzer |
| `/ai/hashtags` | Hashtag research |
| `/ai/translate` | Content translator |
| `/ai/repurpose` | Content repurposer |
| `/ai/ab-test` | A/B test variant generator |
| `/ai/carousel` | Carousel content generator |
| `/ai/video-scripts` | Video script generator |
| `/ai/trending` | Trending topics finder |
| `/ai/competitor-spy` | Competitor analysis |
| `/ai/image-gen` | AI image generator |
| `/ai/bulk-generate` | Bulk content generation |
| `/ai/templates-ai` | AI-powered templates |

### Analytics
| Path | Purpose |
|---|---|
| `/analytics` | Analytics overview |
| `/analytics/audience` | Audience insights |
| `/analytics/benchmarking` | Performance benchmarks |
| `/analytics/best-times` | Best posting times |
| `/analytics/sentiment` | Sentiment analysis |
| `/analytics/roi` | ROI tracking |

### Settings
| Path | Purpose |
|---|---|
| `/settings/connections` | Platform connections management |
| `/settings/team` | Team members and invitations |
| `/settings/billing` | Subscription and billing |
| `/settings/rss` | RSS feed management |
| `/settings/webhooks` | Webhook rules |
| `/settings/auto-reply` | Auto-reply configuration |
| `/settings/reports` | Report scheduling |
| `/settings/crm` | CRM settings |

### Tools
| Path | Purpose |
|---|---|
| `/tools/utm` | UTM link builder |
| `/tools/landing-page` | Landing page builder |
| `/leads` | Lead management |
| `/reports` | Report generation and history |
| `/email` | Email campaigns |
| `/templates` | Content templates |
| `/templates/new` | Create new template |
| `/onboarding` | Onboarding wizard |
| `/org-picker` | Organization switcher |

### Public Pages
| Path | Purpose |
|---|---|
| `/` | Marketing landing page |
| `/marketing` | SEO marketing pages |
| `/marketing/[city]` | City-specific landing pages |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/demo` | Interactive demo |
| `/demo/ai` | AI features demo |
| `/demo/analytics` | Analytics demo |
| `/demo/campaigns` | Campaigns demo |

## Shared Components (13+)

| Component | Purpose |
|---|---|
| `active-account-banner.tsx` | Server component: shows active page/account |
| `client-account-banner.tsx` | Client component: active account display |
| `breadcrumbs.tsx` | Navigation breadcrumbs |
| `empty-state.tsx` | Empty state placeholder |
| `image-upload.tsx` | Image upload with R2 integration |
| `metric-card.tsx` | Dashboard metric display card |
| `page-header.tsx` | Page title and action buttons |
| `platform-badge.tsx` | Platform icon/label badge |
| `post-form.tsx` | Post creation/editing form |
| `publish-modal.tsx` | Publish confirmation dialog |
| `status-badge.tsx` | Post/campaign status indicator |
| `submit-button.tsx` | Form submit button with loading state |
| `marketing/` | Marketing site components |

## Libraries/Utilities

### `apps/web/src/lib/`

| File | Purpose |
|---|---|
| `auth.ts` | NextAuth.js configuration (Google OAuth + credentials) |
| `auth-middleware.ts` | `withAuth` and `withRole` middleware for API routes |
| `auth-types.d.ts` | NextAuth session type augmentations |
| `api-handler.ts` | `withErrorHandler` wrapper + `ZodValidationError` class |
| `db.ts` | Prisma client singleton |
| `redis.ts` | Redis/Upstash client |
| `stripe.ts` | Stripe client configuration |
| `r2.ts` | Cloudflare R2 upload/delete utilities |
| `ai.ts` | Anthropic client helpers |
| `active-account.ts` | Active page/account resolution |
| `connection-cache.ts` | Cache-through helper for platform API responses |
| `platform-colors.ts` | Platform brand color map |
| `platform-media-specs.ts` | Platform media size/format specifications |
| `posthog.ts` | PostHog analytics client |
| `rate-limit.ts` | Rate limiting utilities |
| `timezone.ts` | Timezone detection from cookies |

### `packages/shared/src/`

| File | Purpose |
|---|---|
| `encryption.ts` | AES-256-GCM encrypt/decrypt for platform tokens |
| `validators.ts` | Zod schemas (createCampaign, updatePost, rejectPost, etc.) |
| `plan-limits.ts` | Plan feature gates (post limits, connections, AI usage) |
| `sanitize.ts` | HTML sanitization for post content |
| `constants.ts` | Role hierarchy, status transitions, platform configs |
| `types.ts` | Shared TypeScript types |
| `env.ts` | Environment variable validation |

### `packages/platform-sdk/src/`

| File | Purpose |
|---|---|
| `adapters/` | 9 OAuth adapters (Facebook, Instagram, TikTok, LinkedIn, Twitter/X, Google Ads, YouTube, Pinterest, Snapchat) |
| `publishers/` | Platform-specific post publishing logic |
| `webhook-verifiers/` | Inbound webhook signature verification |
| `token-manager.ts` | Token refresh and health checking |
| `rate-limiter.ts` | Platform API rate limiting |
| `config.ts` | Platform OAuth URLs and scopes |
| `types.ts` | Publisher/adapter type definitions |
| `errors.ts` | SDK-specific error classes |

### `apps/worker/src/`

| File | Purpose |
|---|---|
| `queues.ts` | BullMQ queue definitions |
| `r2.ts` | R2 integration for media processing |
| `processors/analytics-sync.ts` | Sync analytics from platforms |
| `processors/campaign-publish.ts` | Batch campaign publishing |
| `processors/campaign-schedule.ts` | Campaign scheduling logic |
| `processors/email-send.ts` | Email sending via Resend |
| `processors/media-process.ts` | Image/video processing pipeline |
| `processors/token-health-check.ts` | Platform token validity checks |
| `processors/token-refresh.ts` | Automatic token refresh |

## Environment Variables

### Required

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Public-facing app URL |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `NEXTAUTH_SECRET` | NextAuth.js signing secret |
| `NEXTAUTH_URL` | NextAuth.js base URL |
| `MASTER_ENCRYPTION_KEY` | AES key for platform token encryption |

### Auth Providers (optional, enable as needed)

| Variable | Purpose |
|---|---|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` | Microsoft OAuth |

### Platform OAuth (optional per platform)

| Variable | Purpose |
|---|---|
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | Facebook/Meta integration |
| `FACEBOOK_WEBHOOK_VERIFY_TOKEN` | Facebook webhook verification |
| `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET` | TikTok integration |
| `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` | LinkedIn integration |
| `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET` | Twitter/X integration |
| `GOOGLE_ADS_CLIENT_ID` / `GOOGLE_ADS_CLIENT_SECRET` / `GOOGLE_ADS_DEVELOPER_TOKEN` | Google Ads |
| `PINTEREST_APP_ID` / `PINTEREST_APP_SECRET` | Pinterest integration |
| `SNAPCHAT_CLIENT_ID` / `SNAPCHAT_CLIENT_SECRET` | Snapchat integration |

### Services (optional)

| Variable | Purpose |
|---|---|
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` / `R2_PUBLIC_URL` | Cloudflare R2 media storage |
| `RESEND_API_KEY` / `EMAIL_FROM` | Resend email sending |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe billing |
| `STRIPE_PRO_PRICE_ID` / `STRIPE_AGENCY_PRICE_ID` | Stripe price IDs per plan |
| `ANTHROPIC_API_KEY` | Claude API for AI features |
| `CRON_SECRET` | Vercel cron job authorization |

### Observability (optional)

| Variable | Purpose |
|---|---|
| `AXIOM_DATASET` / `AXIOM_TOKEN` | Axiom structured logging |
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | PostHog feature flags + analytics |
| `NEXT_PUBLIC_UMAMI_URL` / `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Umami web analytics |

### Infrastructure (optional)

| Variable | Purpose |
|---|---|
| `REDIS_PASSWORD` | Redis auth password |
| `DB_PASSWORD` | Database password (for Docker compose) |
| `CF_TUNNEL_TOKEN` | Cloudflare Tunnel token |
