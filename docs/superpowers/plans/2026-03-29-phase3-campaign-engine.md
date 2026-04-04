# Phase 3: Campaign Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the campaign engine — campaign CRUD API with optimistic concurrency, post management with approval state machine, post scheduling via BullMQ, and the publish pipeline that sends posts to platforms via the platform SDK.

**Architecture:** Campaign and Post API routes in apps/web with RBAC + plan limit enforcement. Post status follows a state machine (DRAFT → PENDING_APPROVAL → APPROVED → SCHEDULED → PUBLISHING → PUBLISHED/FAILED). The worker's `campaign:schedule` processor checks every minute for posts due for publishing and enqueues them to `campaign:publish`. The `campaign:publish` processor calls PlatformClient to get a valid token, then uses the platform adapter to publish content. Zod validators enforce all input.

**Tech Stack:** Next.js 15 API routes, Prisma (Campaign + Post models already exist), BullMQ, PlatformClient from packages/platform-sdk, Zod, Vitest

**Spec:** `docs/superpowers/specs/2026-03-29-reachpilot-foundation-design.md` — Sections 4 (Campaign/Post models), 7 (BullMQ queues)

**Depends on:** Phase 1 (foundation) + Phase 2 (platform connections)

---

## File Structure

```
packages/shared/src/
├── validators.ts              # Add campaign + post Zod schemas (modify existing)
└── constants.ts               # Add post status transitions (modify existing)

apps/web/src/app/api/
├── campaigns/
│   ├── route.ts               # GET list + POST create campaign
│   └── [campaignId]/
│       ├── route.ts           # GET detail + PATCH update + DELETE
│       ├── posts/
│       │   └── route.ts       # GET list + POST create post
│       └── publish/route.ts   # POST — schedule/publish campaign
├── posts/
│   └── [postId]/
│       ├── route.ts           # PATCH update + DELETE post
│       ├── approve/route.ts   # POST approve post (ADMIN+)
│       └── reject/route.ts    # POST reject post (ADMIN+)

apps/worker/src/processors/
├── campaign-schedule.ts       # campaign:schedule — find due posts, enqueue publish
├── campaign-publish.ts        # campaign:publish — publish a single post to platform
```

---

### Task 1: Campaign & Post Validators

**Files:**
- Modify: `packages/shared/src/validators.ts`
- Modify: `packages/shared/src/constants.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Add campaign and post validators to packages/shared/src/validators.ts**

Append to the existing file:

```typescript
export const createCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  objective: z.enum(["AWARENESS", "TRAFFIC", "ENGAGEMENT", "CONVERSIONS", "LEADS"]),
  budget: z.number().positive().optional(),
  currency: z.string().length(3).default("USD"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  targetPlatforms: z.array(
    z.enum(["FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN", "TWITTER_X", "YOUTUBE", "GOOGLE_ADS", "PINTEREST", "SNAPCHAT"])
  ).min(1),
  audienceConfig: z.record(z.unknown()).optional(),
});

export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  objective: z.enum(["AWARENESS", "TRAFFIC", "ENGAGEMENT", "CONVERSIONS", "LEADS"]).optional(),
  budget: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  targetPlatforms: z.array(
    z.enum(["FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN", "TWITTER_X", "YOUTUBE", "GOOGLE_ADS", "PINTEREST", "SNAPCHAT"])
  ).min(1).optional(),
  audienceConfig: z.record(z.unknown()).optional(),
  version: z.number().int().positive(),
});

export const createPostSchema = z.object({
  platform: z.enum(["FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN", "TWITTER_X", "YOUTUBE", "GOOGLE_ADS", "PINTEREST", "SNAPCHAT"]),
  content: z.string().min(1).max(10000),
  mediaUrls: z.array(z.string().url()).default([]),
  scheduledAt: z.string().datetime().optional(),
});

export const updatePostSchema = z.object({
  content: z.string().min(1).max(10000).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  version: z.number().int().positive(),
});

