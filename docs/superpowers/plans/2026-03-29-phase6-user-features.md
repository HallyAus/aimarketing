# Phase 6: User Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build user-facing features — campaigns list/detail pages, content calendar view, post approval UI, post template system, and onboarding wizard for new organizations.

**Architecture:** All server-rendered Next.js pages in the `(dashboard)` route group. Campaign and post management pages use existing API routes from Phase 3. Content calendar is a month-view grid of scheduled/published posts. Templates are stored as reusable Post blueprints (new Prisma model). Onboarding is a multi-step guided flow that activates after org creation.

**Tech Stack:** Next.js 15 App Router (server components + server actions), Tailwind CSS, Prisma

**Spec:** `docs/superpowers/specs/2026-03-29-reachpilot-foundation-design.md` — Section 14 item 6

---

## File Structure

```
packages/db/prisma/
└── schema.prisma              # Add PostTemplate model

apps/web/src/app/(dashboard)/
├── campaigns/
│   ├── page.tsx               # Campaign list
│   ├── new/page.tsx           # Create campaign form
│   └── [campaignId]/
│       ├── page.tsx           # Campaign detail + posts
│       └── posts/new/page.tsx # Create post form
├── calendar/page.tsx          # Content calendar (month view)
├── templates/
│   ├── page.tsx               # Template library
│   └── new/page.tsx           # Create template
├── onboarding/page.tsx        # Onboarding wizard

apps/web/src/app/api/
└── templates/
    ├── route.ts               # GET list + POST create
    └── [templateId]/route.ts  # GET + PATCH + DELETE
```

---

### Task 1: PostTemplate Schema + API

**Files:**
- Modify: `packages/db/prisma/schema.prisma`
- Create: `apps/web/src/app/api/templates/route.ts`
- Create: `apps/web/src/app/api/templates/[templateId]/route.ts`
- Modify: `packages/shared/src/validators.ts`

- [ ] **Step 1: Add PostTemplate model to Prisma schema**

Append before the closing of schema.prisma (after WebhookEvent model):

```prisma
model PostTemplate {
  id          String   @id @default(cuid())
  orgId       String
  name        String
  platform    Platform?
  content     String
  mediaUrls   String[]
  tags        String[]
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@index([orgId])
}
```

Also add to the Organization model's relations:
```prisma
postTemplates PostTemplate[]
```

- [ ] **Step 2: Run prisma generate**

Run: `cd packages/db && npx prisma generate`

- [ ] **Step 3: Add template validators to packages/shared/src/validators.ts**

Append:

```typescript
export const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  platform: z.enum(["FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN", "TWITTER_X", "YOUTUBE", "GOOGLE_ADS", "PINTEREST", "SNAPCHAT"]).optional(),
  content: z.string().min(1).max(10000),
  mediaUrls: z.array(z.string().url()).default([]),
  tags: z.array(z.string().max(50)).max(20).default([]),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});
```

- [ ] **Step 4: Create template API routes**

Create `apps/web/src/app/api/templates/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@reachpilot/db";
import { createTemplateSchema } from "@reachpilot/shared";

export const GET = withErrorHandler(withRole("VIEWER", async (req) => {
  const templates = await prisma.postTemplate.findMany({
    where: { orgId: req.orgId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(templates);
}));

export const POST = withErrorHandler(withRole("EDITOR", async (req) => {
  const body = await req.json();
  const parsed = createTemplateSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const template = await prisma.postTemplate.create({
    data: {
      orgId: req.orgId,
      createdBy: req.userId,
      ...parsed.data,
    },
  });

  return NextResponse.json(template, { status: 201 });
}));
```

