import { NextRequest, NextResponse } from "next/server";

export function withErrorHandler(
  handler: (
    req: NextRequest,
    context: { params: Promise<Record<string, string>> }
  ) => Promise<NextResponse>
) {
  return async (
    req: NextRequest,
    context: { params: Promise<Record<string, string>> }
  ) => {
    try {
      return await handler(req, context);
    } catch (error) {
      console.error("[API Error]", {
        path: req.nextUrl.pathname,
        method: req.method,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      if (error instanceof ZodValidationError) {
        return NextResponse.json(
          { error: error.message, code: "VALIDATION_ERROR", statusCode: 400 },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Internal server error", code: "INTERNAL_ERROR", statusCode: 500 },
        { status: 500 }
      );
    }
  };
}

export class ZodValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ZodValidationError";
  }
}
