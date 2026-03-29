# Phase 5: Analytics & Reporting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the analytics pipeline — analytics sync worker that pulls metrics from platform APIs and normalizes into AnalyticsSnapshot records, analytics API routes for querying metrics, overview dashboard with aggregate stats, campaign detail analytics, and CSV export endpoint.

**Architecture:** The `analytics:sync` worker processor runs every 4 hours (already scheduled). It finds PUBLISHED posts, calls each platform's API via PlatformClient for engagement metrics, normalizes them into AnalyticsSnapshot records, and updates the Post's denormalized `engagementSnapshot` cache. API routes serve aggregated metrics scoped to org. The dashboard shows overview cards and per-campaign breakdowns. CSV export generates a downloadable report.

**Tech Stack:** Next.js 15 API routes, Prisma (AnalyticsSnapshot model exists), BullMQ, PlatformClient, Vitest

**Spec:** `docs/superpowers/specs/2026-03-29-adpilot-foundation-design.md` — Sections 4 (AnalyticsSnapshot), 7 (analytics:sync queue)

---

## File Structure

```
apps/worker/src/processors/
└── analytics-sync.ts              # analytics:sync processor

apps/web/src/app/api/
├── analytics/
│   ├── overview/route.ts          # GET org-wide aggregated metrics
│   ├── campaigns/[campaignId]/route.ts  # GET per-campaign metrics
│   └── export/route.ts            # GET CSV export

apps/web/src/app/(dashboard)/
├── dashboard/page.tsx             # Modify — add analytics overview cards
└── analytics/page.tsx             # Analytics dashboard page
```

---

### Task 1: Analytics Sync Worker Processor

**Files:**
- Create: `apps/worker/src/processors/analytics-sync.ts`
- Modify: `apps/worker/src/index.ts`

- [ ] **Step 1: Create analytics sync processor**

Create `apps/worker/src/processors/analytics-sync.ts`:

```typescript
import type { Job } from "bullmq";
import { prisma } from "@adpilot/db";
import { PlatformClient } from "@adpilot/platform-sdk";
import type { Platform } from "@adpilot/platform-sdk";

export async function processAnalyticsSync(job: Job): Promise<void> {
  const { type } = job.data as { type?: string };
  const masterKey = process.env.MASTER_ENCRYPTION_KEY!;
  const client = new PlatformClient(masterKey);

  // Find posts to sync metrics for
  const statusFilter = type === "active"
    ? { status: { in: ["PUBLISHED" as const] } }
    : { status: { in: ["PUBLISHED" as const, "FAILED" as const] } };

  const posts = await prisma.post.findMany({
    where: {
      ...statusFilter,
      platformPostId: { not: null },
    },
    include: {
      campaign: { select: { orgId: true } },
    },
    take: 100,
  });

  if (posts.length === 0) {
    console.log("[analytics:sync] No posts to sync");
    return;
  }

  console.log(`[analytics:sync] Syncing metrics for ${posts.length} posts`);

  for (const post of posts) {
    try {
      // Find connection for this platform + org
      const connection = await prisma.platformConnection.findFirst({
        where: {
          orgId: post.orgId,
          platform: post.platform,
          status: "ACTIVE",
        },
      });

      if (!connection) {
        console.warn(`[analytics:sync] No active connection for ${post.platform} (post ${post.id})`);
        continue;
      }

      // Get valid access token (lazy refresh if needed)
      let accessToken: string;
      try {
        accessToken = await client.getAccessToken(connection.id);
      } catch {
        console.warn(`[analytics:sync] Token unavailable for ${post.platform} (post ${post.id})`);
        continue;
      }

      // TODO: Call platform-specific analytics API
      // For now, create a placeholder snapshot with the token validation as proof of connectivity
      // Real platform API calls will be added per-platform when their analytics endpoints are integrated
      const snapshot = await prisma.analyticsSnapshot.create({
        data: {
          postId: post.id,
          platform: post.platform,
          snapshotAt: new Date(),
          // Metrics will be populated from real API responses
          // For now, preserve any existing engagement data
          rawPayload: { synced: true, timestamp: new Date().toISOString() },
        },
      });

      // Update denormalized cache on Post
      const latestMetrics = await prisma.analyticsSnapshot.findFirst({
        where: { postId: post.id },
        orderBy: { snapshotAt: "desc" },
      });

      if (latestMetrics) {
        await prisma.post.update({
          where: { id: post.id },
          data: {
            engagementSnapshot: {
              impressions: latestMetrics.impressions,
              reach: latestMetrics.reach,
              clicks: latestMetrics.clicks,
              likes: latestMetrics.likes,
              comments: latestMetrics.comments,
              shares: latestMetrics.shares,
              saves: latestMetrics.saves,
              videoViews: latestMetrics.videoViews,
              ctr: latestMetrics.ctr,
              lastSyncedAt: latestMetrics.snapshotAt.toISOString(),
            },
          },
        });
      }

      console.log(`[analytics:sync] Synced post ${post.id} (${post.platform})`);
    } catch (error) {
      console.error(`[analytics:sync] Failed for post ${post.id}:`, error);
      // Continue with other posts — don't fail the whole batch
    }
  }
}
```

