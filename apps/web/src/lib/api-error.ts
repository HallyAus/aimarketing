/**
 * Structured API error handling.
 *
 * Provides an ApiError class and a handleApiError function that maps
 * known error types (including Prisma errors) to appropriate HTTP responses.
 */

import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
  }

  static badRequest(message: string, code = "BAD_REQUEST"): ApiError {
    return new ApiError(400, code, message);
  }

  static unauthorized(message = "Unauthorized"): ApiError {
    return new ApiError(401, "UNAUTHORIZED", message);
  }

  static forbidden(message = "Forbidden"): ApiError {
    return new ApiError(403, "FORBIDDEN", message);
  }

  static notFound(message = "Not found"): ApiError {
    return new ApiError(404, "NOT_FOUND", message);
  }

  static conflict(message = "Conflict"): ApiError {
    return new ApiError(409, "CONFLICT", message);
  }

  static internal(message = "Internal server error"): ApiError {
    return new ApiError(500, "INTERNAL_ERROR", message);
  }
}

/**
 * Convert an error into an appropriate NextResponse.
 *
 * Handles:
 * - ApiError: uses its statusCode/code/message
 * - Prisma P2002: unique constraint violation -> 409 Conflict
 * - Prisma P2025: record not found -> 404 Not Found
 * - Everything else: 500 Internal Server Error
 */
export function handleApiError(error: unknown): NextResponse {
  // Known ApiError
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code, statusCode: error.statusCode },
      { status: error.statusCode },
    );
  }

  // Prisma known errors
  if (isPrismaError(error)) {
    if (error.code === "P2002") {
      const target = (error.meta?.target as string[])?.join(", ") ?? "unknown field";
      return NextResponse.json(
        {
          error: `A record with this ${target} already exists`,
          code: "CONFLICT",
          statusCode: 409,
        },
        { status: 409 },
      );
    }

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Record not found", code: "NOT_FOUND", statusCode: 404 },
        { status: 404 },
      );
    }
  }

  // Unknown error — log and return generic 500
  const message = error instanceof Error ? error.message : "Unknown error";
  logger.error("Unhandled API error", {
    error: message,
    stack: error instanceof Error ? error.stack : undefined,
  });

  return NextResponse.json(
    { error: "Internal server error", code: "INTERNAL_ERROR", statusCode: 500 },
    { status: 500 },
  );
}

/** Type guard for Prisma known request errors */
function isPrismaError(
  error: unknown,
): error is { code: string; meta?: Record<string, unknown> } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as Record<string, unknown>).code === "string" &&
    String((error as Record<string, unknown>).code).startsWith("P")
  );
}
