import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";

// POST /api/posts/backfill-pages
// Backfills pageId/pageName on posts that have NULL pageId,
// using the selectedPages metadata from platform connections.
export const POST = withErrorHandler(
  withRole("ADMIN", async (req) => {
    // Get all active platform connections for this org
    const connections = await prisma.platformConnection.findMany({
      where: { orgId: req.orgId, status: "ACTIVE" },
    });

    let updated = 0;
    let skipped = 0;

    for (const connection of connections) {
      const meta = connection.metadata as Record<string, unknown> | null;
      const selectedPages = meta?.selectedPages as
        | Array<{ id: string; name?: string }>
        | undefined;

      // Skip connections with no selectedPages or multiple pages (ambiguous)
      if (!selectedPages || selectedPages.length === 0) {
        continue;
      }
      if (selectedPages.length > 1) {
        // Can't determine which page — count posts that would need backfill
        const count = await prisma.post.count({
          where: {
            orgId: req.orgId,
            platform: connection.platform,
            pageId: null,
          },
        });
        skipped += count;
        continue;
      }

      // Exactly 1 page selected — assign all NULL-pageId posts for this platform
      const page = selectedPages[0]!;
      const pageName = page.name ?? connection.platformAccountName ?? null;

      const result = await prisma.post.updateMany({
        where: {
          orgId: req.orgId,
          platform: connection.platform,
          pageId: null,
        },
        data: {
          pageId: page.id,
          pageName: pageName,
        },
      });

      updated += result.count;
    }

    await prisma.auditLog
      .create({
        data: {
          orgId: req.orgId,
          userId: req.userId,
          action: "BACKFILL_PAGE_ASSIGNMENTS",
          entityType: "Post",
          entityId: req.orgId,
          after: { updated, skipped },
        },
      })
      .catch((err) => console.error("[backfillPages] auditLog error:", err));

    return NextResponse.json({ updated, skipped });
  }),
);
