import { auth } from "./auth";
import { ROLE_HIERARCHY } from "@reachpilot/shared";
import { NextRequest, NextResponse } from "next/server";

type AuthenticatedRequest = NextRequest & {
  userId: string;
  orgId: string;
  role: string;
};

type RouteHandler = (
  req: AuthenticatedRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

export function withAuth(handler: RouteHandler): (req: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<NextResponse> {
  return async (req: NextRequest, context) => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED", statusCode: 401 },
        { status: 401 }
      );
    }

    const orgId = session.user.currentOrgId;
    if (!orgId) {
      return NextResponse.json(
        { error: "No organization selected", code: "NO_ORG", statusCode: 403 },
        { status: 403 }
      );
    }

    const authReq = req as AuthenticatedRequest;
    authReq.userId = session.user.id;
    authReq.orgId = orgId;
    authReq.role = session.user.currentRole ?? "VIEWER";

    return handler(authReq, context);
  };
}

export function withRole(minimumRole: string, handler: RouteHandler): (req: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<NextResponse> {
  return withAuth(async (req, context) => {
    const userLevel = ROLE_HIERARCHY[req.role] ?? 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole] ?? 999;

    if (userLevel < requiredLevel) {
      return NextResponse.json(
        {
          error: "Insufficient permissions",
          code: "FORBIDDEN",
          statusCode: 403,
        },
        { status: 403 }
      );
    }

    return handler(req, context);
  });
}
