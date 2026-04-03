import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { apiRateLimiter, authRateLimiter } from "./lib/rate-limit";

export default async function middleware(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const { pathname } = req.nextUrl;

  // ── Admin login page — always accessible (no auth required) ───────
  if (pathname === "/admin/login") {
    const response = NextResponse.next();
    response.headers.set("x-request-id", requestId);
    return response;
  }

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
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    cookieName: "__Secure-authjs.session-token",
  });

  // ── Admin routes — require auth + admin systemRole ────────────────
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin/")) {
    if (!token) {
      if (pathname.startsWith("/api/admin/")) {
        return NextResponse.json(
          { error: "Unauthorized", code: "UNAUTHORIZED", statusCode: 401 },
          { status: 401, headers: { "x-request-id": requestId } }
        );
      }
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check admin role from JWT
    const systemRole = token.systemRole as string | undefined;
    if (systemRole !== "ADMIN" && systemRole !== "SUPER_ADMIN") {
      if (pathname.startsWith("/api/admin/")) {
        return NextResponse.json(
          { error: "Forbidden", code: "FORBIDDEN", statusCode: 403 },
          { status: 403, headers: { "x-request-id": requestId } }
        );
      }
      // Non-admin users trying to access /admin pages get a 403 redirect
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("error", "forbidden");
      return NextResponse.redirect(loginUrl);
    }

    const response = NextResponse.next();
    response.headers.set("x-request-id", requestId);
    return response;
  }

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

  // ── 2FA enforcement — redirect to /2fa-verify if 2FA is required but not verified
  if (
    token.requiresTwoFactor &&
    !token.twoFactorVerified &&
    !pathname.startsWith("/api/auth/2fa/") &&
    pathname !== "/2fa-verify"
  ) {
    // Check if the user just verified 2FA (cookie set by the verify endpoint)
    const twoFaCookie = req.cookies.get("__2fa-verified");
    if (twoFaCookie) {
      // Allow through — the JWT callback will pick up the verified state
      const response = NextResponse.next();
      response.headers.set("x-request-id", requestId);
      return response;
    }

    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Two-factor authentication required", code: "2FA_REQUIRED", statusCode: 403 },
        { status: 403, headers: { "x-request-id": requestId } }
      );
    }
    const twoFaUrl = new URL("/2fa-verify", req.url);
    return NextResponse.redirect(twoFaUrl);
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
    "/drafts/:path*",
    "/leads/:path*",
    "/approvals/:path*",
    "/email/:path*",
    "/reports/:path*",
    "/tools/:path*",
    "/api/:path*",
    "/admin/:path*",
    "/2fa-verify",
  ],
};
