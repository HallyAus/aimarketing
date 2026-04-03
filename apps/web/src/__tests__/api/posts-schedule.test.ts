import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  prisma: {
    campaign: { findFirst: vi.fn(), create: vi.fn() },
    post: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    organization: { findUniqueOrThrow: vi.fn() },
    auditLog: { create: vi.fn().mockReturnValue({ catch: vi.fn() }) },
  },
}));

vi.mock("@/lib/auth-middleware", () => ({
  withRole: (_role: string, handler: Function) =>
    (req: NextRequest, ctx: unknown) => {
      (req as any).orgId = "org-1";
      (req as any).userId = "user-1";
      (req as any).role = "OWNER";
      return handler(req, ctx);
    },
}));

vi.mock("@/lib/api-handler", () => ({
  withErrorHandler: (handler: Function) => handler,
  ZodValidationError: class ZodValidationError extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "ZodValidationError";
    }
  },
}));

vi.mock("@adpilot/shared", () => ({
  sanitizeHtml: (s: string) => s,
  isValidTransition: () => true,
}));

vi.mock("@/lib/timezone", () => ({
  getTimezoneFromCookie: () => "Australia/Sydney",
}));

import { prisma } from "@/lib/db";

// ── Helpers ──────────────────────────────────────────────────────────

function makeReq(url: string, init?: Record<string, unknown>) {
  return new NextRequest(new URL(url, "http://localhost:3000"), init as never);
}

const defaultCtx = { params: Promise.resolve({}) };

const futureDate = new Date(Date.now() + 86400000).toISOString(); // tomorrow

// ── POST /api/posts/schedule — single ───────────────────────────────

describe("POST /api/posts/schedule — single", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/posts/schedule/route");
    POST = mod.POST;
  });

  it("schedules a single post (201)", async () => {
    const campaign = { id: "camp-1", orgId: "org-1" };
    (prisma.campaign.findFirst as any).mockResolvedValue(campaign);
    (prisma.post.create as any).mockResolvedValue({
      id: "p1", status: "SCHEDULED", scheduledAt: futureDate,
    });

    const req = makeReq("http://localhost:3000/api/posts/schedule", {
      method: "POST",
      body: JSON.stringify({
        content: "Hello world",
        platform: "FACEBOOK",
        campaignId: "camp-1",
        scheduledAt: futureDate,
      }),
    });
    const res = await POST(req, defaultCtx);

    expect(res.status).toBe(201);
  });

  it("throws on missing content", async () => {
    const req = makeReq("http://localhost:3000/api/posts/schedule", {
      method: "POST",
      body: JSON.stringify({
        platform: "FACEBOOK",
        campaignId: "c1",
        scheduledAt: futureDate,
      }),
    });

    await expect(POST(req, defaultCtx)).rejects.toThrow("content is required");
  });

  it("throws on invalid platform", async () => {
    const req = makeReq("http://localhost:3000/api/posts/schedule", {
      method: "POST",
      body: JSON.stringify({
        content: "hi",
        platform: "INVALID",
        campaignId: "c1",
        scheduledAt: futureDate,
      }),
    });

    await expect(POST(req, defaultCtx)).rejects.toThrow("platform must be one of");
  });

  it("throws when scheduledAt is in the past", async () => {
    const req = makeReq("http://localhost:3000/api/posts/schedule", {
      method: "POST",
      body: JSON.stringify({
        content: "hi",
        platform: "FACEBOOK",
        campaignId: "c1",
        scheduledAt: "2020-01-01T00:00:00Z",
      }),
    });

    await expect(POST(req, defaultCtx)).rejects.toThrow("scheduledAt must be in the future");
  });

  it("returns 404 when campaign not found", async () => {
    (prisma.campaign.findFirst as any).mockResolvedValue(null);

    const req = makeReq("http://localhost:3000/api/posts/schedule", {
      method: "POST",
      body: JSON.stringify({
        content: "hi",
        platform: "FACEBOOK",
        campaignId: "missing",
        scheduledAt: futureDate,
      }),
    });
    const res = await POST(req, defaultCtx);

    expect(res.status).toBe(404);
  });
});

// ── POST /api/posts/schedule — batch ────────────────────────────────

