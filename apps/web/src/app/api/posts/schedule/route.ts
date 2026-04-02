import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { sanitizeHtml } from "@adpilot/shared";

interface SchedulePostBody {
  content: string;
  platform: string;
  campaignId: string;
  scheduledAt: string;
  mediaUrls?: string[];
}

interface ScheduleAllBody {
  posts: Array<{
    content: string;
    platform: string;
  }>;
  campaignId: string;
  startAt: string;
  intervalMinutes: number;
  mediaUrls?: string[];
}

const VALID_PLATFORMS = [
  "FACEBOOK",
  "INSTAGRAM",
  "TIKTOK",
  "LINKEDIN",
  "TWITTER_X",
  "GOOGLE_ADS",
  "YOUTUBE",
  "PINTEREST",
  "SNAPCHAT",
];

// POST /api/posts/schedule
// Accepts a single post or a batch of posts to schedule
export const POST = withErrorHandler(
  withRole("EDITOR", async (req) => {
    const body = await req.json();

    // Detect batch mode via presence of `posts` array
    if (Array.isArray(body.posts)) {
      return handleBatchSchedule(body as ScheduleAllBody, req.orgId, req.userId);
    }

    return handleSingleSchedule(body as SchedulePostBody, req.orgId, req.userId);
  }),
);

async function handleSingleSchedule(
  body: SchedulePostBody,
  orgId: string,
  userId: string,
): Promise<NextResponse> {
  if (!body.content?.trim()) {
    throw new ZodValidationError("content is required");
  }
  if (!body.platform || !VALID_PLATFORMS.includes(body.platform)) {
    throw new ZodValidationError(
      `platform must be one of: ${VALID_PLATFORMS.join(", ")}`,
    );
  }
  if (!body.campaignId) {
    throw new ZodValidationError("campaignId is required");
  }
  if (!body.scheduledAt) {
    throw new ZodValidationError("scheduledAt is required");
  }

  const scheduledAt = new Date(body.scheduledAt);
  if (isNaN(scheduledAt.getTime())) {
    throw new ZodValidationError("scheduledAt is not a valid date");
  }
  if (scheduledAt <= new Date()) {
    throw new ZodValidationError("scheduledAt must be in the future");
  }

  // Verify campaign belongs to org
  const campaign = await prisma.campaign.findFirst({
    where: { id: body.campaignId, orgId },
  });
  if (!campaign) {
    return NextResponse.json(
      { error: "Campaign not found", code: "NOT_FOUND", statusCode: 404 },
      { status: 404 },
    );
  }

  const post = await prisma.post.create({
    data: {
      orgId,
      campaignId: body.campaignId,
      platform: body.platform as never,
      content: sanitizeHtml(body.content),
      mediaUrls: body.mediaUrls ?? [],
      scheduledAt,
      status: "SCHEDULED",
    },
  });

  await prisma.auditLog
    .create({
      data: {
        orgId,
        userId,
        action: "SCHEDULE_POST",
        entityType: "Post",
        entityId: post.id,
        after: {
          platform: body.platform,
          scheduledAt: scheduledAt.toISOString(),
          campaignId: body.campaignId,
        },
      },
    })
    .catch((err) => console.error("[schedulePost] auditLog error:", err));

  return NextResponse.json(post, { status: 201 });
}

async function handleBatchSchedule(
  body: ScheduleAllBody,
  orgId: string,
  userId: string,
): Promise<NextResponse> {
  if (!body.posts || body.posts.length === 0) {
    throw new ZodValidationError("posts array is required and must not be empty");
  }
  if (!body.campaignId) {
    throw new ZodValidationError("campaignId is required");
  }
  if (!body.startAt) {
    throw new ZodValidationError("startAt is required");
  }
  const startAt = new Date(body.startAt);
  if (isNaN(startAt.getTime())) {
    throw new ZodValidationError("startAt is not a valid date");
  }
  if (startAt <= new Date()) {
    throw new ZodValidationError("startAt must be in the future");
  }
  const intervalMs = (body.intervalMinutes ?? 60) * 60 * 1000;

  // Verify campaign belongs to org
  const campaign = await prisma.campaign.findFirst({
    where: { id: body.campaignId, orgId },
  });
  if (!campaign) {
    return NextResponse.json(
      { error: "Campaign not found", code: "NOT_FOUND", statusCode: 404 },
      { status: 404 },
    );
  }

  const createdPosts = [];
  for (let i = 0; i < body.posts.length; i++) {
    const item = body.posts[i]!;
    if (!item.content?.trim()) continue;
    if (!VALID_PLATFORMS.includes(item.platform)) continue;

    const scheduledAt = new Date(startAt.getTime() + i * intervalMs);

    const post = await prisma.post.create({
      data: {
        orgId,
        campaignId: body.campaignId,
        platform: item.platform as never,
        content: sanitizeHtml(item.content),
        mediaUrls: body.mediaUrls ?? [],
        scheduledAt,
        status: "SCHEDULED",
      },
    });
    createdPosts.push({ id: post.id, platform: post.platform, scheduledAt });
  }

  await prisma.auditLog
    .create({
      data: {
        orgId,
        userId,
        action: "BATCH_SCHEDULE",
        entityType: "Post",
        entityId: body.campaignId,
        after: {
          count: createdPosts.length,
          campaignId: body.campaignId,
          startAt: startAt.toISOString(),
          intervalMinutes: body.intervalMinutes,
        },
      },
    })
    .catch((err) => console.error("[batchSchedule] auditLog error:", err));

  return NextResponse.json(
    { success: true, scheduledCount: createdPosts.length, posts: createdPosts },
    { status: 201 },
  );
}
