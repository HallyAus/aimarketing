import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@/lib/db";

const VALID_INTERVALS = [2, 4, 6, 8, 12, 24];

interface AutoScheduleBody {
  intervalHours: number;
  startDate: string;
  endDate?: string | null;
}

// POST /api/campaigns/[campaignId]/auto-schedule
// Spaces out DRAFT posts in the campaign at the given interval
export const POST = withErrorHandler(
  withRole("EDITOR", async (req, context) => {
    const campaignId = (await context.params).campaignId!;
    const body = (await req.json()) as AutoScheduleBody;

    // Validate interval
    if (!body.intervalHours || !VALID_INTERVALS.includes(body.intervalHours)) {
      throw new ZodValidationError(
        `intervalHours must be one of: ${VALID_INTERVALS.join(", ")}`,
      );
    }

    if (!body.startDate) {
      throw new ZodValidationError("startDate is required");
    }

    const startDate = new Date(body.startDate);
    if (isNaN(startDate.getTime())) {
      throw new ZodValidationError("startDate is not a valid date");
    }

    const endDate = body.endDate ? new Date(body.endDate) : null;
    if (endDate && isNaN(endDate.getTime())) {
      throw new ZodValidationError("endDate is not a valid date");
    }

    // Verify campaign belongs to org
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, orgId: req.orgId },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Not found", code: "NOT_FOUND", statusCode: 404 },
        { status: 404 },
      );
    }

    // Get all DRAFT posts in this campaign, ordered by creation date
    const draftPosts = await prisma.post.findMany({
      where: {
        campaignId,
        status: "DRAFT",
      },
      orderBy: { createdAt: "asc" },
    });

    if (draftPosts.length === 0) {
      return NextResponse.json(
        { error: "No draft posts to schedule", code: "NO_DRAFTS", statusCode: 400 },
        { status: 400 },
      );
    }

    const intervalMs = body.intervalHours * 60 * 60 * 1000;
    const scheduledPosts: Array<{ id: string; scheduledAt: Date }> = [];

    // Space out each draft post at the configured interval
    for (let i = 0; i < draftPosts.length; i++) {
      const post = draftPosts[i]!;
      const scheduledAt = new Date(startDate.getTime() + i * intervalMs);

      // If an end date is set, stop scheduling beyond it
      if (endDate && scheduledAt > endDate) {
        break;
      }

      await prisma.post.update({
        where: { id: post.id },
        data: {
          scheduledAt,
          status: "SCHEDULED",
        },
      });

      scheduledPosts.push({ id: post.id, scheduledAt });
    }

    // Store auto-schedule config in campaign metadata (audienceConfig field reused)
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "SCHEDULED",
        startDate,
        ...(endDate && { endDate }),
        audienceConfig: {
          ...(campaign.audienceConfig as Record<string, unknown> | null),
          autoSchedule: {
            enabled: true,
            intervalHours: body.intervalHours,
            startDate: body.startDate,
            endDate: body.endDate ?? null,
          },
        },
        version: { increment: 1 },
      },
    });

    await prisma.auditLog.create({
      data: {
        orgId: req.orgId,
        userId: req.userId,
        action: "AUTO_SCHEDULE",
        entityType: "Campaign",
        entityId: campaignId,
        after: {
          intervalHours: body.intervalHours,
          scheduledCount: scheduledPosts.length,
          totalDrafts: draftPosts.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      scheduledCount: scheduledPosts.length,
      totalDrafts: draftPosts.length,
      posts: scheduledPosts,
    });
  }),
);