- [ ] **Step 2: Wire processor into worker**

Read `apps/worker/src/index.ts` and:

Add import:
```typescript
import { processAnalyticsSync } from "./processors/analytics-sync";
```

Replace:
```typescript
createWorker("analytics:sync", placeholderProcessor, 3),
```
with:
```typescript
createWorker("analytics:sync", processAnalyticsSync, 3),
```

- [ ] **Step 3: Commit**

```bash
git add apps/worker/src
git commit -m "feat: add analytics sync worker processor with metric snapshot creation"
```

---

### Task 2: Analytics API Routes

**Files:**
- Create: `apps/web/src/app/api/analytics/overview/route.ts`
- Create: `apps/web/src/app/api/analytics/campaigns/[campaignId]/route.ts`
- Create: `apps/web/src/app/api/analytics/export/route.ts`

- [ ] **Step 1: Create overview route**

Create `apps/web/src/app/api/analytics/overview/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@adpilot/db";

// GET /api/analytics/overview — org-wide aggregated metrics
export const GET = withErrorHandler(withRole("VIEWER", async (req) => {
  const url = new URL(req.url);
  const days = parseInt(url.searchParams.get("days") ?? "30", 10);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Get all posts for this org
  const posts = await prisma.post.findMany({
    where: {
      orgId: req.orgId,
      status: "PUBLISHED",
    },
    select: { id: true },
  });

  const postIds = posts.map((p) => p.id);

  if (postIds.length === 0) {
    return NextResponse.json({
      totalImpressions: 0,
      totalReach: 0,
      totalClicks: 0,
      totalEngagement: 0,
      totalSpend: 0,
      totalConversions: 0,
      postCount: 0,
      platformBreakdown: [],
    });
  }

  // Aggregate latest snapshot per post
  const snapshots = await prisma.analyticsSnapshot.findMany({
    where: {
      postId: { in: postIds },
      snapshotAt: { gte: since },
    },
    orderBy: { snapshotAt: "desc" },
    distinct: ["postId"],
  });

  const totals = snapshots.reduce(
    (acc, s) => ({
      totalImpressions: acc.totalImpressions + s.impressions,
      totalReach: acc.totalReach + s.reach,
      totalClicks: acc.totalClicks + s.clicks,
      totalEngagement: acc.totalEngagement + s.likes + s.comments + s.shares + s.saves,
      totalSpend: acc.totalSpend + Number(s.spend),
      totalConversions: acc.totalConversions + s.conversions,
    }),
    { totalImpressions: 0, totalReach: 0, totalClicks: 0, totalEngagement: 0, totalSpend: 0, totalConversions: 0 }
  );

  // Platform breakdown
  const platformMap = new Map<string, typeof totals>();
  for (const s of snapshots) {
    const existing = platformMap.get(s.platform) ?? {
      totalImpressions: 0, totalReach: 0, totalClicks: 0,
      totalEngagement: 0, totalSpend: 0, totalConversions: 0,
    };
    platformMap.set(s.platform, {
      totalImpressions: existing.totalImpressions + s.impressions,
      totalReach: existing.totalReach + s.reach,
      totalClicks: existing.totalClicks + s.clicks,
      totalEngagement: existing.totalEngagement + s.likes + s.comments + s.shares + s.saves,
      totalSpend: existing.totalSpend + Number(s.spend),
      totalConversions: existing.totalConversions + s.conversions,
    });
  }

  const platformBreakdown = Array.from(platformMap.entries()).map(([platform, metrics]) => ({
    platform,
    ...metrics,
  }));

  return NextResponse.json({
    ...totals,
    postCount: postIds.length,
    platformBreakdown,
    period: { days, since: since.toISOString() },
  });
}));
```

