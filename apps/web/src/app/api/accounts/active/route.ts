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
    // Query both pages and connections in parallel
    const [pages, connections] = await Promise.all([
      prisma.page.findMany({
        where: { orgId: req.orgId, isActive: true },
        select: {
          id: true,
          platform: true,
          name: true,
          platformPageId: true,
          connectionId: true,
        },
      }),
      prisma.platformConnection.findMany({
        where: { orgId: req.orgId, status: "ACTIVE" },
        select: {
          id: true,
          platform: true,
          platformAccountName: true,
          platformUserId: true,
        },
      }),
    ]);

    const accounts: ActiveAccount[] = [];

    // Add all active pages
    for (const p of pages) {
      accounts.push({
        id: p.id,
        platform: p.platform,
        name: p.name,
        type: "page",
        connectionId: p.connectionId,
      });
    }

    // For any connected platform that has no pages, add the connection itself
    const platformsWithPages = new Set(pages.map((p) => p.platform));
    for (const c of connections) {
      if (!platformsWithPages.has(c.platform)) {
        accounts.push({
          id: c.id,
          platform: c.platform,
          name: c.platformAccountName ?? c.platform,
          type: "account",
          connectionId: c.id,
        });
      }
    }

    return NextResponse.json(
      { accounts },
      { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=120" } },
    );
  }),
);