Create `apps/web/src/app/api/templates/[templateId]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@reachpilot/db";
import { updateTemplateSchema } from "@reachpilot/shared";

export const GET = withErrorHandler(withRole("VIEWER", async (req, context) => {
  const { templateId } = await context.params;
  const template = await prisma.postTemplate.findFirst({
    where: { id: templateId, orgId: req.orgId },
  });
  if (!template) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }
  return NextResponse.json(template);
}));

export const PATCH = withErrorHandler(withRole("EDITOR", async (req, context) => {
  const { templateId } = await context.params;
  const body = await req.json();
  const parsed = updateTemplateSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }
  const existing = await prisma.postTemplate.findFirst({
    where: { id: templateId, orgId: req.orgId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }
  const template = await prisma.postTemplate.update({
    where: { id: templateId },
    data: parsed.data,
  });
  return NextResponse.json(template);
}));

export const DELETE = withErrorHandler(withRole("EDITOR", async (req, context) => {
  const { templateId } = await context.params;
  const existing = await prisma.postTemplate.findFirst({
    where: { id: templateId, orgId: req.orgId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }
  await prisma.postTemplate.delete({ where: { id: templateId } });
  return NextResponse.json({ success: true });
}));
```

- [ ] **Step 5: Commit**

```bash
git add packages/db/prisma/schema.prisma packages/shared/src/validators.ts apps/web/src/app/api/templates
git commit -m "feat: add PostTemplate model, validators, and CRUD API routes"
```

---

### Task 2: Campaigns List + Detail Pages

**Files:**
- Create: `apps/web/src/app/(dashboard)/campaigns/page.tsx`
- Create: `apps/web/src/app/(dashboard)/campaigns/new/page.tsx`
- Create: `apps/web/src/app/(dashboard)/campaigns/[campaignId]/page.tsx`
- Create: `apps/web/src/app/(dashboard)/campaigns/[campaignId]/posts/new/page.tsx`

- [ ] **Step 1: Create campaigns list page**

