import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    organization: { create: vi.fn() },
    membership: { create: vi.fn() },
    $transaction: vi.fn((cb: Function) => cb({
      user: { create: vi.fn().mockResolvedValue({ id: "u1" }) },
      organization: { create: vi.fn().mockResolvedValue({ id: "org-1" }) },
      membership: { create: vi.fn().mockResolvedValue({}) },
    })),
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2a$12$hashed"),
  },
}));

import { prisma } from "@/lib/db";

// ── Helpers ──────────────────────────────────────────────────────────

function makeReq(url: string, body: unknown, headers?: Record<string, string>) {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "127.0.0.1",
      ...headers,
    },
  });
}

// ── POST /api/auth/signup ────────────────────────────────────────────

describe("POST /api/auth/signup", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/auth/signup/route");
    POST = mod.POST;
  });

  it("creates a new account (201)", async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);

    const res = await POST(
      makeReq("/api/auth/signup", {
        email: "new@example.com",
        password: "password123",
        name: "Test User",
      }),
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("returns 400 for invalid email", async () => {
    const res = await POST(
      makeReq("/api/auth/signup", {
        email: "not-an-email",
        password: "password123",
        name: "Test",
      }),
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 for short password", async () => {
    const res = await POST(
      makeReq("/api/auth/signup", {
        email: "test@example.com",
        password: "123",
        name: "Test",
      }),
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 for missing name", async () => {
    const res = await POST(
      makeReq("/api/auth/signup", {
        email: "test@example.com",
        password: "password123",
        name: "",
      }),
    );

    expect(res.status).toBe(400);
  });

  it("returns 409 for duplicate email", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: "existing" });

    const res = await POST(
      makeReq("/api/auth/signup", {
        email: "existing@example.com",
        password: "password123",
        name: "Test",
      }),
    );

    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toContain("already exists");
  });
});

// ── POST /api/auth/forgot-password ───────────────────────────────────

describe("POST /api/auth/forgot-password", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/auth/forgot-password/route");
    POST = mod.POST;
  });

  it("always returns success to prevent email enumeration (200)", async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);

    const res = await POST(
      makeReq("/api/auth/forgot-password", { email: "nobody@example.com" }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("generates reset token when user exists", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: "u1", password: "hashed" });
    (prisma.user.update as any).mockResolvedValue({});

    const res = await POST(
      makeReq("/api/auth/forgot-password", { email: "user@example.com" }),
    );

    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ passwordResetToken: expect.any(String) }),
      }),
    );
  });

  it("returns success even for invalid email format", async () => {
    const res = await POST(
      makeReq("/api/auth/forgot-password", { email: "bad" }),
    );

    expect(res.status).toBe(200);
  });
});

// ── POST /api/auth/reset-password ────────────────────────────────────

describe("POST /api/auth/reset-password", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/auth/reset-password/route");
    POST = mod.POST;
  });

  it("resets password with valid token (200)", async () => {
    (prisma.user.findFirst as any).mockResolvedValue({ id: "u1" });
    (prisma.user.update as any).mockResolvedValue({});

    const res = await POST(
      makeReq("/api/auth/reset-password", {
        token: "valid-token-abc",
        password: "newpassword123",
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("returns 400 for invalid/expired token", async () => {
    (prisma.user.findFirst as any).mockResolvedValue(null);

    const res = await POST(
      makeReq("/api/auth/reset-password", {
        token: "expired-token",
        password: "newpassword123",
      }),
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Invalid or expired");
  });

  it("returns 400 for short password", async () => {
    const res = await POST(
      makeReq("/api/auth/reset-password", {
        token: "some-token",
        password: "abc",
      }),
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 for missing token", async () => {
    const res = await POST(
      makeReq("/api/auth/reset-password", { password: "newpass12345" }),
    );

    expect(res.status).toBe(400);
  });
});