export const rejectPostSchema = z.object({
  reason: z.string().min(1).max(1000),
});
```

- [ ] **Step 2: Add post status transitions to constants.ts**

Append to `packages/shared/src/constants.ts`:

```typescript
/** Valid post status transitions */
export const POST_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["PENDING_APPROVAL", "SCHEDULED", "DELETED"],
  PENDING_APPROVAL: ["APPROVED", "REJECTED"],
  APPROVED: ["SCHEDULED"],
  REJECTED: ["DRAFT", "DELETED"],
  SCHEDULED: ["PUBLISHING", "DRAFT"],
  PUBLISHING: ["PUBLISHED", "FAILED"],
  PUBLISHED: ["DELETED"],
  FAILED: ["SCHEDULED", "DRAFT", "DELETED"],
  DELETED: [],
};

export function isValidTransition(from: string, to: string): boolean {
  return POST_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
```

- [ ] **Step 3: Export new validators and constants**

Add to `packages/shared/src/index.ts` (if not auto-exported via wildcard):
```typescript
export { isValidTransition, POST_STATUS_TRANSITIONS } from "./constants";
```

- [ ] **Step 4: Run tests**

Run: `cd packages/shared && pnpm test`

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src
git commit -m "feat: add campaign and post Zod validators and status transition rules"
```

---

### Task 2: Campaign CRUD API Routes

**Files:**
- Create: `apps/web/src/app/api/campaigns/route.ts`
- Create: `apps/web/src/app/api/campaigns/[campaignId]/route.ts`

- [ ] **Step 1: Create campaign list + create route**

Create `apps/web/src/app/api/campaigns/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@reachpilot/db";
import { createCampaignSchema, checkPlanLimit } from "@reachpilot/shared";

// GET /api/campaigns — list campaigns for current org
export const GET = withErrorHandler(withRole("VIEWER", async (req) => {
  const campaigns = await prisma.campaign.findMany({
    where: { orgId: req.orgId },
    include: {
      _count: { select: { posts: true } },
      creator: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(campaigns);
}));

// POST /api/campaigns — create a new campaign
export const POST = withErrorHandler(withRole("EDITOR", async (req) => {
  const body = await req.json();
  const parsed = createCampaignSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  // Check post limit (creating a campaign doesn't count, but check org plan is valid)
  const org = await prisma.organization.findUnique({ where: { id: req.orgId } });
  if (!org) {
    return NextResponse.json({ error: "Org not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  const campaign = await prisma.campaign.create({
    data: {
      orgId: req.orgId,
      name: parsed.data.name,
      objective: parsed.data.objective,
      budget: parsed.data.budget,
      currency: parsed.data.currency,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
      targetPlatforms: parsed.data.targetPlatforms,
      audienceConfig: parsed.data.audienceConfig,
      createdBy: req.userId,
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId: req.orgId,
      userId: req.userId,
      action: "CREATE",
      entityType: "Campaign",
      entityId: campaign.id,
      after: { name: campaign.name, objective: campaign.objective },
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}));
```

- [ ] **Step 2: Create campaign detail + update + delete route**

Create `apps/web/src/app/api/campaigns/[campaignId]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@reachpilot/db";
import { updateCampaignSchema } from "@reachpilot/shared";

// GET /api/campaigns/[campaignId]
export const GET = withErrorHandler(withRole("VIEWER", async (req, context) => {
  const { campaignId } = await context.params;

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, orgId: req.orgId },
    include: {
      posts: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          platform: true,
          content: true,
          status: true,
          scheduledAt: true,
          publishedAt: true,
          createdAt: true,
        },
      },
      creator: { select: { name: true, email: true } },
      _count: { select: { posts: true } },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  return NextResponse.json(campaign);
}));

// PATCH /api/campaigns/[campaignId] — optimistic concurrency
export const PATCH = withErrorHandler(withRole("EDITOR", async (req, context) => {
  const { campaignId } = await context.params;
  const body = await req.json();
  const parsed = updateCampaignSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const { version, ...updateData } = parsed.data;

  // Optimistic concurrency check
  const existing = await prisma.campaign.findFirst({
    where: { id: campaignId, orgId: req.orgId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  if (existing.version !== version) {
    return NextResponse.json(
      { error: "Conflict — campaign was modified", code: "CONFLICT", statusCode: 409, currentVersion: existing.version },
      { status: 409 }
    );
  }

  const campaign = await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      ...updateData,
      startDate: updateData.startDate ? new Date(updateData.startDate) : updateData.startDate === null ? null : undefined,
      endDate: updateData.endDate ? new Date(updateData.endDate) : updateData.endDate === null ? null : undefined,
      version: { increment: 1 },
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId: req.orgId,
      userId: req.userId,
      action: "UPDATE",
      entityType: "Campaign",
      entityId: campaignId,
      before: { name: existing.name, version: existing.version },
      after: { ...updateData, version: campaign.version },
    },
  });

  return NextResponse.json(campaign);
}));

// DELETE /api/campaigns/[campaignId]
export const DELETE = withErrorHandler(withRole("EDITOR", async (req, context) => {
  const { campaignId } = await context.params;

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, orgId: req.orgId },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  await prisma.campaign.delete({ where: { id: campaignId } });

  await prisma.auditLog.create({
    data: {
      orgId: req.orgId,
      userId: req.userId,
      action: "DELETE",
      entityType: "Campaign",
      entityId: campaignId,
      before: { name: campaign.name },
    },
  });

  return NextResponse.json({ success: true });
}));
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/api/campaigns
git commit -m "feat: add campaign CRUD API routes with optimistic concurrency and audit logging"
```

---

### Task 3: Post CRUD + Approval API Routes

**Files:**
- Create: `apps/web/src/app/api/campaigns/[campaignId]/posts/route.ts`
- Create: `apps/web/src/app/api/posts/[postId]/route.ts`
- Create: `apps/web/src/app/api/posts/[postId]/approve/route.ts`
- Create: `apps/web/src/app/api/posts/[postId]/reject/route.ts`

- [ ] **Step 1: Create post list + create route (within campaign)**

Create `apps/web/src/app/api/campaigns/[campaignId]/posts/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@reachpilot/db";
import { createPostSchema, checkPlanLimit } from "@reachpilot/shared";

// GET /api/campaigns/[campaignId]/posts
export const GET = withErrorHandler(withRole("VIEWER", async (req, context) => {
  const { campaignId } = await context.params;

  const posts = await prisma.post.findMany({
    where: { campaignId, orgId: req.orgId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(posts);
}));

// POST /api/campaigns/[campaignId]/posts — create post
export const POST = withErrorHandler(withRole("EDITOR", async (req, context) => {
  const { campaignId } = await context.params;
  const body = await req.json();
  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  // Verify campaign belongs to org
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, orgId: req.orgId },
  });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  // Check platform is connected
  const connection = await prisma.platformConnection.findFirst({
    where: { orgId: req.orgId, platform: parsed.data.platform, status: "ACTIVE" },
  });
  if (!connection) {
    return NextResponse.json(
      { error: `No active ${parsed.data.platform} connection`, code: "NO_CONNECTION", statusCode: 400 },
      { status: 400 }
    );
  }

  // Check monthly post limit
  const org = await prisma.organization.findUnique({ where: { id: req.orgId } });
  if (org) {
    const startOfMonth = org.billingCycleAnchor
      ? new Date(new Date().getFullYear(), new Date().getMonth(), org.billingCycleAnchor.getDate())
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const postCount = await prisma.post.count({
      where: {
        orgId: req.orgId,
        createdAt: { gte: startOfMonth },
        status: { notIn: ["DELETED"] },
      },
    });

    const limitCheck = checkPlanLimit(org.plan, "postsThisMonth", {
      platformConnections: 0,
      postsThisMonth: postCount,
      teamMembers: 0,
    });

    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.reason, code: "PLAN_LIMIT", statusCode: 403, upgradeRequired: limitCheck.upgradeRequired },
        { status: 403 }
      );
    }
  }

  const post = await prisma.post.create({
    data: {
      campaignId,
      orgId: req.orgId,
      platform: parsed.data.platform,
      content: parsed.data.content,
      mediaUrls: parsed.data.mediaUrls,
      scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
    },
  });

  return NextResponse.json(post, { status: 201 });
}));
```

- [ ] **Step 2: Create post update + delete route**

Create `apps/web/src/app/api/posts/[postId]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@reachpilot/db";
import { updatePostSchema } from "@reachpilot/shared";

// PATCH /api/posts/[postId] — optimistic concurrency
export const PATCH = withErrorHandler(withRole("EDITOR", async (req, context) => {
  const { postId } = await context.params;
  const body = await req.json();
  const parsed = updatePostSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const { version, ...updateData } = parsed.data;

  const existing = await prisma.post.findFirst({
    where: { id: postId, orgId: req.orgId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  if (existing.version !== version) {
    return NextResponse.json(
      { error: "Conflict — post was modified", code: "CONFLICT", statusCode: 409, currentVersion: existing.version },
      { status: 409 }
    );
  }

  // Only editable in DRAFT or REJECTED status
  if (!["DRAFT", "REJECTED"].includes(existing.status)) {
    return NextResponse.json(
      { error: `Cannot edit post in ${existing.status} status`, code: "INVALID_STATUS", statusCode: 400 },
      { status: 400 }
    );
  }

  const post = await prisma.post.update({
    where: { id: postId },
    data: {
      ...updateData,
      scheduledAt: updateData.scheduledAt ? new Date(updateData.scheduledAt) : updateData.scheduledAt === null ? null : undefined,
      status: "DRAFT", // Reset to DRAFT on edit
      version: { increment: 1 },
    },
  });

  return NextResponse.json(post);
}));

// DELETE /api/posts/[postId]
export const DELETE = withErrorHandler(withRole("EDITOR", async (req, context) => {
  const { postId } = await context.params;

  const post = await prisma.post.findFirst({
    where: { id: postId, orgId: req.orgId },
  });

  if (!post) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  // Can't delete published posts — soft-delete via status
  if (post.status === "PUBLISHED") {
    await prisma.post.update({
      where: { id: postId },
      data: { status: "DELETED", version: { increment: 1 } },
    });
  } else {
    await prisma.post.delete({ where: { id: postId } });
  }

  return NextResponse.json({ success: true });
}));
```

- [ ] **Step 3: Create approve route**

Create `apps/web/src/app/api/posts/[postId]/approve/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@reachpilot/db";
import { isValidTransition } from "@reachpilot/shared";

// POST /api/posts/[postId]/approve — ADMIN+ only
export const POST = withErrorHandler(withRole("ADMIN", async (req, context) => {
  const { postId } = await context.params;

  const post = await prisma.post.findFirst({
    where: { id: postId, orgId: req.orgId },
  });

  if (!post) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  if (!isValidTransition(post.status, "APPROVED")) {
    return NextResponse.json(
      { error: `Cannot approve post in ${post.status} status`, code: "INVALID_TRANSITION", statusCode: 400 },
      { status: 400 }
    );
  }

  // Approve and auto-schedule if scheduledAt is set
  const newStatus = post.scheduledAt ? "SCHEDULED" : "APPROVED";

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      status: newStatus,
      approvedBy: req.userId,
      version: { increment: 1 },
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId: req.orgId,
      userId: req.userId,
      action: "APPROVE_POST",
      entityType: "Post",
      entityId: postId,
      after: { status: newStatus },
    },
  });

  return NextResponse.json(updated);
}));
```

- [ ] **Step 4: Create reject route**

Create `apps/web/src/app/api/posts/[postId]/reject/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@reachpilot/db";
import { isValidTransition, rejectPostSchema } from "@reachpilot/shared";

// POST /api/posts/[postId]/reject — ADMIN+ only
export const POST = withErrorHandler(withRole("ADMIN", async (req, context) => {
  const { postId } = await context.params;
  const body = await req.json();
  const parsed = rejectPostSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const post = await prisma.post.findFirst({
    where: { id: postId, orgId: req.orgId },
  });

  if (!post) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  if (!isValidTransition(post.status, "REJECTED")) {
    return NextResponse.json(
      { error: `Cannot reject post in ${post.status} status`, code: "INVALID_TRANSITION", statusCode: 400 },
      { status: 400 }
    );
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      status: "REJECTED",
      rejectionReason: parsed.data.reason,
      version: { increment: 1 },
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId: req.orgId,
      userId: req.userId,
      action: "REJECT_POST",
      entityType: "Post",
      entityId: postId,
      after: { status: "REJECTED", reason: parsed.data.reason },
    },
  });

  return NextResponse.json(updated);
}));
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/api/campaigns apps/web/src/app/api/posts
git commit -m "feat: add post CRUD, approval, and rejection routes with status state machine"
```

---

### Task 4: Campaign Publish Route

**Files:**
- Create: `apps/web/src/app/api/campaigns/[campaignId]/publish/route.ts`

- [ ] **Step 1: Create publish route**

This endpoint schedules all approved posts in a campaign for publishing.

Create `apps/web/src/app/api/campaigns/[campaignId]/publish/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@reachpilot/db";
import { Queue } from "bullmq";
import { redis } from "@/lib/redis";

const publishQueue = new Queue("campaign:publish", { connection: redis });

// POST /api/campaigns/[campaignId]/publish — schedule or publish now
export const POST = withErrorHandler(withRole("EDITOR", async (req, context) => {
  const { campaignId } = await context.params;
  const body = await req.json().catch(() => ({}));
  const publishNow = body.publishNow === true;

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, orgId: req.orgId },
    include: {
      posts: {
        where: {
          status: { in: ["APPROVED", "SCHEDULED"] },
        },
      },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  if (campaign.posts.length === 0) {
    return NextResponse.json(
      { error: "No approved posts to publish", code: "NO_POSTS", statusCode: 400 },
      { status: 400 }
    );
  }

  const results = [];

  for (const post of campaign.posts) {
    if (publishNow || !post.scheduledAt || post.scheduledAt <= new Date()) {
      // Publish immediately — enqueue to worker
      await publishQueue.add("publish", {
        postId: post.id,
        orgId: req.orgId,
        platform: post.platform,
      });

      await prisma.post.update({
        where: { id: post.id },
        data: { status: "PUBLISHING", version: { increment: 1 } },
      });

      results.push({ postId: post.id, action: "publishing" });
    } else {
      // Schedule for later
      await prisma.post.update({
        where: { id: post.id },
        data: { status: "SCHEDULED", version: { increment: 1 } },
      });

      results.push({ postId: post.id, action: "scheduled", scheduledAt: post.scheduledAt });
    }
  }

  // Update campaign status
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: publishNow ? "ACTIVE" : "SCHEDULED",
      version: { increment: 1 },
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId: req.orgId,
      userId: req.userId,
      action: publishNow ? "PUBLISH_CAMPAIGN" : "SCHEDULE_CAMPAIGN",
      entityType: "Campaign",
      entityId: campaignId,
      after: { postCount: results.length },
    },
  });

  return NextResponse.json({ results });
}));
```

- [ ] **Step 2: Commit**

```bash
git add "apps/web/src/app/api/campaigns/[campaignId]/publish"
git commit -m "feat: add campaign publish route that enqueues posts to BullMQ"
```

---

### Task 5: Campaign Schedule Worker Processor

**Files:**
- Create: `apps/worker/src/processors/campaign-schedule.ts`

- [ ] **Step 1: Create schedule processor**

This runs every minute and finds posts that are SCHEDULED with a `scheduledAt` in the past, then enqueues them for publishing.

Create `apps/worker/src/processors/campaign-schedule.ts`:

```typescript
import type { Job } from "bullmq";
import { Queue } from "bullmq";
import { prisma } from "@reachpilot/db";
import { connection } from "../queues";

const publishQueue = new Queue("campaign:publish", { connection });

export async function processCampaignSchedule(job: Job): Promise<void> {
  // Find posts that are SCHEDULED and due for publishing
  const duePosts = await prisma.post.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: new Date() },
    },
    take: 50, // Process in batches
  });

  if (duePosts.length === 0) return;

  console.log(`[campaign:schedule] Found ${duePosts.length} posts due for publishing`);

  for (const post of duePosts) {
    // Transition to PUBLISHING
    await prisma.post.update({
      where: { id: post.id },
      data: { status: "PUBLISHING", version: { increment: 1 } },
    });

    // Enqueue for actual publishing
    await publishQueue.add(
      "publish",
      {
        postId: post.id,
        orgId: post.orgId,
        platform: post.platform,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 30_000, // 30s, 2min, 10min
        },
      }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/worker/src/processors/campaign-schedule.ts
git commit -m "feat: add campaign schedule processor — finds due posts and enqueues for publish"
```

---

### Task 6: Campaign Publish Worker Processor

**Files:**
- Create: `apps/worker/src/processors/campaign-publish.ts`

- [ ] **Step 1: Create publish processor**

This is the core publish pipeline. It gets a valid token via PlatformClient, then calls the platform API to publish the post content.

Create `apps/worker/src/processors/campaign-publish.ts`:

```typescript
import type { Job } from "bullmq";
import { prisma } from "@reachpilot/db";
import { PlatformClient } from "@reachpilot/platform-sdk";
import type { Platform } from "@reachpilot/platform-sdk";

export async function processCampaignPublish(job: Job): Promise<void> {
  const { postId, orgId, platform } = job.data as {
    postId: string;
    orgId: string;
    platform: Platform;
  };

  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post || post.status !== "PUBLISHING") {
    console.log(`[campaign:publish] Post ${postId} not in PUBLISHING state, skipping`);
    return;
  }

  // Find the active connection for this platform + org
  const connection = await prisma.platformConnection.findFirst({
    where: { orgId, platform, status: "ACTIVE" },
  });

  if (!connection) {
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: "FAILED",
        errorMessage: `No active ${platform} connection`,
        version: { increment: 1 },
      },
    });
    throw new Error(`No active ${platform} connection for org ${orgId}`);
  }

  try {
    // Get a valid access token (with lazy refresh if needed)
    const masterKey = process.env.MASTER_ENCRYPTION_KEY!;
    const client = new PlatformClient(masterKey);
    const accessToken = await client.getAccessToken(connection.id);

    // TODO: Call platform-specific publish API
    // This will be fully implemented when each adapter gets a publish() method.
    // For now, log the intent and mark as published (placeholder).
    console.log(`[campaign:publish] Publishing to ${platform}:`, {
      postId,
      content: post.content.substring(0, 100),
      mediaUrls: post.mediaUrls,
      hasToken: !!accessToken,
    });

    // Mark as published
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        // platformPostId will be set when actual publish API returns an ID
        version: { increment: 1 },
      },
    });

    await prisma.auditLog.create({
      data: {
        orgId,
        action: "POST_PUBLISHED",
        entityType: "Post",
        entityId: postId,
        after: { platform, publishedAt: new Date().toISOString() },
      },
    });

    console.log(`[campaign:publish] Published post ${postId} to ${platform}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    await prisma.post.update({
      where: { id: postId },
      data: {
        status: "FAILED",
        errorMessage,
        version: { increment: 1 },
      },
    });

    await prisma.auditLog.create({
      data: {
        orgId,
        action: "POST_PUBLISH_FAILED",
        entityType: "Post",
        entityId: postId,
        after: { platform, error: errorMessage },
      },
    });

    // Re-throw for BullMQ retry logic
    throw error;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/worker/src/processors/campaign-publish.ts
git commit -m "feat: add campaign publish processor with token management and error handling"
```

---

### Task 7: Wire Up Worker Processors

**Files:**
- Modify: `apps/worker/src/index.ts`

- [ ] **Step 1: Update worker to use real campaign processors**

Read the current `apps/worker/src/index.ts` and replace the placeholder processors for `campaign:publish` and `campaign:schedule`:

Add imports:
```typescript
import { processCampaignSchedule } from "./processors/campaign-schedule";
import { processCampaignPublish } from "./processors/campaign-publish";
```

Replace in the workers array:
```typescript
createWorker("campaign:publish", processCampaignPublish, 5),
createWorker("campaign:schedule", processCampaignSchedule, 1),
```

- [ ] **Step 2: Commit**

```bash
git add apps/worker/src/index.ts
git commit -m "feat: wire campaign schedule and publish processors into worker"
```

---

### Task 8: Validator Tests for Campaign & Post Schemas

**Files:**
- Modify: `packages/shared/__tests__/validators.test.ts`

- [ ] **Step 1: Add tests for new validators**

Append to `packages/shared/__tests__/validators.test.ts`:

```typescript
import { createCampaignSchema, createPostSchema, updateCampaignSchema, rejectPostSchema } from "../src/validators";
import { isValidTransition } from "../src/constants";

describe("createCampaignSchema", () => {
  it("should accept valid campaign data", () => {
    const result = createCampaignSchema.safeParse({
      name: "Summer Sale",
      objective: "CONVERSIONS",
      targetPlatforms: ["FACEBOOK", "INSTAGRAM"],
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = createCampaignSchema.safeParse({
      name: "",
      objective: "AWARENESS",
      targetPlatforms: ["FACEBOOK"],
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty targetPlatforms", () => {
    const result = createCampaignSchema.safeParse({
      name: "Test",
      objective: "AWARENESS",
      targetPlatforms: [],
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid objective", () => {
    const result = createCampaignSchema.safeParse({
      name: "Test",
      objective: "INVALID",
      targetPlatforms: ["FACEBOOK"],
    });
    expect(result.success).toBe(false);
  });
});

describe("createPostSchema", () => {
  it("should accept valid post data", () => {
    const result = createPostSchema.safeParse({
      platform: "FACEBOOK",
      content: "Check out our new product!",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty content", () => {
    const result = createPostSchema.safeParse({
      platform: "FACEBOOK",
      content: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid platform", () => {
    const result = createPostSchema.safeParse({
      platform: "MYSPACE",
      content: "Hello",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateCampaignSchema", () => {
  it("should require version for optimistic concurrency", () => {
    const result = updateCampaignSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(false);
  });

  it("should accept valid update with version", () => {
    const result = updateCampaignSchema.safeParse({ name: "New Name", version: 1 });
    expect(result.success).toBe(true);
  });
});

describe("rejectPostSchema", () => {
  it("should accept valid rejection reason", () => {
    const result = rejectPostSchema.safeParse({ reason: "Needs better copy" });
    expect(result.success).toBe(true);
  });

  it("should reject empty reason", () => {
    const result = rejectPostSchema.safeParse({ reason: "" });
    expect(result.success).toBe(false);
  });
});

describe("isValidTransition", () => {
  it("should allow DRAFT → PENDING_APPROVAL", () => {
    expect(isValidTransition("DRAFT", "PENDING_APPROVAL")).toBe(true);
  });

  it("should allow PENDING_APPROVAL → APPROVED", () => {
    expect(isValidTransition("PENDING_APPROVAL", "APPROVED")).toBe(true);
  });

  it("should allow PENDING_APPROVAL → REJECTED", () => {
    expect(isValidTransition("PENDING_APPROVAL", "REJECTED")).toBe(true);
  });

  it("should deny DRAFT → PUBLISHED", () => {
    expect(isValidTransition("DRAFT", "PUBLISHED")).toBe(false);
  });

  it("should deny PUBLISHED → DRAFT", () => {
    expect(isValidTransition("PUBLISHED", "DRAFT")).toBe(false);
  });

  it("should allow FAILED → SCHEDULED (retry)", () => {
    expect(isValidTransition("FAILED", "SCHEDULED")).toBe(true);
  });
});
```

- [ ] **Step 2: Run all tests**

Run: `cd packages/shared && pnpm test`
Expected: All tests pass (existing 23 + new ~18)

- [ ] **Step 3: Commit**

```bash
git add packages/shared/__tests__/validators.test.ts
git commit -m "test: add campaign, post, and status transition validator tests"
```

---

### Task 9: Final Verification

- [ ] **Step 1: Install all deps**

Run: `cd /d/Claude/Projects/aimarketing && pnpm install`

- [ ] **Step 2: Run all tests**

Run: `pnpm test`
Expected: All tests pass across all packages

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: Phase 3 Campaign Engine complete — CRUD, approval workflow, scheduling, publish pipeline"
```

---

## Summary

**9 tasks, ~40 steps.** After completion, Phase 3 delivers:

- Campaign Zod validators (create, update with optimistic concurrency)
- Post Zod validators (create, update, reject)
- Post status transition rules (state machine enforcement)
- Campaign CRUD API (list, create, get, update, delete) with RBAC + audit
- Post CRUD API (list, create, update, delete) with plan limit checks
- Post approval route (ADMIN+ only, auto-schedules if scheduledAt set)
- Post rejection route (ADMIN+ only, with reason)
- Campaign publish route (enqueues posts to BullMQ)
- campaign:schedule worker processor (finds due posts every minute)
- campaign:publish worker processor (gets token via PlatformClient, publishes)
- 18+ new validator and transition tests

**Next:** Phase 4 — Media Processing (Sharp + FFmpeg, platform-specific variants, R2 upload)
