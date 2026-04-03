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
// Now queries the Page model directly instead of building from connection metadata
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

    const accounts: ActiveAccount[] = pages.map((p) => ({
      id: p.id, // Internal Page.id (cuid), NOT platformPageId
      platform: p.platform,
      name: p.name,
      type: "page",
      connectionId: p.connectionId,
    }));

    return NextResponse.json({ accounts });
  }),
);
