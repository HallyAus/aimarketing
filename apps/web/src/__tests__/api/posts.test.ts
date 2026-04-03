import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  prisma: {
    post: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    auditLog: { create: vi.fn() },
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
  withAuth: (handler: Function) =>
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
  updatePostSchema: {
    safeParse: vi.fn((data: any) => {
      if (!data.version && data.version !== 0) {
        return { success: false, error: { issues: [{ message: "version is required" }] } };
      }
      return { success: true, data };
    }),
  },
  rejectPostSchema: {
    safeParse: vi.fn((data: any) => {
      if (!data.reason) {
        return { success: false, error: { issues: [{ message: "reason is required" }] } };
      }
      return { success: true, data };
    }),
  },
  isValidTransition: vi.fn((_from: string, to: string) => {
    // Simplified: allow PENDING_APPROVAL -> APPROVED/REJECTED, DRAFT -> SCHEDULED
    return true;
  }),
  sanitizeHtml: (s: string) => s,
}));

import { prisma } from "@/lib/db";

// ── Helpers ──────────────────────────────────────────────────────────

function makeReq(url: string, init?: Record<string, unknown>) {
  return new NextRequest(new URL(url, "http://localhost:3000"), init as never);
}

// ── PATCH & DELETE /api/posts/[postId] ──────────────────────────────

describe("PATCH /api/posts/[postId]", () => {
  let PATCH: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/posts/[postId]/route");
    PATCH = mod.PATCH;
  });

  it("updates a post (200)", async () => {
    const existing = { id: "p1", orgId: "org-1", version: 1, status: "DRAFT" };
    (prisma.post.findFirst as any).mockResolvedValue(existing);
    (prisma.post.update as any).mockResolvedValue({ ...existing, content: "Updated", version: 2 });

    const req = makeReq("http://localhost:3000/api/posts/p1", {
      method: "PATCH",
      body: JSON.stringify({ content: "Updated", version: 1 }),
    });
    const ctx = { params: Promise.resolve({ postId: "p1" }) };
    const res = await PATCH(req, ctx);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.content).toBe("Updated");
  });

  it("returns 404 when post not found", async () => {
    (prisma.post.findFirst as any).mockResolvedValue(null);

    const req = makeReq("http://localhost:3000/api/posts/p999", {
      method: "PATCH",
      body: JSON.stringify({ content: "x", version: 1 }),
    });
    const ctx = { params: Promise.resolve({ postId: "p999" }) };
    const res = await PATCH(req, ctx);

    expect(res.status).toBe(404);
  });

  it("returns 409 on version conflict", async () => {
    (prisma.post.findFirst as any).mockResolvedValue({
      id: "p1", orgId: "org-1", version: 3, status: "DRAFT",
    });

    const req = makeReq("http://localhost:3000/api/posts/p1", {
      method: "PATCH",
      body: JSON.stringify({ content: "x", version: 1 }),
    });
    const ctx = { params: Promise.resolve({ postId: "p1" }) };
    const res = await PATCH(req, ctx);

    expect(res.status).toBe(409);
  });

  it("returns 400 when editing PUBLISHED post", async () => {
    (prisma.post.findFirst as any).mockResolvedValue({
      id: "p1", orgId: "org-1", version: 1, status: "PUBLISHED",
    });

    const req = makeReq("http://localhost:3000/api/posts/p1", {
      method: "PATCH",
      body: JSON.stringify({ content: "x", version: 1 }),
    });
    const ctx = { params: Promise.resolve({ postId: "p1" }) };
    const res = await PATCH(req, ctx);

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/posts/[postId]", () => {
  let DELETE: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/posts/[postId]/route");
    DELETE = mod.DELETE;
  });

  it("deletes a draft post (200)", async () => {
    (prisma.post.findFirst as any).mockResolvedValue({ id: "p1", orgId: "org-1", status: "DRAFT" });
    (prisma.post.delete as any).mockResolvedValue({});

    const req = makeReq("http://localhost:3000/api/posts/p1", { method: "DELETE" });
    const ctx = { params: Promise.resolve({ postId: "p1" }) };
    const res = await DELETE(req, ctx);

    expect(res.status).toBe(200);
    expect(prisma.post.delete).toHaveBeenCalled();
  });

  it("soft-deletes a published post", async () => {
    (prisma.post.findFirst as any).mockResolvedValue({ id: "p1", orgId: "org-1", status: "PUBLISHED" });
    (prisma.post.update as any).mockResolvedValue({});

    const req = makeReq("http://localhost:3000/api/posts/p1", { method: "DELETE" });
    const ctx = { params: Promise.resolve({ postId: "p1" }) };
    const res = await DELETE(req, ctx);

    expect(res.status).toBe(200);
    expect(prisma.post.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "DELETED" }) }),
    );
  });

  it("returns 404 when post not found", async () => {
    (prisma.post.findFirst as any).mockResolvedValue(null);

    const req = makeReq("http://localhost:3000/api/posts/missing", { method: "DELETE" });
    const ctx = { params: Promise.resolve({ postId: "missing" }) };
    const res = await DELETE(req, ctx);

    expect(res.status).toBe(404);
  });
});

