import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";

export interface ActiveAccount {
  id: string;
  platform: string;
  name: string;
  type: "page" | "account";
  connectionId: string;
}

// GET /api/accounts/active — returns all accounts/pages the user can post to
// Queries Page records first; falls back to PlatformConnections if no pages exist
export const GET = withErrorHandler(
  withAuth(async (req) => {
    // Query Page model records directly — these are the first-class entities
    const pages = await prisma.page.findMany({
      where: { orgId: req.orgId, isActive: true },
      select: {
        id: true,
        platform: true,
        name: true,
        platformPageId: true,
        connectionId: true,
      },
    });

    if (pages.length > 0) {
      const accounts: ActiveAccount[] = pages.map((p) => ({
        id: p.id,
        platform: p.platform,
        name: p.name,
        type: "page",
        connectionId: p.connectionId,
      }));
      return NextResponse.json({ accounts });
    }

    // Fallback: if no Page records exist yet, show active PlatformConnections
    // so the user can see their connected accounts and filter by them
    const connections = await prisma.platformConnection.findMany({
      where: { orgId: req.orgId, status: "ACTIVE" },
      select: {
        id: true,
        platform: true,
        platformAccountName: true,
        platformUserId: true,
      },
    });

    const accounts: ActiveAccount[] = connections.map((c) => ({
      id: c.id,
      platform: c.platform,
      name: c.platformAccountName ?? c.platform,
      type: "account",
      connectionId: c.id,
    }));

    return NextResponse.json({ accounts });
  }),
);
