# Phase 7: Production Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Production-harden AdPilot — PostHog feature flag integration, security hardening, email send worker, GitHub Actions CI/CD, additional tests, and comprehensive README.

**Architecture:** PostHog client-side provider + server-side Node SDK. Security via CSP strengthening, CORS utility, input sanitization. Email worker uses Resend SDK. CI/CD via GitHub Actions (ci.yml for PRs, deploy.yml for main). README documents the full project.

**Tech Stack:** PostHog (posthog-js, posthog-node), Resend, GitHub Actions, Vitest

---

### Task 1: PostHog Feature Flag Integration

**Files:**
- Create: `apps/web/src/lib/posthog.ts`
- Create: `apps/web/src/app/providers.tsx`
- Modify: `apps/web/src/app/layout.tsx`

- [ ] **Step 1: Create PostHog server + client setup**

Create `apps/web/src/lib/posthog.ts`:

```typescript
import { PostHog } from "posthog-node";

const globalForPosthog = globalThis as unknown as {
  posthogServer: PostHog | undefined;
};

export const posthogServer =
  globalForPosthog.posthogServer ??
  new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "", {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });

if (process.env.NODE_ENV !== "production") globalForPosthog.posthogServer = posthogServer;

export type FeatureFlag =
  | "feature-approval-workflow"
  | "feature-ai-insights"
  | "feature-white-label"
  | "feature-api-access";

export async function isFeatureEnabled(
  flag: FeatureFlag,
  distinctId: string,
  properties?: Record<string, unknown>
): Promise<boolean> {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return false;
  return posthogServer.isFeatureEnabled(flag, distinctId, {
    personProperties: properties,
  }) ?? false;
}
```

- [ ] **Step 2: Create PostHog client provider**

Create `apps/web/src/app/providers.tsx`:

```tsx
"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_POSTHOG_KEY &&
      typeof window !== "undefined"
    ) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
        capture_pageview: true,
        loaded: (ph) => {
          if (process.env.NODE_ENV === "development") ph.debug();
        },
      });
    }
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
```

- [ ] **Step 3: Wrap layout with providers**

Read `apps/web/src/app/layout.tsx` and wrap `{children}` with `<Providers>`:

Add import: `import { Providers } from "./providers";`

Wrap body children:
```tsx
<body className="min-h-screen bg-background antialiased">
  <Providers>{children}</Providers>
</body>
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/posthog.ts apps/web/src/app/providers.tsx apps/web/src/app/layout.tsx
git commit -m "feat: add PostHog feature flag integration with server and client SDKs"
```

---

### Task 2: Security Hardening

**Files:**
- Create: `apps/web/src/lib/cors.ts`
- Create: `packages/shared/src/sanitize.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Create CORS utility**

Create `apps/web/src/lib/cors.ts`:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
];

export function withCors(response: NextResponse, req: NextRequest): NextResponse {
  const origin = req.headers.get("origin");
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-request-id");
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}
```

- [ ] **Step 2: Create input sanitization helper**

Create `packages/shared/src/sanitize.ts`:

```typescript
/** Strip HTML tags from a string to prevent XSS in user-generated content */
export function sanitizeHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/** Sanitize an object's string values recursively */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key in result) {
    const value = result[key];
    if (typeof value === "string") {
      (result as Record<string, unknown>)[key] = sanitizeHtml(value);
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = sanitizeObject(
        value as Record<string, unknown>
      );
    }
  }
  return result;
}
```

- [ ] **Step 3: Export sanitize from shared index**

Add to `packages/shared/src/index.ts`:
```typescript
export { sanitizeHtml, sanitizeObject } from "./sanitize";
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/cors.ts packages/shared/src/sanitize.ts packages/shared/src/index.ts
git commit -m "feat: add CORS utility and input sanitization helpers for security hardening"
```

---

### Task 3: Email Send Worker Processor

**Files:**
- Create: `apps/worker/src/processors/email-send.ts`
- Modify: `apps/worker/src/index.ts`

- [ ] **Step 1: Install Resend in worker**

Run: `cd apps/worker && pnpm add resend`

- [ ] **Step 2: Create email send processor**

Create `apps/worker/src/processors/email-send.ts`:

```typescript
import type { Job } from "bullmq";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM ?? "AdPilot <noreply@adpilot.com>";

type EmailJobData = {
  type: "invitation" | "token-expired" | "payment-failed" | "weekly-digest";
  to: string;
  data: Record<string, string>;
};

const TEMPLATES: Record<string, (data: Record<string, string>) => { subject: string; html: string }> = {
  invitation: (data) => ({
    subject: `You've been invited to ${data.orgName} on AdPilot`,
    html: `<p>Hi,</p><p>You've been invited to join <strong>${data.orgName}</strong> as ${data.role}.</p><p><a href="${data.inviteUrl}">Accept Invitation</a></p><p>This link expires in 7 days.</p>`,
  }),
  "token-expired": (data) => ({
    subject: `${data.platform} connection expired — AdPilot`,
    html: `<p>Your <strong>${data.platform}</strong> connection for <strong>${data.orgName}</strong> has expired.</p><p><a href="${data.reconnectUrl}">Reconnect now</a> to continue publishing.</p>`,
  }),
  "payment-failed": (data) => ({
    subject: "Payment failed — AdPilot",
    html: `<p>We couldn't process your payment for <strong>${data.orgName}</strong>.</p><p>Please update your payment method within 3 days to avoid a plan downgrade.</p><p><a href="${data.billingUrl}">Update Payment</a></p>`,
  }),
  "weekly-digest": (data) => ({
    subject: `Weekly report — ${data.orgName} — AdPilot`,
    html: `<p>Here's your weekly summary for <strong>${data.orgName}</strong>:</p><ul><li>Posts published: ${data.postsPublished}</li><li>Total impressions: ${data.impressions}</li><li>Total engagement: ${data.engagement}</li></ul><p><a href="${data.dashboardUrl}">View Dashboard</a></p>`,
  }),
};