// ── POST /api/posts/[postId]/approve ────────────────────────────────

describe("POST /api/posts/[postId]/approve", () => {
  let POST_APPROVE: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/posts/[postId]/approve/route");
    POST_APPROVE = mod.POST;
  });

  it("approves a post (200)", async () => {
    const post = { id: "p1", orgId: "org-1", status: "PENDING_APPROVAL", scheduledAt: null };
    (prisma.post.findFirst as any).mockResolvedValue(post);
    (prisma.post.update as any).mockResolvedValue({ ...post, status: "APPROVED" });
    (prisma.auditLog.create as any).mockResolvedValue({});

    const req = makeReq("http://localhost:3000/api/posts/p1/approve", { method: "POST" });
    const ctx = { params: Promise.resolve({ postId: "p1" }) };
    const res = await POST_APPROVE(req, ctx);

    expect(res.status).toBe(200);
  });

  it("returns 404 when post not found", async () => {
    (prisma.post.findFirst as any).mockResolvedValue(null);

    const req = makeReq("http://localhost:3000/api/posts/p999/approve", { method: "POST" });
    const ctx = { params: Promise.resolve({ postId: "p999" }) };
    const res = await POST_APPROVE(req, ctx);

    expect(res.status).toBe(404);
  });
});

// ── POST /api/posts/[postId]/reject ─────────────────────────────────

describe("POST /api/posts/[postId]/reject", () => {
  let POST_REJECT: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/posts/[postId]/reject/route");
    POST_REJECT = mod.POST;
  });

  it("rejects a post with reason (200)", async () => {
    const post = { id: "p1", orgId: "org-1", status: "PENDING_APPROVAL" };
    (prisma.post.findFirst as any).mockResolvedValue(post);
    (prisma.post.update as any).mockResolvedValue({ ...post, status: "REJECTED" });
    (prisma.auditLog.create as any).mockResolvedValue({});

    const req = makeReq("http://localhost:3000/api/posts/p1/reject", {
      method: "POST",
      body: JSON.stringify({ reason: "Needs changes" }),
    });
    const ctx = { params: Promise.resolve({ postId: "p1" }) };
    const res = await POST_REJECT(req, ctx);

    expect(res.status).toBe(200);
  });

  it("returns 404 when post not found", async () => {
    (prisma.post.findFirst as any).mockResolvedValue(null);

    const req = makeReq("http://localhost:3000/api/posts/p1/reject", {
      method: "POST",
      body: JSON.stringify({ reason: "bad" }),
    });
    const ctx = { params: Promise.resolve({ postId: "p1" }) };
    const res = await POST_REJECT(req, ctx);

    expect(res.status).toBe(404);
  });

  it("throws on missing reason", async () => {
    const req = makeReq("http://localhost:3000/api/posts/p1/reject", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const ctx = { params: Promise.resolve({ postId: "p1" }) };

    await expect(POST_REJECT(req, ctx)).rejects.toThrow();
  });
});