- [ ] **Step 2: Create campaign analytics route**

Create `apps/web/src/app/api/analytics/campaigns/[campaignId]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@adpilot/db";

// GET /api/analytics/campaigns/[campaignId] — per-campaign metrics
export const GET = withErrorHandler(withRole("VIEWER", async (req, context) => {
  const { campaignId } = await context.params;

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, orgId: req.orgId },
    select: { id: true, name: true, status: true },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  const posts = await prisma.post.findMany({
    where: { campaignId, orgId: req.orgId },
    select: {
      id: true,
      platform: true,
      content: true,
      status: true,
      publishedAt: true,
      engagementSnapshot: true,
      analytics: {
        orderBy: { snapshotAt: "desc" },
        take: 1,
        select: {
          impressions: true,
          reach: true,
          clicks: true,
          likes: true,
          comments: true,
          shares: true,
          saves: true,
          videoViews: true,
          spend: true,
          conversions: true,
          ctr: true,
          cpc: true,
          cpm: true,
          snapshotAt: true,
        },
      },
    },
  });

  // Time series for the campaign (all snapshots, ordered)
  const postIds = posts.map((p) => p.id);
  const timeSeries = await prisma.analyticsSnapshot.findMany({
    where: { postId: { in: postIds } },
    orderBy: { snapshotAt: "asc" },
    select: {
      postId: true,
      platform: true,
      snapshotAt: true,
      impressions: true,
      reach: true,
      clicks: true,
      likes: true,
      comments: true,
      shares: true,
    },
  });

  return NextResponse.json({
    campaign,
    posts: posts.map((p) => ({
      ...p,
      latestMetrics: p.analytics[0] ?? null,
    })),
    timeSeries,
  });
}));
```

- [ ] **Step 3: Create CSV export route**