export async function processEmailSend(job: Job): Promise<void> {
  const { type, to, data } = job.data as EmailJobData;

  const template = TEMPLATES[type];
  if (!template) {
    console.error(`[email:send] Unknown email type: ${type}`);
    return;
  }

  const { subject, html } = template(data);

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    console.log(`[email:send] Sent ${type} email to ${to}:`, result);
  } catch (error) {
    console.error(`[email:send] Failed to send ${type} to ${to}:`, error);
    throw error; // Re-throw for BullMQ retry
  }
}
```

- [ ] **Step 3: Wire into worker**

Read `apps/worker/src/index.ts` and:

Add import: `import { processEmailSend } from "./processors/email-send";`

Replace: `createWorker("email:send", placeholderProcessor, 3)` with `createWorker("email:send", processEmailSend, 3)`

- [ ] **Step 4: Commit**

```bash
git add apps/worker
git commit -m "feat: add email send worker processor with Resend templates for 4 email types"
```

---

### Task 4: GitHub Actions CI/CD

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma client
        run: cd packages/db && npx prisma generate

      - name: Run tests
        run: pnpm test

      - name: Build
        run: pnpm build
```

- [ ] **Step 2: Create deploy workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      packages: write
      contents: read

    steps:
      - uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push web image
        uses: docker/build-push-action@v5
        with:
          context: .
          target: web
          push: true
          tags: ghcr.io/${{ github.repository }}/web:latest,ghcr.io/${{ github.repository }}/web:${{ github.sha }}

      - name: Build and push worker image
        uses: docker/build-push-action@v5
        with:
          context: .
          target: worker
          push: true
          tags: ghcr.io/${{ github.repository }}/worker:latest,ghcr.io/${{ github.repository }}/worker:${{ github.sha }}

      - name: Deploy to Proxmox
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.PROXMOX_HOST }}
          username: ${{ secrets.PROXMOX_USER }}
          key: ${{ secrets.PROXMOX_SSH_KEY }}
          script: |
            cd /opt/adpilot
            docker compose -f docker-compose.prod.yml pull web worker
            docker compose -f docker-compose.prod.yml up -d web worker
            docker image prune -f
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows
git commit -m "feat: add GitHub Actions CI/CD pipeline for testing and Proxmox deployment"
```

---

### Task 5: Sanitization Tests

**Files:**
- Create: `packages/shared/__tests__/sanitize.test.ts`

- [ ] **Step 1: Write sanitization tests**

Create `packages/shared/__tests__/sanitize.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { sanitizeHtml, sanitizeObject } from "../src/sanitize";

describe("sanitizeHtml", () => {
  it("should strip HTML tags", () => {
    expect(sanitizeHtml("<script>alert('xss')</script>Hello")).toBe("alert('xss')Hello");
  });

  it("should leave plain text unchanged", () => {
    expect(sanitizeHtml("Hello world")).toBe("Hello world");
  });

  it("should strip nested tags", () => {
    expect(sanitizeHtml("<div><p>Text</p></div>")).toBe("Text");
  });

  it("should handle empty string", () => {
    expect(sanitizeHtml("")).toBe("");
  });
});

describe("sanitizeObject", () => {
  it("should sanitize string values", () => {
    const result = sanitizeObject({ name: "<b>Bold</b>", age: 25 });
    expect(result.name).toBe("Bold");
    expect(result.age).toBe(25);
  });

  it("should handle nested objects", () => {
    const result = sanitizeObject({
      user: { name: "<script>x</script>Bob" },
    });
    expect((result.user as { name: string }).name).toBe("xBob");
  });
});
```

- [ ] **Step 2: Run tests**

Run: `cd packages/shared && pnpm test`
Expected: All tests pass (existing 46 + 6 new = 52)

- [ ] **Step 3: Commit**

```bash
git add packages/shared/__tests__/sanitize.test.ts
git commit -m "test: add sanitization tests for HTML stripping and object sanitization"
```

---

### Task 6: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create comprehensive README**

Create `README.md` at project root:

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add comprehensive README with architecture, quick start, and deployment guide"
```

---

### Task 7: Final Verification

- [ ] **Step 1: Run all tests**

Run: `cd /d/Claude/Projects/aimarketing && pnpm test`

- [ ] **Step 2: Final commit**

```bash
git add -A
git commit -m "feat: Phase 7 Production Hardening complete"
```

---

## Summary

**7 tasks, ~25 steps.** Phase 7 delivers:

- PostHog feature flag integration (server + client SDKs, provider wrapper)
- CORS utility for API route protection
- Input sanitization helpers with tests (6 new tests)
- Email send worker processor (Resend, 4 email templates)
- GitHub Actions CI pipeline (test + build on PR)
- GitHub Actions Deploy pipeline (GHCR + SSH to Proxmox)
- Comprehensive README with architecture, quick start, deployment guide
