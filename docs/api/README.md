# AdPilot API Documentation

All API endpoints live under `/api/` and are implemented as Next.js App Router route handlers. Unless noted otherwise, all authenticated endpoints require a valid NextAuth.js session cookie.

**Base URL:** `https://app.adpilot.io/api` (production) or `http://localhost:3000/api` (development)

---

## Table of Contents

- [Authentication](#authentication)
- [Health](#health)
- [Organizations](#organizations)
- [Posts](#posts)
- [Campaigns](#campaigns)
- [Platforms & Connections](#platforms--connections)
- [Pages](#pages)
- [AI Content Studio](#ai-content-studio)
- [Analytics](#analytics)
- [Templates](#templates)
- [Creatives](#creatives)
- [Billing](#billing)
- [Invitations](#invitations)
- [Approvals](#approvals)
- [RSS Feeds](#rss-feeds)
- [UTM Links](#utm-links)
- [Leads / CRM](#leads--crm)
- [Ingestion](#ingestion)
- [Reports](#reports)
- [Webhooks](#webhooks)
- [Announcements](#announcements)
- [User Preferences](#user-preferences)
- [Cron Jobs](#cron-jobs)
- [Admin](#admin)
- [Stripe Webhook](#stripe-webhook)

---

## Authentication

### POST /api/auth/signup

Create a new user account.

**Auth:** None

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | yes | User email address |
| password | string | yes | Min 8 characters |
| name | string | no | Display name |

**Response (201):** `{ "success": true }`

**Errors:** `400 VALIDATION_ERROR` | `409 EMAIL_EXISTS`

---

### POST /api/auth/forgot-password

Request a password reset email.

**Auth:** None

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | yes | Account email |

**Response (200):** `{ "success": true }` (always, to prevent email enumeration)

---

### POST /api/auth/reset-password

Reset password using a token from the reset email.

**Auth:** None

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| token | string | yes | Reset token from email |
| password | string | yes | New password |

**Response (200):** `{ "success": true }`

**Errors:** `400 INVALID_TOKEN` | `400 TOKEN_EXPIRED`

---

### POST /api/auth/verify-email

Verify email address using a token from the verification email.

**Auth:** None

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| token | string | yes | Verification token |

**Response (200):** `{ "success": true }`

---

### POST /api/auth/setup/verify

Verify an invited user's setup token.

**Auth:** None

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| token | string | yes | Setup token |

---

### POST /api/auth/setup/complete

Complete account setup for an invited user.

**Auth:** None

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| token | string | yes | Setup token |
| password | string | yes | New password |
| name | string | no | Display name |

---

### GET/POST /api/auth/[...nextauth]

NextAuth.js catch-all handler. Supports Google OAuth, Microsoft OAuth, and credentials (email/password) providers.

---

## Health

### GET /api/health

Overall health check.

**Auth:** None

**Response (200):** `{ "status": "ok", "timestamp": "..." }`

### GET /api/health/db

Database connectivity check.

**Auth:** None

### GET /api/health/redis

Redis connectivity check.

**Auth:** None

---

## Organizations

### GET /api/organizations

List organizations the current user belongs to.

**Auth:** Required

**Response (200):** `{ "organizations": [...] }`

---

### POST /api/organizations

Create a new organization.

**Auth:** Required

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | yes | Organization name |
| slug | string | yes | URL-safe slug (unique) |

---

### GET /api/organizations/[orgId]

Get organization details.

**Auth:** Required (must be a member)

---

### PATCH /api/organizations/[orgId]

Update organization settings.

**Auth:** Required (OWNER or ADMIN role)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | no | Organization name |
| defaultTimezone | string | no | IANA timezone |
| industry | string | no | Industry category |
| website | string | no | Company website URL |

---

### GET /api/organizations/[orgId]/members

List organization members.

**Auth:** Required (must be a member)

---

### GET /api/organizations/[orgId]/invitations

List pending invitations.

**Auth:** Required (OWNER or ADMIN role)

---

### POST /api/organizations/profile

Update the organization profile for the current org.

**Auth:** Required

---

### POST /api/organizations/switch

Switch active organization context.

**Auth:** Required

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| orgId | string | yes | Organization to switch to |

---

### POST /api/organizations/pause-publishing

Toggle publishing pause for the organization.

**Auth:** Required (OWNER or ADMIN role)

---

## Posts

### GET /api/posts/[postId]

Get a single post by ID.

**Auth:** Required

**Response (200):** `{ "post": { "id": "...", "content": "...", "status": "DRAFT", ... } }`

---

### PATCH /api/posts/[postId]

Update a post (content, media, schedule).

**Auth:** Required

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| content | string | no | Post content |
| mediaUrls | string[] | no | Media attachment URLs |
| scheduledAt | string (ISO 8601) | no | Schedule time |

---

### DELETE /api/posts/[postId]

Delete a post.

**Auth:** Required

---

### POST /api/posts/[postId]/publish

Publish a single post immediately.

**Auth:** Required

---

### POST /api/posts/[postId]/schedule

Schedule a post for future publishing.

**Auth:** Required

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| scheduledAt | string (ISO 8601) | yes | When to publish |

---

### POST /api/posts/[postId]/approve

Approve a post in the approval workflow.

**Auth:** Required (OWNER, ADMIN, or EDITOR role)

---

### POST /api/posts/[postId]/reject

Reject a post in the approval workflow.

**Auth:** Required (OWNER, ADMIN, or EDITOR role)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reason | string | yes | Rejection reason |

---

### POST /api/posts/publish-now

Create and immediately publish a new post.

**Auth:** Required

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| content | string | yes | Post content |
| pageId | string | yes | Target page ID |
| platform | string | yes | Platform enum value |
| mediaUrls | string[] | no | Media URLs |

---

### POST /api/posts/schedule

Create a new scheduled post.

**Auth:** Required

---

### POST /api/posts/auto-schedule

AI-powered auto-scheduling based on optimal posting times.

**Auth:** Required

---

### POST /api/posts/backfill-pages

Backfill page associations for existing posts.

**Auth:** Required (admin)

---

## Campaigns

### GET /api/campaigns

List campaigns for the current org/page.

**Auth:** Required

**Query params:** `?status=ACTIVE&pageId=...`

---

### POST /api/campaigns

Create a new campaign.

**Auth:** Required

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | yes | Campaign name |
| objective | string | yes | AWARENESS, TRAFFIC, ENGAGEMENT, CONVERSIONS, or LEADS |
| pageId | string | no | Target page |
| budget | number | no | Campaign budget |
| startDate | string | no | ISO 8601 start date |
| endDate | string | no | ISO 8601 end date |
| targetPlatforms | string[] | no | Platform enum values |

---

### GET /api/campaigns/[campaignId]

Get campaign details.

**Auth:** Required

---

### PATCH /api/campaigns/[campaignId]

Update campaign.

**Auth:** Required

---

### DELETE /api/campaigns/[campaignId]

Delete a campaign and its posts.

**Auth:** Required

---

### GET /api/campaigns/[campaignId]/posts

List posts belonging to a campaign.

**Auth:** Required

---

### POST /api/campaigns/[campaignId]/publish

Publish all scheduled posts in a campaign.

**Auth:** Required

---

### POST /api/campaigns/[campaignId]/auto-schedule

AI-powered auto-schedule for all posts in a campaign.

**Auth:** Required

---

## Platforms & Connections

### GET /api/platforms/[platform]/authorize

Initiate OAuth flow for a platform. Redirects to platform's authorization page.

**Auth:** Required

**Supported platforms:** `facebook`, `instagram`, `tiktok`, `linkedin`, `twitter`, `youtube`, `google-ads`, `pinterest`, `snapchat`

---

### GET /api/platforms/[platform]/callback

OAuth callback handler. Exchanges authorization code for tokens, encrypts them, and stores the connection.

**Auth:** Required (via session)

---

### POST /api/platforms/[platform]/disconnect

Disconnect a platform account.

**Auth:** Required

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| connectionId | string | yes | Connection to disconnect |

---

### GET /api/platforms/facebook/pages

List Facebook Pages available to the connected user (for page selection after OAuth).

**Auth:** Required

---

### GET /api/platforms/google-business

List Google Business Profile locations.

**Auth:** Required

---

### GET /api/connections

List all platform connections for the current org.

**Auth:** Required

---

## Pages

### GET /api/pages

List pages (social accounts) for the current org.

**Auth:** Required

**Response (200):** `{ "pages": [{ "id": "...", "name": "...", "platform": "FACEBOOK", ... }] }`

---

### GET /api/accounts/active

Get the currently active page/account from the cookie.

**Auth:** Required

---

## AI Content Studio

All AI endpoints require authentication and use the Anthropic Claude API.

### POST /api/ai/generate-post

Generate post content using AI.

**Auth:** Required

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| prompt | string | yes | Description of desired content |
| platform | string | no | Target platform for formatting |
| tone | string | no | Desired tone |
| pageId | string | no | Page for brand voice context |

---

### POST /api/ai/improve-post

Improve existing post content.

**Auth:** Required

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| content | string | yes | Original content |
| instructions | string | no | Improvement instructions |

---

### POST /api/ai/ab-variants

Generate A/B test variants of a post.

**Auth:** Required

---

### POST /api/ai/brand-voice

Analyze content to extract brand voice characteristics.

**Auth:** Required

### POST /api/ai/brand-voice/save

Save an analyzed brand voice to a page.

**Auth:** Required

---

### POST /api/ai/carousel

Generate carousel slide content.

**Auth:** Required

---

### POST /api/ai/competitor-analysis

Analyze competitor social media presence.

**Auth:** Required

### POST /api/ai/competitor-match

Generate content matching a competitor's style.

**Auth:** Required

---

### POST /api/ai/drafts

Generate multiple draft variations.

**Auth:** Required

---

### POST /api/ai/generate-ideas

Generate content ideas for a page/topic.

**Auth:** Required

---

### POST /api/ai/generate-image

Generate an image description/prompt for AI image generation.

**Auth:** Required

### POST /api/ai/image-gen

Generate images using AI.

**Auth:** Required

---

### POST /api/ai/hashtags

Generate relevant hashtags for content.

**Auth:** Required

### POST /api/ai/hashtags/save

Save a hashtag set to a page.

**Auth:** Required

---

### POST /api/ai/keyword-scan

Scan content for SEO keywords.

**Auth:** Required

---

### POST /api/ai/repurpose

Repurpose content for a different platform.

**Auth:** Required

---

### POST /api/ai/story-template

Generate Instagram/Facebook Story templates.

**Auth:** Required

---

### POST /api/ai/translate

Translate post content to another language.

**Auth:** Required

---

### POST /api/ai/trending

Get trending topics for a category/industry.

**Auth:** Required

---

### POST /api/ai/url-to-posts

Convert a URL's content into social media posts.

**Auth:** Required

---

### POST /api/ai/video-script

Generate a video script from a topic/prompt.

**Auth:** Required

---

## Analytics

### GET /api/analytics/overview

Dashboard overview metrics for the current page/org.

**Auth:** Required

**Query params:** `?pageId=...&period=7d`

---

### GET /api/analytics/audience

Audience demographics and insights.

**Auth:** Required

---

### GET /api/analytics/benchmarking

Performance benchmarking across accounts.

**Auth:** Required

---

### GET /api/analytics/best-times

Best times to post based on historical engagement.

**Auth:** Required

---

### GET /api/analytics/campaigns/[campaignId]

Analytics for a specific campaign.

**Auth:** Required

---

### GET /api/analytics/dashboard-widgets

Widget data for the analytics dashboard.

**Auth:** Required

---

### GET /api/analytics/export

Export analytics data as CSV or JSON.

**Auth:** Required

**Query params:** `?format=csv&period=30d&pageId=...`

---

### GET /api/analytics/sentiment

Sentiment analysis across posts and comments.

**Auth:** Required

---

## Templates

### GET /api/templates

List post templates for the current org.

**Auth:** Required

### POST /api/templates

Create a new post template.

**Auth:** Required

### GET /api/templates/[templateId]

Get a specific template.

**Auth:** Required

### PATCH /api/templates/[templateId]

Update a template.

**Auth:** Required

### DELETE /api/templates/[templateId]

Delete a template.

**Auth:** Required

---

## Creatives

### GET /api/creatives

List creative assets (images, videos) for the current org.

**Auth:** Required

### POST /api/creatives

Upload a new creative asset (to Cloudflare R2).

**Auth:** Required (multipart/form-data)

### GET /api/creatives/[creativeId]

Get creative details.

**Auth:** Required

### DELETE /api/creatives/[creativeId]

Delete a creative asset.

**Auth:** Required

---

## Billing

### POST /api/billing/checkout

Create a Stripe Checkout session for plan upgrade.

**Auth:** Required

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| priceId | string | yes | Stripe Price ID |
| billingCycle | string | no | `MONTHLY` or `ANNUAL` |

**Response (200):** `{ "url": "https://checkout.stripe.com/..." }`

---

## Invitations

### POST /api/orgs/[orgId]/invites

Send a team invitation.

**Auth:** Required (OWNER or ADMIN role)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | yes | Invitee email |
| role | string | yes | ADMIN, EDITOR, or VIEWER |
| message | string | no | Personal message |

---

### GET /api/invites/verify

Verify an invite token (for the accept page).

**Auth:** None

**Query params:** `?token=...`

---

### POST /api/invites/accept

Accept a team invitation.

**Auth:** Required

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| token | string | yes | Invite token |

---

## Approvals

### GET /api/approvals

List pending approval requests for the current org.

**Auth:** Required (OWNER, ADMIN, or EDITOR role)

---

## RSS Feeds

### GET /api/rss

List RSS feeds for the current page.

**Auth:** Required

### POST /api/rss

Add an RSS feed to auto-generate posts.

**Auth:** Required

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| url | string | yes | RSS feed URL |
| pageId | string | yes | Target page |
| autoPost | boolean | no | Auto-create posts from new items |
| tone | string | no | AI tone for generated posts |

---

## UTM Links

### GET /api/utm

List UTM-tagged links for the current org.

**Auth:** Required

### POST /api/utm

Create a UTM-tagged link.

**Auth:** Required

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| url | string | yes | Destination URL |
| source | string | yes | UTM source |
| medium | string | yes | UTM medium |
| campaign | string | yes | UTM campaign |

---

## Leads / CRM

### GET /api/leads

List captured leads.

**Auth:** Required

### POST /api/leads

Capture a new lead.

**Auth:** None (public lead capture form)

### GET /api/crm

CRM data overview.

**Auth:** Required

---

## Ingestion

### POST /api/ingestion/trigger

Trigger historical data ingestion for a page.

**Auth:** Required

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| pageId | string | yes | Page to ingest data for |
| dataTypes | string[] | no | Types of data to ingest |

---

### GET /api/ingestion/status

Check ingestion job status.

**Auth:** Required

**Query params:** `?pageId=...`

---

## Reports

### POST /api/reports/generate

Generate a performance report.

**Auth:** Required

### GET /api/reports/weekly

Get the latest weekly report.

**Auth:** Required

---

## Webhooks

### POST /api/webhooks/[platform]

Receive incoming webhooks from social platforms.

**Auth:** Platform-specific signature verification

---

### GET /api/webhooks/rules

List webhook automation rules.

**Auth:** Required

### POST /api/webhooks/rules

Create a webhook automation rule.

**Auth:** Required

---

## Announcements

### GET /api/announcements

Get active announcements for the current user.

**Auth:** Required

---

## User Preferences

### GET /api/user/preferences

Get current user preferences (timezone, locale, date format).

**Auth:** Required

### PATCH /api/user/preferences

Update user preferences.

**Auth:** Required

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| timezone | string | no | IANA timezone string |
| locale | string | no | Locale code (e.g., `en-US`) |
| dateFormat | string | no | `auto`, `12h`, or `24h` |

---

## Cron Jobs

### POST /api/cron/publish-scheduled

Publish posts whose `scheduledAt` has passed. Typically called by a cron trigger (Vercel Cron or external scheduler).

**Auth:** Cron secret header

---

## Email

### POST /api/email/campaign

Send a campaign email.

**Auth:** Required (admin)

---

## Admin

All admin endpoints require `systemRole: ADMIN` or `SUPER_ADMIN`.

### GET /api/admin/users

List all users with pagination and search.

**Auth:** Admin required

**Query params:** `?page=1&limit=20&search=...&status=ACTIVE`

---

### POST /api/admin/users/create

Create a new user (admin-initiated).

**Auth:** Admin required

---

### GET /api/admin/users/[id]

Get user details.

**Auth:** Admin required

---

### PATCH /api/admin/users/[id]

Update user details.

**Auth:** Admin required

---

### POST /api/admin/users/[id]/ban

Ban a user.

**Auth:** Admin required

---

### POST /api/admin/users/[id]/suspend

Suspend a user.

**Auth:** Admin required

---

### POST /api/admin/users/[id]/change-role

Change a user's system role.

**Auth:** Super Admin required

---

### POST /api/admin/users/[id]/reset-password

Force a password reset for a user.

**Auth:** Admin required

---

### POST /api/admin/users/[id]/resend-verification

Resend email verification.

**Auth:** Admin required

---

### GET /api/admin/orgs

List all organizations with pagination.

**Auth:** Admin required

---

### GET /api/admin/orgs/[id]

Get organization details (admin view).

**Auth:** Admin required

---

### PATCH /api/admin/orgs/[id]

Update organization (admin overrides).

**Auth:** Admin required

---

### POST /api/admin/orgs/[id]/billing/change-plan

Change an organization's plan (admin override).

**Auth:** Admin required

---

### POST /api/admin/orgs/[id]/billing/cancel

Cancel an organization's subscription.

**Auth:** Admin required

---

### GET /api/admin/announcements

List all announcements.

**Auth:** Admin required

### POST /api/admin/announcements

Create an announcement.

**Auth:** Admin required

### PATCH /api/admin/announcements/[id]

Update an announcement.

**Auth:** Admin required

### DELETE /api/admin/announcements/[id]

Delete an announcement.

**Auth:** Admin required

---

### GET /api/admin/features

List all feature flags.

**Auth:** Admin required

### PATCH /api/admin/features/[id]

Update a feature flag.

**Auth:** Admin required

---

### GET /api/admin/search

Global admin search across users, orgs, and posts.

**Auth:** Admin required

**Query params:** `?q=...`

---

### GET /api/admin/waitlist

List waitlist entries.

**Auth:** Admin required

---

## Stripe Webhook

### POST /api/stripe/webhook

Stripe webhook handler. Verifies signatures and processes billing events.

**Auth:** Stripe signature verification (not session-based)

**Handled events:**

| Event | Action |
|-------|--------|
| `customer.subscription.created` | Sync subscription status to organization |
| `customer.subscription.updated` | Update plan, period dates, cancellation flag |
| `customer.subscription.deleted` | Downgrade organization to FREE plan |
| `invoice.payment_succeeded` | Record invoice, clear PAST_DUE status |
| `invoice.payment_failed` | Mark organization as PAST_DUE |
| `payment_method.attached` | Store payment method details |
| `payment_method.detached` | Remove payment method record |

---

## Common Error Response Format

All API errors follow a consistent format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description"
}
```

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid request body or parameters |
| 401 | UNAUTHORIZED | Missing or invalid session |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource does not exist |
| 409 | CONFLICT | Resource already exists |
| 429 | RATE_LIMITED | Too many requests (auth: 20/min, API: 100/min) |
| 500 | INTERNAL_ERROR | Server error |

## Rate Limits

| Category | Limit |
|----------|-------|
| Auth endpoints | 20 requests/minute per IP |
| API endpoints | 100 requests/minute per user |
