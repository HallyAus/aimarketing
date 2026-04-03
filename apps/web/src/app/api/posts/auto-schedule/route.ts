import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { isValidTransition, sanitizeHtml } from "@adpilot/shared";
import { getTimezoneFromCookie } from "@/lib/timezone";

interface AutoScheduleBody {
  /** Schedule an existing post by ID */
  postId?: string;
  /** Schedule multiple existing posts by ID */
  postIds?: string[];
  /** Create + schedule new posts from draft content */
  drafts?: Array<{ content: string; platform: string; mediaUrls?: string[]; pageId?: string; pageName?: string }>;
  /** Campaign to schedule into (auto-creates "Scheduled Posts" if omitted) */
  campaignId?: string;
  /** Hours between each post (default 6) */
  intervalHours?: number;
  /** Page/account ID for all posts in this batch */
  pageId?: string;
  /** Human-readable page name */
  pageName?: string;
}

/** Compute timezone offset in minutes from IANA timezone string */
function getTzOffsetMinutes(tz: string): number {
  try {
    const now = new Date();
    const utcStr = now.toLocaleString("en-US", { timeZone: "UTC" });
    const tzStr = now.toLocaleString("en-US", { timeZone: tz });
    const utcDate = new Date(utcStr);
    const tzDate = new Date(tzStr);
    return Math.round((tzDate.getTime() - utcDate.getTime()) / 60000);
  } catch {
    return 600; // fallback to AEST
  }
}

/** AEST offset: UTC+10 = 600 minutes (fallback) */
const DEFAULT_TZ_OFFSET_MINUTES = 600;
const DEFAULT_INTERVAL_HOURS = 6;
const NIGHT_START_HOUR = 22; // 10 PM
const NIGHT_END_HOUR = 7;   // 7 AM
const DAY_START_HOUR = 9;   // 9 AM — default first-post time

function toLocalHour(utc: Date, offsetMinutes: number = DEFAULT_TZ_OFFSET_MINUTES): number {
  const local = new Date(utc.getTime() + offsetMinutes * 60_000);
  return local.getUTCHours();
}

function setLocalHour(utc: Date, hour: number, offsetMinutes: number = DEFAULT_TZ_OFFSET_MINUTES): Date {
  const local = new Date(utc.getTime() + offsetMinutes * 60_000);
  local.setUTCHours(hour, 0, 0, 0);
  return new Date(local.getTime() - offsetMinutes * 60_000);
}

/**
 * If the candidate time falls in the overnight window (10 PM - 7 AM local),
 * push it to 7 AM the next morning.
 */
function skipOvernight(candidate: Date, offsetMinutes: number = DEFAULT_TZ_OFFSET_MINUTES): Date {
  const h = toLocalHour(candidate, offsetMinutes);
  if (h >= NIGHT_START_HOUR || h < NIGHT_END_HOUR) {
    let morning = setLocalHour(candidate, NIGHT_END_HOUR, offsetMinutes);
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

function nextSlot(after: Date, intervalHours: number, offsetMinutes: number = DEFAULT_TZ_OFFSET_MINUTES): Date {
  const candidate = new Date(after.getTime() + intervalHours * 60 * 60_000);
  return skipOvernight(candidate, offsetMinutes);
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

    // Read user timezone from cookie for local time calculations
    let userTz = "UTC";
    try {
      const cookieHeader = req.headers.get("cookie");
      userTz = getTimezoneFromCookie(cookieHeader);
    } catch {
      // Fallback to UTC if cookie parsing fails
    }
    const tzOffset = getTzOffsetMinutes(userTz);

    // Check if publishing is paused — allow scheduling but return a warning
    const org = await prisma.organization.findUniqueOrThrow({
      where: { id: req.orgId },
      select: { publishingPaused: true },
    });
    const publishingPausedWarning = org.publishingPaused
      ? "Publishing is currently paused. Posts are scheduled but will not be published until publishing is resumed."
      : undefined;

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
            pageId: draft.pageId ?? body.pageId ?? null,
            pageName: draft.pageName ?? body.pageName ?? null,
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
      cursor = setLocalHour(tomorrow, DAY_START_HOUR, tzOffset);
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

      cursor = nextSlot(cursor, intervalHours, tzOffset);

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

    return NextResponse.json({
      scheduled,
      campaignId,
      ...(publishingPausedWarning ? { warning: publishingPausedWarning } : {}),
    }, { status: 200 });
  }),
);