Create `apps/web/src/app/(dashboard)/campaigns/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@reachpilot/db";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SCHEDULED: "bg-blue-100 text-blue-800",
  ACTIVE: "bg-green-100 text-green-800",
  PAUSED: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-purple-100 text-purple-800",
  FAILED: "bg-red-100 text-red-800",
};

export default async function CampaignsPage() {
  const session = await auth();
  if (!session?.user?.currentOrgId) redirect("/org-picker");

  const campaigns = await prisma.campaign.findMany({
    where: { orgId: session.user.currentOrgId },
    include: {
      _count: { select: { posts: true } },
      creator: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Link
          href="/campaigns/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No campaigns yet.</p>
          <Link href="/campaigns/new" className="text-blue-600 hover:underline mt-2 inline-block">
            Create your first campaign
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/campaigns/${c.id}`}
              className="block border rounded-lg p-4 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {c.objective} &middot; {c._count.posts} posts &middot; by {c.creator?.name ?? "Unknown"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status] ?? ""}`}>
                    {c.status}
                  </span>
                  {c.targetPlatforms.length > 0 && (
                    <span className="text-xs text-gray-400">
                      {c.targetPlatforms.join(", ")}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create new campaign form page**

Create `apps/web/src/app/(dashboard)/campaigns/new/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@reachpilot/db";

const OBJECTIVES = ["AWARENESS", "TRAFFIC", "ENGAGEMENT", "CONVERSIONS", "LEADS"];
const PLATFORMS = ["FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN", "TWITTER_X", "YOUTUBE", "GOOGLE_ADS", "PINTEREST", "SNAPCHAT"];

export default async function NewCampaignPage() {
  const session = await auth();
  if (!session?.user?.currentOrgId) redirect("/org-picker");

  // Get connected platforms
  const connections = await prisma.platformConnection.findMany({
    where: { orgId: session.user.currentOrgId, status: "ACTIVE" },
    select: { platform: true },
  });
  const connectedPlatforms = new Set(connections.map((c) => c.platform));

  async function createCampaign(formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user?.currentOrgId) return;

    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: "" },
      body: JSON.stringify({
        name: formData.get("name"),
        objective: formData.get("objective"),
        targetPlatforms: formData.getAll("platforms"),
        budget: formData.get("budget") ? Number(formData.get("budget")) : undefined,
        startDate: formData.get("startDate") || undefined,
        endDate: formData.get("endDate") || undefined,
      }),
    });

    if (res.ok) {
      const campaign = await res.json();
      redirect(`/campaigns/${campaign.id}`);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Create Campaign</h1>
      <form action={createCampaign} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Campaign Name</label>
          <input name="name" required className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Summer Sale 2026" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Objective</label>
          <select name="objective" required className="w-full rounded-md border px-3 py-2 text-sm">
            {OBJECTIVES.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Target Platforms</label>
          <div className="grid grid-cols-3 gap-2">
            {PLATFORMS.map((p) => (
              <label key={p} className={`flex items-center gap-2 text-sm p-2 rounded border ${connectedPlatforms.has(p) ? "" : "opacity-40"}`}>
                <input type="checkbox" name="platforms" value={p} disabled={!connectedPlatforms.has(p)} />
                {p.replace("_", " ")}
              </label>
            ))}
          </div>
          {connectedPlatforms.size === 0 && (
            <p className="text-sm text-red-500 mt-1">No platforms connected. Connect platforms first.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Budget (optional)</label>
            <input name="budget" type="number" step="0.01" className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Currency</label>
            <input name="currency" defaultValue="USD" className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input name="startDate" type="datetime-local" className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input name="endDate" type="datetime-local" className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
        </div>

        <button type="submit" className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Create Campaign
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Create campaign detail page**

Create `apps/web/src/app/(dashboard)/campaigns/[campaignId]/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@reachpilot/db";
import Link from "next/link";

const POST_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  REJECTED: "bg-red-100 text-red-800",
  SCHEDULED: "bg-indigo-100 text-indigo-800",
  PUBLISHING: "bg-orange-100 text-orange-800",
  PUBLISHED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.currentOrgId) redirect("/org-picker");

  const { campaignId } = await params;

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, orgId: session.user.currentOrgId },
    include: {
      posts: {
        orderBy: { createdAt: "desc" },
        include: { approver: { select: { name: true } } },
      },
      creator: { select: { name: true } },
    },
  });

  if (!campaign) redirect("/campaigns");

  const isAdminOrOwner = ["ADMIN", "OWNER"].includes(session.user.currentRole ?? "");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {campaign.objective} &middot; {campaign.status} &middot; {campaign.targetPlatforms.join(", ")}
          </p>
        </div>
        <Link
          href={`/campaigns/${campaignId}/posts/new`}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Post
        </Link>
      </div>

      {campaign.posts.length === 0 ? (
        <p className="text-gray-500">No posts yet. Add your first post to this campaign.</p>
      ) : (
        <div className="space-y-3">
          {campaign.posts.map((post) => (
            <div key={post.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{post.platform}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${POST_STATUS_COLORS[post.status] ?? ""}`}>
                    {post.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  {post.status === "PENDING_APPROVAL" && isAdminOrOwner && (
                    <>
                      <form action={async () => {
                        "use server";
                        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/posts/${post.id}/approve`, { method: "POST" });
                        const { redirect: r } = await import("next/navigation");
                        r(`/campaigns/${campaignId}`);
                      }}>
                        <button type="submit" className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Approve</button>
                      </form>
                      <form action={async () => {
                        "use server";
                        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/posts/${post.id}/reject`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ reason: "Needs revision" }),
                        });
                        const { redirect: r } = await import("next/navigation");
                        r(`/campaigns/${campaignId}`);
                      }}>
                        <button type="submit" className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Reject</button>
                      </form>
                    </>
                  )}
                </div>
              </div>
              <p className="text-sm">{post.content.substring(0, 300)}{post.content.length > 300 ? "..." : ""}</p>
              {post.rejectionReason && (
                <p className="text-sm text-red-500 mt-2">Rejection reason: {post.rejectionReason}</p>
              )}
              {post.scheduledAt && (
                <p className="text-xs text-gray-400 mt-2">Scheduled: {post.scheduledAt.toLocaleString()}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create new post form page**

Create `apps/web/src/app/(dashboard)/campaigns/[campaignId]/posts/new/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@reachpilot/db";

export default async function NewPostPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.currentOrgId) redirect("/org-picker");

  const { campaignId } = await params;

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, orgId: session.user.currentOrgId },
    select: { id: true, name: true, targetPlatforms: true },
  });
  if (!campaign) redirect("/campaigns");

  // Get templates
  const templates = await prisma.postTemplate.findMany({
    where: { orgId: session.user.currentOrgId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  async function createPost(formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user?.currentOrgId) return;

    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/campaigns/${campaignId}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: formData.get("platform"),
        content: formData.get("content"),
        scheduledAt: formData.get("scheduledAt") || undefined,
      }),
    });

    redirect(`/campaigns/${campaignId}`);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Add Post</h1>
      <p className="text-sm text-gray-500 mb-6">Campaign: {campaign.name}</p>

      {templates.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Start from template (optional)</label>
          <div className="flex gap-2 flex-wrap">
            {templates.map((t) => (
              <button key={t.id} type="button" className="text-xs border rounded px-3 py-1 hover:bg-gray-50">
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <form action={createPost} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Platform</label>
          <select name="platform" required className="w-full rounded-md border px-3 py-2 text-sm">
            {campaign.targetPlatforms.map((p) => (
              <option key={p} value={p}>{p.replace("_", " ")}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Content</label>
          <textarea name="content" required rows={6} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Write your post content..." />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Schedule (optional)</label>
          <input name="scheduledAt" type="datetime-local" className="w-full rounded-md border px-3 py-2 text-sm" />
        </div>

        <div className="flex gap-3">
          <button type="submit" className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Create Post
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add "apps/web/src/app/(dashboard)/campaigns"
git commit -m "feat: add campaign list, detail, new campaign, and new post pages with approval UI"
```

---

### Task 3: Content Calendar Page

**Files:**
- Create: `apps/web/src/app/(dashboard)/calendar/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Create calendar page**

Create `apps/web/src/app/(dashboard)/calendar/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@reachpilot/db";

const PLATFORM_COLORS: Record<string, string> = {
  FACEBOOK: "border-l-blue-600",
  INSTAGRAM: "border-l-pink-500",
  TIKTOK: "border-l-gray-900",
  LINKEDIN: "border-l-blue-700",
  TWITTER_X: "border-l-gray-800",
  YOUTUBE: "border-l-red-600",
  GOOGLE_ADS: "border-l-green-600",
  PINTEREST: "border-l-red-500",
  SNAPCHAT: "border-l-yellow-400",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.currentOrgId) redirect("/org-picker");

  const params = await searchParams;
  const now = new Date();
  const year = parseInt(params.year ?? String(now.getFullYear()), 10);
  const month = parseInt(params.month ?? String(now.getMonth() + 1), 10);

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  const startDay = startOfMonth.getDay(); // 0=Sunday
  const daysInMonth = endOfMonth.getDate();

  // Get posts for this month
  const posts = await prisma.post.findMany({
    where: {
      orgId: session.user.currentOrgId,
      status: { notIn: ["DELETED"] },
      OR: [
        { scheduledAt: { gte: startOfMonth, lte: endOfMonth } },
        { publishedAt: { gte: startOfMonth, lte: endOfMonth } },
      ],
    },
    include: { campaign: { select: { name: true } } },
    orderBy: { scheduledAt: "asc" },
  });

  // Group posts by day
  const postsByDay = new Map<number, typeof posts>();
  for (const post of posts) {
    const date = post.publishedAt ?? post.scheduledAt;
    if (!date) continue;
    const day = date.getDate();
    const existing = postsByDay.get(day) ?? [];
    existing.push(post);
    postsByDay.set(day, existing);
  }

  const monthName = startOfMonth.toLocaleString("default", { month: "long" });
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Content Calendar</h1>
        <div className="flex items-center gap-4">
          <a href={`/calendar?month=${prevMonth}&year=${prevYear}`} className="text-sm text-gray-500 hover:text-gray-800">&larr; Prev</a>
          <span className="font-medium">{monthName} {year}</span>
          <a href={`/calendar?month=${nextMonth}&year=${nextYear}`} className="text-sm text-gray-500 hover:text-gray-800">Next &rarr;</a>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-t-lg overflow-hidden">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="bg-gray-50 p-2 text-center text-xs font-medium text-gray-500">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-b-lg overflow-hidden">
        {/* Empty cells before first day */}
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-white p-2 min-h-[100px]" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayPosts = postsByDay.get(day) ?? [];
          const isToday = day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();

          return (
            <div key={day} className={`bg-white p-2 min-h-[100px] ${isToday ? "ring-2 ring-blue-500 ring-inset" : ""}`}>
              <div className={`text-xs mb-1 ${isToday ? "font-bold text-blue-600" : "text-gray-400"}`}>{day}</div>
              <div className="space-y-1">
                {dayPosts.slice(0, 3).map((post) => (
                  <div
                    key={post.id}
                    className={`text-xs p-1 rounded border-l-2 bg-gray-50 truncate ${PLATFORM_COLORS[post.platform] ?? "border-l-gray-300"}`}
                    title={`${post.platform}: ${post.content.substring(0, 100)}`}
                  >
                    {post.campaign.name}
                  </div>
                ))}
                {dayPosts.length > 3 && (
                  <div className="text-xs text-gray-400">+{dayPosts.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add Calendar link to sidebar**

Read `apps/web/src/app/(dashboard)/layout.tsx` and add a Calendar link after Analytics:

```tsx
<Link href="/calendar" className="block rounded px-3 py-2 text-sm hover:bg-gray-200">
  Calendar
</Link>
```

- [ ] **Step 3: Commit**

```bash
git add "apps/web/src/app/(dashboard)/calendar" "apps/web/src/app/(dashboard)/layout.tsx"
git commit -m "feat: add content calendar page with monthly grid view and platform color coding"
```

---

### Task 4: Templates Library Page

**Files:**
- Create: `apps/web/src/app/(dashboard)/templates/page.tsx`
- Create: `apps/web/src/app/(dashboard)/templates/new/page.tsx`

- [ ] **Step 1: Create templates list page**

Create `apps/web/src/app/(dashboard)/templates/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@reachpilot/db";
import Link from "next/link";

export default async function TemplatesPage() {
  const session = await auth();
  if (!session?.user?.currentOrgId) redirect("/org-picker");

  const templates = await prisma.postTemplate.findMany({
    where: { orgId: session.user.currentOrgId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Post Templates</h1>
        <Link
          href="/templates/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New Template
        </Link>
      </div>

      {templates.length === 0 ? (
        <p className="text-gray-500">No templates yet. Create reusable post templates to speed up content creation.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{t.name}</h3>
                {t.platform && <span className="text-xs text-gray-400">{t.platform}</span>}
              </div>
              <p className="text-sm text-gray-600 line-clamp-3">{t.content}</p>
              {t.tags.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {t.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create new template form**

Create `apps/web/src/app/(dashboard)/templates/new/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const PLATFORMS = ["FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN", "TWITTER_X", "YOUTUBE", "GOOGLE_ADS", "PINTEREST", "SNAPCHAT"];

export default async function NewTemplatePage() {
  const session = await auth();
  if (!session?.user?.currentOrgId) redirect("/org-picker");

  async function createTemplate(formData: FormData) {
    "use server";
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        platform: formData.get("platform") || undefined,
        content: formData.get("content"),
        tags: formData.get("tags") ? (formData.get("tags") as string).split(",").map((t) => t.trim()).filter(Boolean) : [],
      }),
    });
    redirect("/templates");
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Create Template</h1>
      <form action={createTemplate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Template Name</label>
          <input name="name" required className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Product Launch Announcement" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Platform (optional — leave blank for universal)</label>
          <select name="platform" className="w-full rounded-md border px-3 py-2 text-sm">
            <option value="">Any Platform</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>{p.replace("_", " ")}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Content</label>
          <textarea name="content" required rows={6} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Write your template content..." />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
          <input name="tags" className="w-full rounded-md border px-3 py-2 text-sm" placeholder="promo, launch, product" />
        </div>
        <button type="submit" className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Create Template
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Add Templates link to sidebar**

Add to dashboard layout sidebar (after Calendar):

```tsx
<Link href="/templates" className="block rounded px-3 py-2 text-sm hover:bg-gray-200">
  Templates
</Link>
```

- [ ] **Step 4: Commit**

```bash
git add "apps/web/src/app/(dashboard)/templates" "apps/web/src/app/(dashboard)/layout.tsx"
git commit -m "feat: add post template library with create and list pages"
```

---

### Task 5: Onboarding Wizard

**Files:**
- Create: `apps/web/src/app/(dashboard)/onboarding/page.tsx`

- [ ] **Step 1: Create onboarding page**

Create `apps/web/src/app/(dashboard)/onboarding/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@reachpilot/db";
import Link from "next/link";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.currentOrgId) redirect("/org-picker");

  const orgId = session.user.currentOrgId;

  // Check onboarding progress
  const [org, connectionCount, campaignCount] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId }, select: { name: true, plan: true } }),
    prisma.platformConnection.count({ where: { orgId, status: "ACTIVE" } }),
    prisma.campaign.count({ where: { orgId } }),
  ]);

  if (!org) redirect("/org-picker");

  const steps = [
    { label: "Create organization", done: true, href: "/dashboard" },
    { label: "Connect a platform", done: connectionCount > 0, href: "/dashboard/settings/connections" },
    { label: "Create your first campaign", done: campaignCount > 0, href: "/campaigns/new" },
    { label: "Upgrade your plan", done: org.plan !== "FREE", href: "/dashboard/settings/billing" },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  return (
    <div className="max-w-lg mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-2">Welcome to ReachPilot!</h1>
      <p className="text-gray-500 mb-8">
        {allDone
          ? "You're all set! Start managing your campaigns."
          : `Complete these steps to get started (${completedCount}/${steps.length})`}
      </p>

      <div className="space-y-3">
        {steps.map((step, i) => (
          <Link
            key={i}
            href={step.href}
            className={`flex items-center gap-3 p-4 border rounded-lg ${step.done ? "bg-green-50 border-green-200" : "hover:bg-gray-50"}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step.done ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"}`}>
              {step.done ? "\u2713" : i + 1}
            </div>
            <span className={step.done ? "line-through text-gray-400" : ""}>{step.label}</span>
          </Link>
        ))}
      </div>

      {allDone && (
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Go to Dashboard
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "apps/web/src/app/(dashboard)/onboarding"
git commit -m "feat: add onboarding wizard with step-by-step progress tracking"
```

---

### Task 6: Final Verification

- [ ] **Step 1: Run all tests**

Run: `cd /d/Claude/Projects/aimarketing && pnpm test`

- [ ] **Step 2: Regenerate Prisma client**

Run: `cd packages/db && npx prisma generate`

- [ ] **Step 3: Verify commit history**

```bash
git log --oneline | head -10
```

---

## Summary

**6 tasks, ~20 steps.** After completion, Phase 6 delivers:

- PostTemplate Prisma model + CRUD API
- Template validators (create + update)
- Campaigns list page with status badges
- New campaign form with connected platform detection
- Campaign detail page with post list and inline approve/reject actions
- New post form with template selection
- Content calendar page (monthly grid, platform color coding, navigation)
- Post template library (list + create)
- Onboarding wizard (4-step progress tracker)
- Updated sidebar navigation with Calendar and Templates links

**Next:** Phase 7 — Production Hardening (security, observability, CI/CD, deploy)
