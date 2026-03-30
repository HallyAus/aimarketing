import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { apiRateLimiter, authRateLimiter } from "./lib/rate-limit";

export default async function middleware(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const { pathname } = req.nextUrl;

  // Auth routes — apply auth rate limiter only
  if (pathname.startsWith("/api/auth/")) {
    try {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
      await authRateLimiter.consume(ip);
    } catch {
      return NextResponse.json(
        { error: "Too many requests", code: "RATE_LIMITED", statusCode: 429 },
        { status: 429, headers: { "x-request-id": requestId } }
      );
    }
    const response = NextResponse.next();
    response.headers.set("x-request-id", requestId);
    return response;
  }

  // Public API routes — no auth required
  if (pathname.startsWith("/api/health") || pathname.startsWith("/api/webhooks/")) {
    const response = NextResponse.next();
    response.headers.set("x-request-id", requestId);
    return response;
  }

  // Protected API and dashboard routes — verify JWT
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED", statusCode: 401 },
        { status: 401, headers: { "x-request-id": requestId } }
      );
    }
    // App routes — redirect to sign-in
    const signInUrl = new URL("/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Apply API rate limiter for authenticated API routes
  if (pathname.startsWith("/api/")) {
    try {
      const key = (token.userId as string) ?? "unknown";
      await apiRateLimiter.consume(key);
    } catch {
      return NextResponse.json(
        { error: "Too many requests", code: "RATE_LIMITED", statusCode: 429 },
        { status: 429, headers: { "x-request-id": requestId } }
      );
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/campaigns/:path*",
    "/analytics/:path*",
    "/calendar/:path*",
    "/ai/:path*",
    "/templates/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
    "/org-picker/:path*",
    "/api/:path*",
  ],
};
