import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";

type AdminHandler = (
  req: NextRequest,
  context: { token: { userId: string; systemRole: string } }
) => Promise<NextResponse | Response>;

/**
 * Wraps an API route handler requiring ADMIN or SUPER_ADMIN systemRole.
 * Returns 401 if not authenticated, 403 if not an admin.
 * Logs admin access to AuditLog.
 */
export function withAdmin(handler: AdminHandler) {
  return async (req: NextRequest) => {
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
      cookieName: "__Secure-authjs.session-token",
    });

    if (!token?.userId) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const systemRole = token.systemRole as string | undefined;
    if (systemRole !== "ADMIN" && systemRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: admin access required", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // Log admin access asynchronously (don't block the response)
    const { pathname } = req.nextUrl;
    logAdminAccess(
      token.userId as string,
      req.method,
      pathname,
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
      req.headers.get("user-agent") ?? undefined
    ).catch(() => {
      // Silently ignore audit log failures — don't break admin operations
    });

    return handler(req, {
      token: {
        userId: token.userId as string,
        systemRole: systemRole as string,
      },
    });
  };
}

/**
 * Wraps an API route handler requiring SUPER_ADMIN systemRole only.
 * Returns 401 if not authenticated, 403 if not a super admin.
 * Logs admin access to AuditLog.
 */
export function withSuperAdmin(handler: AdminHandler) {
  return async (req: NextRequest) => {
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
      cookieName: "__Secure-authjs.session-token",
    });

    if (!token?.userId) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const systemRole = token.systemRole as string | undefined;
    if (systemRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: super admin access required", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const { pathname } = req.nextUrl;
    logAdminAccess(
      token.userId as string,
      req.method,
      pathname,
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
      req.headers.get("user-agent") ?? undefined
    ).catch(() => {});

    return handler(req, {
      token: {
        userId: token.userId as string,
        systemRole: systemRole as string,
      },
    });
  };
}

async function logAdminAccess(
  userId: string,
  method: string,
  path: string,
  ipAddress?: string,
  userAgent?: string
) {
  await prisma.auditLog.create({
    data: {
      userId,
      action: `ADMIN_ACCESS:${method}`,
      entityType: "ADMIN_ROUTE",
      entityId: path,
      ipAddress,
      userAgent,
    },
  });
}