describe("POST /api/posts/schedule — batch", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/posts/schedule/route");
    POST = mod.POST;
  });

  it("schedules multiple posts (201)", async () => {
    (prisma.campaign.findFirst as any).mockResolvedValue({ id: "camp-1", orgId: "org-1" });
    (prisma.post.create as any).mockImplementation(({ data }: any) =>
      Promise.resolve({ id: "p-" + Math.random(), ...data }),
    );

    const req = makeReq("http://localhost:3000/api/posts/schedule", {
      method: "POST",
      body: JSON.stringify({
        posts: [
          { content: "Post 1", platform: "FACEBOOK" },
          { content: "Post 2", platform: "LINKEDIN" },
        ],
        campaignId: "camp-1",
        startAt: futureDate,
        intervalMinutes: 60,
      }),
    });
    const res = await POST(req, defaultCtx);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.scheduledCount).toBe(2);
  });

  it("throws on empty posts array", async () => {
    const req = makeReq("http://localhost:3000/api/posts/schedule", {
      method: "POST",
      body: JSON.stringify({
        posts: [],
        campaignId: "c1",
        startAt: futureDate,
        intervalMinutes: 60,
      }),
    });

    await expect(POST(req, defaultCtx)).rejects.toThrow("posts array is required");
  });
});

// ── POST /api/posts/auto-schedule ───────────────────────────────────

describe("POST /api/posts/auto-schedule", () => {
  let POST_AUTO: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/posts/auto-schedule/route");
    POST_AUTO = mod.POST;
  });

  it("auto-schedules posts from IDs (200)", async () => {
    (prisma.organization.findUniqueOrThrow as any).mockResolvedValue({ publishingPaused: false });
    (prisma.campaign.findFirst as any).mockResolvedValue({ id: "camp-1" });
    (prisma.post.findMany as any).mockResolvedValue([
      { id: "p1", status: "DRAFT", orgId: "org-1", createdAt: new Date() },
    ]);
    (prisma.post.findFirst as any).mockResolvedValue(null); // no last scheduled post
    (prisma.post.update as any).mockResolvedValue({});

    const req = makeReq("http://localhost:3000/api/posts/auto-schedule", {
      method: "POST",
      body: JSON.stringify({ postIds: ["p1"], campaignId: "camp-1" }),
    });
    const res = await POST_AUTO(req, defaultCtx);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.scheduled).toHaveLength(1);
  });

  it("auto-schedules from drafts", async () => {
    (prisma.organization.findUniqueOrThrow as any).mockResolvedValue({ publishingPaused: false });
    (prisma.campaign.findFirst as any).mockResolvedValue({ id: "camp-1" });
    (prisma.post.create as any).mockImplementation(() =>
      Promise.resolve({ id: "new-p1" }),
    );
    (prisma.post.findMany as any).mockResolvedValue([
      { id: "new-p1", status: "DRAFT", orgId: "org-1", createdAt: new Date() },
    ]);
    (prisma.post.findFirst as any).mockResolvedValue(null);
    (prisma.post.update as any).mockResolvedValue({});

    const req = makeReq("http://localhost:3000/api/posts/auto-schedule", {
      method: "POST",
      body: JSON.stringify({
        drafts: [{ content: "Hello", platform: "FACEBOOK" }],
        campaignId: "camp-1",
      }),
    });
    const res = await POST_AUTO(req, defaultCtx);

    expect(res.status).toBe(200);
  });

  it("throws when no postId/postIds/drafts provided", async () => {
    (prisma.organization.findUniqueOrThrow as any).mockResolvedValue({ publishingPaused: false });
    (prisma.campaign.findFirst as any).mockResolvedValue({ id: "camp-1" });

    const req = makeReq("http://localhost:3000/api/posts/auto-schedule", {
      method: "POST",
      body: JSON.stringify({ campaignId: "camp-1" }),
    });

    await expect(POST_AUTO(req, defaultCtx)).rejects.toThrow("postId, postIds, or drafts is required");
  });

  it("includes warning when publishing is paused", async () => {
    (prisma.organization.findUniqueOrThrow as any).mockResolvedValue({ publishingPaused: true });
    (prisma.campaign.findFirst as any).mockResolvedValue({ id: "camp-1" });
    (prisma.post.findMany as any).mockResolvedValue([
      { id: "p1", status: "DRAFT", orgId: "org-1", createdAt: new Date() },
    ]);
    (prisma.post.findFirst as any).mockResolvedValue(null);
    (prisma.post.update as any).mockResolvedValue({});

    const req = makeReq("http://localhost:3000/api/posts/auto-schedule", {
      method: "POST",
      body: JSON.stringify({ postIds: ["p1"], campaignId: "camp-1" }),
    });
    const res = await POST_AUTO(req, defaultCtx);
    const json = await res.json();

    expect(json.warning).toContain("paused");
  });
});
