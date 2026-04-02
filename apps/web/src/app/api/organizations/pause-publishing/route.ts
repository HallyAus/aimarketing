import { NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";

// GET /api/organizations/pause-publishing
// Returns current publishingPaused state
export const GET = withErrorHandler(
  withAuth(async (req) => {
    const org = await prisma.organization.findUniqueOrThrow({
      where: { id: req.orgId },
      select: { publishingPaused: true },
    });
    return NextResponse.json({ paused: org.publishingPaused });
  }),
);

// POST /api/organizations/pause-publishing
// Toggles the publishingPaused flag on the current organization
export const POST = withErrorHandler(
  withRole("ADMIN", async (req) => {
    const org = await prisma.organization.findUniqueOrThrow({
      where: { id: req.orgId },
      select: { publishingPaused: true },
    });

    const updated = await prisma.organization.update({
      where: { id: req.orgId },
      data: { publishingPaused: !org.publishingPaused },
      select: { publishingPaused: true },
    });

    await prisma.auditLog
      .create({
        data: {
          orgId: req.orgId,
          userId: req.userId,
          action: updated.publishingPaused ? "PAUSE_PUBLISHING" : "RESUME_PUBLISHING",
          entityType: "Organization",
          entityId: req.orgId,
          before: { publishingPaused: org.publishingPaused },
          after: { publishingPaused: updated.publishingPaused },
        },
      })
      .catch((err) => console.error("[pausePublishing] auditLog error:", err));

    return NextResponse.json({ paused: updated.publishingPaused });
  }),
);
