import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { isValidTransition, sanitizeHtml } from "@adpilot/shared";

interface AutoScheduleBody {
  /** Schedule an existing post by ID */
  postId?: string;
  /** Schedule multiple existing posts by ID */
  postIds?: string[];
  /** Create + schedule new posts from draft content */
  drafts?: Array<{ content: string; platform: string; mediaUrls?: string[] }>;
  /** Campaign to schedule into (auto-creates "Scheduled Posts" if omitted) */
  campaignId?: string;
  /** Hours between each post (default 6) */
  intervalHours?: number;
}

/** AEST offset: UTC+10 = 600 minutes */
const DEFAULT_TZ_OFFSET_MINUTES = 600;
const DEFAULT_INTERVAL_HOURS = 6;
const NIGHT_START_HOUR = 22; // 10 PM
const NIGHT_END_HOUR = 7;   // 7 AM
const DAY_START_HOUR = 9;   // 9 AM — default first-post time

function toLocalHour(utc: Date): number {
  const local = new Date(utc.getTime() + DEFAULT_TZ_OFFSET_MINUTES * 60_000);
  return local.getUTCHours();
}

function setLocalHour(utc: Date, hour: number): Date {
  const local = new Date(utc.getTime() + DEFAULT_TZ_OFFSET_MINUTES * 60_000);
  local.setUTCHours(hour, 0, 0, 0);
  return new Date(local.getTime() - DEFAULT_TZ_OFFSET_MINUTES * 60_000);
}

/**
 * If the candidate time falls in the overnight window (10 PM - 7 AM local),
 * push it to 7 AM the next morning.
 */
function skipOvernight(candidate: Date): Date {
  const h = toLocalHour(candidate);
  if (h >= NIGHT_START_HOUR || h < NIGHT_END_HOUR) {
    let morning = setLocalHour(candidate, NIGHT_END_HOUR);
    if (h >= NIGHT_START_HOUR) {
      morning = new Date(morning.getTime() + 24 * 60 * 60_000);
    }
    if (morning <= candidate) {
      morning = new Date(morning.getTime() + 24 * 60 * 60_000);
    }
    return morning;
  }
  return candidate;
}

function nextSlot(after: Date, intervalHours: number): Date {
  const candidate = new Date(after.getTime() + intervalHours * 60 * 60_000);
  return skipOvernight(candidate);
}

async function getOrCreateCampaign(
  campaignId: string | undefined,
  orgId: string,
  userId: string,
): Promise<string> {
  if (campaignId) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, orgId },
    });
    if (!campaign) {
      throw new ZodValidationError("Campaign not found");
    }
    return campaign.id;
  }

  // Auto-create a "Scheduled Posts" campaign
  const existing = await prisma.campaign.findFirst({
    where: { orgId, name: "Scheduled Posts" },
  });
  if (existing) return existing.id;

  const created = await prisma.campaign.create({
    data: {
      orgId,
      name: "Scheduled Posts",
      objective: "ENGAGEMENT",
      status: "SCHEDULED",
      createdBy: userId,
      targetPlatforms: [],
    },
  });
  return created.id;
}

async function findLastPostTime(
  orgId: string,
  campaignId: string,
): Promise<Date | null> {
  const post = await prisma.post.findFirst({
    where: {
      orgId,
      campaignId,
      status: { in: ["SCHEDULED", "PUBLISHED"] },
      scheduledAt: { not: null },
    },
    orderBy: { scheduledAt: "desc" },
    select: { scheduledAt: true },
  });
  return post?.scheduledAt ?? null;
}

// POST /api/posts/auto-schedule
export const POST = withErrorHandler(
  withRole("EDITOR", async (req) => {
    const body: AutoScheduleBody = await req.json();
    const intervalHours = body.intervalHours ?? DEFAULT_INTERVAL_HOURS;

    // Resolve campaign (auto-creates if needed)
    const campaignId = await getOrCreateCampaign(body.campaignId, req.orgId, req.userId);

    // Collect existing post IDs
    const existingIds: string[] = [];
    if (body.postId) existingIds.push(body.postId);
    if (body.postIds) existingIds.push(...body.postIds);

    // Create new posts from drafts if provided
    const newPostIds: string[] = [];
    if (body.drafts && body.drafts.length > 0) {
      for (const draft of body.drafts) {
        if (!draft.content?.trim()) continue;
        const post = await prisma.post.create({
          data: {
            orgId: req.orgId,
            campaignId,
            platform: draft.platform as never,
            content: sanitizeHtml(draft.content),
            mediaUrls: draft.mediaUrls ?? [],
            status: "DRAFT",
          },
        });
        newPostIds.push(post.id);
      }
    }

    const allIds = [...existingIds, ...newPostIds];
    if (allIds.length === 0) {
      throw new ZodValidationError("postId, postIds, or drafts is required");
    }

    // Fetch all posts to schedule
    const posts = await prisma.post.findMany({
      where: { id: { in: allIds }, orgId: req.orgId },
      orderBy: { createdAt: "asc" },
    });

    if (posts.length === 0) {
      return NextResponse.json(
        { error: "No matching posts found", code: "NOT_FOUND", statusCode: 404 },
        { status: 404 },
      );
    }

    // Find the anchor time
    const lastTime = await findLastPostTime(req.orgId, campaignId);

    let cursor: Date;
    if (lastTime && lastTime > new Date()) {
      cursor = lastTime;
    } else {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60_000);
      cursor = setLocalHour(tomorrow, DAY_START_HOUR);
      if (cursor <= now) {
        cursor = new Date(cursor.getTime() + 24 * 60 * 60_000);
      }
      // Offset back so first nextSlot() lands on this time
      cursor = new Date(cursor.getTime() - intervalHours * 60 * 60_000);
    }

    const scheduled: Array<{ postId: string; scheduledAt: string }> = [];

    for (const post of posts) {
      if (!isValidTransition(post.status, "SCHEDULED")) {
        continue;
      }

      cursor = nextSlot(cursor, intervalHours);

      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: "SCHEDULED",
          scheduledAt: cursor,
          campaignId,
          version: { increment: 1 },
        },
      });

      scheduled.push({
        postId: post.id,
        scheduledAt: cursor.toISOString(),
      });
    }

    await prisma.auditLog
      .create({
        data: {
          orgId: req.orgId,
          userId: req.userId,
          action: "AUTO_SCHEDULE",
          entityType: "Post",
          entityId: campaignId,
          after: {
            count: scheduled.length,
            campaignId,
            intervalHours,
            posts: scheduled,
          },
        },
      })
      .catch((err) => console.error("[autoSchedule] auditLog error:", err));

    return NextResponse.json({ scheduled, campaignId }, { status: 200 });
  }),
);
