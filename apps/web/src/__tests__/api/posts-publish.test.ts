import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  prisma: {
    organization: { findUniqueOrThrow: vi.fn() },
    platformConnection: { findFirst: vi.fn() },
    campaign: { findFirst: vi.fn(), create: vi.fn() },
    post: { create: vi.fn(), update: vi.fn() },
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
  decrypt: vi.fn(() => "decrypted-token"),
}));

vi.mock("@adpilot/platform-sdk", () => ({
  publishPost: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { publishPost } from "@adpilot/platform-sdk";

// ── Helpers ──────────────────────────────────────────────────────────

function makeReq(url: string, init?: Record<string, unknown>) {
  return new NextRequest(new URL(url, "http://localhost:3000"), init as never);
}

const defaultCtx = { params: Promise.resolve({}) };

// ── Tests ────────────────────────────────────────────────────────────

describe("POST /api/posts/publish-now", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.MASTER_ENCRYPTION_KEY = "test-key";
    const mod = await import("@/app/api/posts/publish-now/route");
    POST = mod.POST;
  });

  it("publishes a post successfully (200)", async () => {
    (prisma.organization.findUniqueOrThrow as any).mockResolvedValue({ publishingPaused: false });
    (prisma.platformConnection.findFirst as any).mockResolvedValue({
      id: "conn-1",
      orgId: "org-1",
      platform: "LINKEDIN",
      accessToken: "enc-tok",
      platformUserId: "u1",
      platformAccountName: "My Account",
      metadata: null,
    });
    (prisma.campaign.findFirst as any).mockResolvedValue({ id: "camp-1" });
    (prisma.post.create as any).mockResolvedValue({ id: "p1", status: "PUBLISHING" });
    (publishPost as any).mockResolvedValue({
      success: true,
      platformPostId: "ext-123",
      url: "https://linkedin.com/post/ext-123",
    });
    (prisma.post.update as any).mockResolvedValue({ id: "p1", status: "PUBLISHED" });

    const req = makeReq("http://localhost:3000/api/posts/publish-now", {
      method: "POST",
      body: JSON.stringify({
        content: "Hello world",
        platform: "LINKEDIN",
        connectionId: "conn-1",
        campaignId: "camp-1",
      }),
    });
    const res = await POST(req, defaultCtx);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.platformPostId).toBe("ext-123");
  });

  it("throws on missing content", async () => {
    const req = makeReq("http://localhost:3000/api/posts/publish-now", {
      method: "POST",
      body: JSON.stringify({ platform: "LINKEDIN", connectionId: "c1" }),
    });

    await expect(POST(req, defaultCtx)).rejects.toThrow("content is required");
  });

  it("throws on invalid platform", async () => {
    const req = makeReq("http://localhost:3000/api/posts/publish-now", {
      method: "POST",
      body: JSON.stringify({ content: "hi", platform: "TIKTOK", connectionId: "c1" }),
    });

    // TIKTOK is not in the VALID_PLATFORMS list for publish-now
    await expect(POST(req, defaultCtx)).rejects.toThrow("platform must be one of");
  });

  it("returns 403 when publishing is paused", async () => {
    (prisma.organization.findUniqueOrThrow as any).mockResolvedValue({ publishingPaused: true });

    const req = makeReq("http://localhost:3000/api/posts/publish-now", {
      method: "POST",
      body: JSON.stringify({
        content: "Hello",
        platform: "LINKEDIN",
        connectionId: "conn-1",
      }),
    });
    const res = await POST(req, defaultCtx);

    expect(res.status).toBe(403);
  });

  it("returns 404 when connection not found", async () => {
    (prisma.organization.findUniqueOrThrow as any).mockResolvedValue({ publishingPaused: false });
    (prisma.platformConnection.findFirst as any).mockResolvedValue(null);

    const req = makeReq("http://localhost:3000/api/posts/publish-now", {
      method: "POST",
      body: JSON.stringify({
        content: "Hello",
        platform: "LINKEDIN",
        connectionId: "missing",
      }),
    });
    const res = await POST(req, defaultCtx);

    expect(res.status).toBe(404);
  });

  it("returns 502 when publishing fails", async () => {
    (prisma.organization.findUniqueOrThrow as any).mockResolvedValue({ publishingPaused: false });
    (prisma.platformConnection.findFirst as any).mockResolvedValue({
      id: "conn-1", orgId: "org-1", platform: "LINKEDIN",
      accessToken: "tok", platformUserId: "u1", metadata: null,
    });
    (prisma.campaign.findFirst as any).mockResolvedValue({ id: "camp-1" });
    (prisma.post.create as any).mockResolvedValue({ id: "p1" });
    (publishPost as any).mockResolvedValue({ success: false, error: "Rate limited" });
    (prisma.post.update as any).mockResolvedValue({});

    const req = makeReq("http://localhost:3000/api/posts/publish-now", {
      method: "POST",
      body: JSON.stringify({
        content: "Hello",
        platform: "LINKEDIN",
        connectionId: "conn-1",
        campaignId: "camp-1",
      }),
    });
    const res = await POST(req, defaultCtx);

    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toContain("Rate limited");
  });

  it("creates default Quick Posts campaign when no campaignId provided", async () => {
    (prisma.organization.findUniqueOrThrow as any).mockResolvedValue({ publishingPaused: false });
    (prisma.platformConnection.findFirst as any).mockResolvedValue({
      id: "conn-1", orgId: "org-1", platform: "LINKEDIN",
      accessToken: "tok", platformUserId: "u1", metadata: null,
      platformAccountName: "Acct",
    });
    (prisma.campaign.findFirst as any).mockResolvedValue(null); // no existing Quick Posts
    (prisma.campaign.create as any).mockResolvedValue({ id: "auto-camp" });
    (prisma.post.create as any).mockResolvedValue({ id: "p1" });
    (publishPost as any).mockResolvedValue({ success: true, platformPostId: "ext-1" });
    (prisma.post.update as any).mockResolvedValue({ id: "p1", status: "PUBLISHED" });

    const req = makeReq("http://localhost:3000/api/posts/publish-now", {
      method: "POST",
      body: JSON.stringify({
        content: "Hello",
        platform: "LINKEDIN",
        connectionId: "conn-1",
      }),
    });
    const res = await POST(req, defaultCtx);

    expect(res.status).toBe(200);
    expect(prisma.campaign.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Quick Posts" }),
      }),
    );
  });
});
