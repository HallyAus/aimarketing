import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiError, handleApiError } from "@/lib/api-error";

// Mock the logger to prevent console output during tests
vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// ApiError class construction
// ---------------------------------------------------------------------------
describe("ApiError", () => {
  it("constructs with statusCode, code, and message", () => {
    const err = new ApiError(400, "BAD_REQUEST", "Invalid input");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("BAD_REQUEST");
    expect(err.message).toBe("Invalid input");
    expect(err.name).toBe("ApiError");
  });

  describe("static factory methods", () => {
    it("badRequest creates a 400 error", () => {
      const err = ApiError.badRequest("Missing field");
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe("BAD_REQUEST");
      expect(err.message).toBe("Missing field");
    });

    it("badRequest accepts a custom code", () => {
      const err = ApiError.badRequest("Invalid format", "INVALID_FORMAT");
      expect(err.code).toBe("INVALID_FORMAT");
    });

    it("unauthorized creates a 401 error", () => {
      const err = ApiError.unauthorized();
      expect(err.statusCode).toBe(401);
      expect(err.code).toBe("UNAUTHORIZED");
      expect(err.message).toBe("Unauthorized");
    });

    it("unauthorized accepts custom message", () => {
      const err = ApiError.unauthorized("Token expired");
      expect(err.message).toBe("Token expired");
    });

    it("forbidden creates a 403 error", () => {
      const err = ApiError.forbidden();
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe("FORBIDDEN");
      expect(err.message).toBe("Forbidden");
    });

    it("notFound creates a 404 error", () => {
      const err = ApiError.notFound();
      expect(err.statusCode).toBe(404);
      expect(err.code).toBe("NOT_FOUND");
      expect(err.message).toBe("Not found");
    });

    it("notFound accepts custom message", () => {
      const err = ApiError.notFound("Campaign not found");
      expect(err.message).toBe("Campaign not found");
    });

    it("conflict creates a 409 error", () => {
      const err = ApiError.conflict();
      expect(err.statusCode).toBe(409);
      expect(err.code).toBe("CONFLICT");
    });

    it("internal creates a 500 error", () => {
      const err = ApiError.internal();
      expect(err.statusCode).toBe(500);
      expect(err.code).toBe("INTERNAL_ERROR");
      expect(err.message).toBe("Internal server error");
    });
  });
});

// ---------------------------------------------------------------------------
// handleApiError
// ---------------------------------------------------------------------------
describe("handleApiError", () => {
  it("returns correct status for ApiError instances", async () => {
    const err = ApiError.badRequest("Bad input");
    const response = handleApiError(err);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Bad input");
    expect(body.code).toBe("BAD_REQUEST");
    expect(body.statusCode).toBe(400);
  });

  it("returns 401 for unauthorized ApiError", async () => {
    const err = ApiError.unauthorized();
    const response = handleApiError(err);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.code).toBe("UNAUTHORIZED");
  });

  it("returns 403 for forbidden ApiError", async () => {
    const err = ApiError.forbidden("No access");
    const response = handleApiError(err);

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("No access");
  });

  it("returns 404 for notFound ApiError", async () => {
    const err = ApiError.notFound();
    const response = handleApiError(err);

    expect(response.status).toBe(404);
  });

  it("returns 409 for conflict ApiError", async () => {
    const err = ApiError.conflict("Already exists");
    const response = handleApiError(err);

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toBe("Already exists");
  });

  // Prisma error handling
  it("returns 409 for Prisma P2002 unique constraint violation", async () => {
    const prismaError = {
      code: "P2002",
      meta: { target: ["email"] },
      message: "Unique constraint failed",
    };
    const response = handleApiError(prismaError);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.code).toBe("CONFLICT");
    expect(body.error).toContain("email");
    expect(body.error).toContain("already exists");
  });

  it("returns 409 with 'unknown field' when P2002 has no target", async () => {
    const prismaError = {
      code: "P2002",
      meta: {},
      message: "Unique constraint failed",
    };
    const response = handleApiError(prismaError);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toContain("unknown field");
  });

  it("returns 404 for Prisma P2025 record not found", async () => {
    const prismaError = {
      code: "P2025",
      message: "Record not found",
    };
    const response = handleApiError(prismaError);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.code).toBe("NOT_FOUND");
  });

  // Unknown errors
  it("returns 500 for unknown Error instances", async () => {
    const err = new Error("Something broke internally");
    const response = handleApiError(err);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.code).toBe("INTERNAL_ERROR");
    // Should NOT leak the original error message
    expect(body.error).toBe("Internal server error");
  });

  it("returns 500 for non-Error objects", async () => {
    const response = handleApiError("some string error");
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.code).toBe("INTERNAL_ERROR");
    expect(body.error).toBe("Internal server error");
  });

  it("returns 500 for null/undefined errors", async () => {
    const response = handleApiError(null);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.code).toBe("INTERNAL_ERROR");
  });

  it("does not leak internal details for unknown errors", async () => {
    const err = new Error("Database connection string: postgres://secret@host");
    const response = handleApiError(err);
    const body = await response.json();

    expect(body.error).not.toContain("postgres://");
    expect(body.error).not.toContain("secret");
    expect(body.error).toBe("Internal server error");
  });
});