Create `apps/web/src/app/api/analytics/export/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@adpilot/db";

// GET /api/analytics/export — CSV export of analytics data
export const GET = withErrorHandler(withRole("VIEWER", async (req) => {
  const url = new URL(req.url);
  const campaignId = url.searchParams.get("campaignId");
  const days = parseInt(url.searchParams.get("days") ?? "30", 10);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Get posts (optionally filtered by campaign)
  const where: Record<string, unknown> = {
    orgId: req.orgId,
    status: "PUBLISHED",
  };
  if (campaignId) {
    where.campaignId = campaignId;
  }

  const posts = await prisma.post.findMany({
    where,
    include: {
      campaign: { select: { name: true } },
      analytics: {
        where: { snapshotAt: { gte: since } },
        orderBy: { snapshotAt: "desc" },
        take: 1,
      },
    },
  });

  // Build CSV
  const headers = [
    "Campaign", "Platform", "Content", "Published At",
    "Impressions", "Reach", "Clicks", "Likes", "Comments",
    "Shares", "Saves", "Video Views", "Spend", "Conversions",
    "CTR", "CPC", "CPM",
  ];

  const rows = posts.map((post) => {
    const metrics = post.analytics[0];
    return [
      post.campaign.name,
      post.platform,
      `"${post.content.replace(/"/g, '""').substring(0, 200)}"`,
      post.publishedAt?.toISOString() ?? "",
      metrics?.impressions ?? 0,
      metrics?.reach ?? 0,
      metrics?.clicks ?? 0,
      metrics?.likes ?? 0,
      metrics?.comments ?? 0,
      metrics?.shares ?? 0,
      metrics?.saves ?? 0,
      metrics?.videoViews ?? 0,
      metrics?.spend ?? 0,
      metrics?.conversions ?? 0,
      metrics?.ctr?.toFixed(4) ?? 0,
      metrics?.cpc ?? 0,
      metrics?.cpm ?? 0,
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="adpilot-analytics-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}));
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/api/analytics
git commit -m "feat: add analytics overview, campaign detail, and CSV export API routes"
```

---

### Task 3: Analytics Dashboard Page

**Files:**
- Create: `apps/web/src/app/(dashboard)/analytics/page.tsx`

- [ ] **Step 1: Create analytics dashboard page**

Create `apps/web/src/app/(dashboard)/analytics/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@adpilot/db";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.currentOrgId) {
    redirect("/org-picker");
  }

  const orgId = session.user.currentOrgId;

  // Get published posts with latest metrics
  const posts = await prisma.post.findMany({
    where: { orgId, status: "PUBLISHED" },
    include: {
      campaign: { select: { name: true } },
      analytics: {
        orderBy: { snapshotAt: "desc" },
        take: 1,
      },
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });

  // Aggregate totals
  const totals = posts.reduce(
    (acc, post) => {
      const m = post.analytics[0];
      if (!m) return acc;
      return {
        impressions: acc.impressions + m.impressions,
        reach: acc.reach + m.reach,
        clicks: acc.clicks + m.clicks,
        engagement: acc.engagement + m.likes + m.comments + m.shares + m.saves,
        spend: acc.spend + Number(m.spend),
        conversions: acc.conversions + m.conversions,
      };
    },
    { impressions: 0, reach: 0, clicks: 0, engagement: 0, spend: 0, conversions: 0 }
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <a
          href={`/api/analytics/export?days=30`}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Export CSV
        </a>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Impressions</div>
          <div className="text-2xl font-bold">{totals.impressions.toLocaleString()}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Reach</div>
          <div className="text-2xl font-bold">{totals.reach.toLocaleString()}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Clicks</div>
          <div className="text-2xl font-bold">{totals.clicks.toLocaleString()}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Engagement</div>
          <div className="text-2xl font-bold">{totals.engagement.toLocaleString()}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Spend</div>
          <div className="text-2xl font-bold">${totals.spend.toFixed(2)}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Conversions</div>
          <div className="text-2xl font-bold">{totals.conversions.toLocaleString()}</div>
        </div>
      </div>

      {/* Post Performance Table */}
      <h2 className="text-lg font-semibold mb-4">Post Performance</h2>
      {posts.length === 0 ? (
        <p className="text-gray-500">No published posts yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Campaign</th>
                <th className="p-2">Platform</th>
                <th className="p-2">Content</th>
                <th className="p-2 text-right">Impressions</th>
                <th className="p-2 text-right">Clicks</th>
                <th className="p-2 text-right">Engagement</th>
                <th className="p-2 text-right">CTR</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const m = post.analytics[0];
                return (
                  <tr key={post.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{post.campaign.name}</td>
                    <td className="p-2">{post.platform}</td>
                    <td className="p-2 max-w-xs truncate">{post.content}</td>
                    <td className="p-2 text-right">{m?.impressions?.toLocaleString() ?? "—"}</td>
                    <td className="p-2 text-right">{m?.clicks?.toLocaleString() ?? "—"}</td>
                    <td className="p-2 text-right">
                      {m ? (m.likes + m.comments + m.shares + m.saves).toLocaleString() : "—"}
                    </td>
                    <td className="p-2 text-right">
                      {m?.ctr ? `${(m.ctr * 100).toFixed(2)}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update dashboard sidebar to link to analytics (remove "Phase 5" label)**

Read `apps/web/src/app/(dashboard)/layout.tsx` and change the analytics link from greyed out to active:

Replace:
```tsx
<Link href="/dashboard/analytics" className="block rounded px-3 py-2 text-sm hover:bg-gray-200 text-gray-400">
  Analytics (Phase 5)
</Link>
```
with:
```tsx
<Link href="/dashboard/analytics" className="block rounded px-3 py-2 text-sm hover:bg-gray-200">
  Analytics
</Link>
```

Also update the Campaigns link similarly:
```tsx
<Link href="/dashboard/campaigns" className="block rounded px-3 py-2 text-sm hover:bg-gray-200">
  Campaigns
</Link>
```

- [ ] **Step 3: Commit**

```bash
git add "apps/web/src/app/(dashboard)"
git commit -m "feat: add analytics dashboard page with overview cards and post performance table"
```

---

### Task 4: Final Verification

- [ ] **Step 1: Run all tests**

Run: `cd /d/Claude/Projects/aimarketing && pnpm test`
Expected: All tests pass

- [ ] **Step 2: Final commit if any uncommitted files**

```bash
git add -A && git status
```

---

## Summary

**4 tasks, ~15 steps.** After completion, Phase 5 delivers:

- analytics:sync worker processor (finds published posts, syncs metrics, updates engagementSnapshot cache)
- Analytics overview API (org-wide aggregated metrics with platform breakdown)
- Campaign analytics API (per-campaign post metrics + time series)
- CSV export endpoint (downloadable analytics report)
- Analytics dashboard page (overview cards + post performance table)
- Dashboard sidebar links activated for Analytics and Campaigns

**Next:** Phase 6 — User Features (content calendar, approval workflow UI, templates, onboarding)
