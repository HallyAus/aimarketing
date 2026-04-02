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
export const GET = withErrorHandler(
  withAuth(async (req) => {
    const connections = await prisma.platformConnection.findMany({
      where: {
        orgId: req.orgId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        platform: true,
        platformAccountName: true,
        platformUserId: true,
        metadata: true,
      },
    });

    const accounts: ActiveAccount[] = [];

    for (const conn of connections) {
      const metadata = (conn.metadata as Record<string, unknown>) ?? {};

      if (conn.platform === "FACEBOOK" || conn.platform === "INSTAGRAM") {
        // For Facebook/Instagram, include saved pages from connection metadata
        const selectedPages = metadata.selectedPages as
          | Array<{ id: string; name: string }>
          | undefined;

        if (selectedPages && selectedPages.length > 0) {
          for (const page of selectedPages) {
            accounts.push({
              id: `${conn.platform.toLowerCase()}-page-${page.id}`,
              platform: conn.platform,
              name: page.name,
              type: "page",
              connectionId: conn.id,
            });
          }
        } else {
          // Fall back to the connection-level account
          accounts.push({
            id: `${conn.platform.toLowerCase()}-${conn.id}`,
            platform: conn.platform,
            name: conn.platformAccountName ?? `${conn.platform} Account`,
            type: "account",
            connectionId: conn.id,
          });
        }
      } else {
        // LinkedIn, Twitter/X, etc. — one account per connection
        accounts.push({
          id: `${conn.platform.toLowerCase()}-${conn.id}`,
          platform: conn.platform,
          name: conn.platformAccountName ?? `${conn.platform} Account`,
          type: "account",
          connectionId: conn.id,
        });
      }
    }

    return NextResponse.json({ accounts });
  }),
);
