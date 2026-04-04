import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  prisma: {
    post: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    platformConnection: { findFirst: vi.fn() },
  },
}));

vi.mock("@reachpilot/shared", () => ({
  decrypt: vi.fn(() => "decrypted-token"),
}));

vi.mock("@reachpilot/platform-sdk", () => ({
  publishPost: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { publishPost } from "@reachpilot/platform-sdk";

// ── Helpers ──────────────────────────────────────────────────────────

function makeReq(url: string, headers?: Record<string, string>) {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

// ── GET /api/cron/publish-scheduled ──────────────────────────────────

describe("GET /api/cron/publish-scheduled", () => {
  let GET: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret";
    process.env.MASTER_ENCRYPTION_KEY = "test-key";
    const mod = await import("@/app/api/cron/publish-scheduled/route");
    GET = mod.GET;
  });

  it("returns 401 without valid cron secret", async () => {
    const res = await GET(
      makeReq("http://localhost:3000/api/cron/publish-scheduled", {
        authorization: "Bearer wrong-secret",
      }),
    );

    expect(res.status).toBe(401);
  });

  it("returns 401 without authorization header", async () => {
    const res = await GET(
      makeReq("http://localhost:3000/api/cron/publish-scheduled"),
    );

    expect(res.status).toBe(401);
  });

  it("returns success with no due posts", async () => {
    (prisma.post.findMany as any).mockResolvedValue([]);

    const res = await GET(
      makeReq("http://localhost:3000/api/cron/publish-scheduled", {
        authorization: "Bearer test-cron-secret",
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.published).toBe(0);
    expect(json.message).toBe("No posts due");
  });

  it("publishes due posts successfully", async () => {
    const duePosts = [
      {
        id: "p1",
        orgId: "org-1",
        platform: "LINKEDIN",
        content: "Hello",
        mediaUrls: [],
        pageId: null,
        status: "SCHEDULED",
        scheduledAt: new Date(Date.now() - 60000),
        organization: { publishingPaused: false },
      },
    ];
    (prisma.post.findMany as any).mockResolvedValue(duePosts);
    (prisma.platformConnection.findFirst as any).mockResolvedValue({
      id: "c1",
      orgId: "org-1",
      platform: "LINKEDIN",
      accessToken: "enc-tok",
      platformUserId: "u1",
      metadata: null,
    });
    (publishPost as any).mockResolvedValue({
      success: true,
      platformPostId: "ext-1",
    });
    (prisma.post.update as any).mockResolvedValue({});

    const res = await GET(
      makeReq("http://localhost:3000/api/cron/publish-scheduled", {
        authorization: "Bearer test-cron-secret",
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.published).toBe(1);
  });

  it("skips posts when publishing is paused", async () => {
    (prisma.post.findMany as any).mockResolvedValue([
      {
        id: "p1",
        orgId: "org-1",
        platform: "LINKEDIN",
        content: "Hello",
        organization: { publishingPaused: true },
      },
    ]);

    const res = await GET(
      makeReq("http://localhost:3000/api/cron/publish-scheduled", {
        authorization: "Bearer test-cron-secret",
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.skipped).toBe(1);
    expect(json.published).toBe(0);
  });

  it("marks posts as FAILED when no connection found", async () => {
    (prisma.post.findMany as any).mockResolvedValue([
      {
        id: "p1",
        orgId: "org-1",
        platform: "LINKEDIN",
        content: "Hello",
        organization: { publishingPaused: false },
      },
    ]);
    (prisma.platformConnection.findFirst as any).mockResolvedValue(null);
    (prisma.post.update as any).mockResolvedValue({});

    const res = await GET(
      makeReq("http://localhost:3000/api/cron/publish-scheduled", {
        authorization: "Bearer test-cron-secret",
      }),
    );
    const json = await res.json();

    expect(json.failed).toBe(1);
    expect(prisma.post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "FAILED" }),
      }),
    );
  });

  it("handles publishing failure gracefully", async () => {
    (prisma.post.findMany as any).mockResolvedValue([
      {
        id: "p1",
        orgId: "org-1",
        platform: "LINKEDIN",
        content: "Hello",
        mediaUrls: [],
        pageId: null,
        organization: { publishingPaused: false },
      },
    ]);
    (prisma.platformConnection.findFirst as any).mockResolvedValue({
      id: "c1", accessToken: "tok", platformUserId: "u1", metadata: null,
    });
    (publishPost as any).mockResolvedValue({ success: false, error: "API limit" });
    (prisma.post.update as any).mockResolvedValue({});

    const res = await GET(
      makeReq("http://localhost:3000/api/cron/publish-scheduled", {
        authorization: "Bearer test-cron-secret",
      }),
    );
    const json = await res.json();

    expect(json.failed).toBe(1);
  });
});
