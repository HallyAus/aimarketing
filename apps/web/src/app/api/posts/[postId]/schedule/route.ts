import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { isValidTransition } from "@adpilot/shared";

// POST /api/posts/[postId]/schedule — schedule an existing post
export const POST = withErrorHandler(withRole("EDITOR", async (req, context) => {
  const postId = (await context.params).postId!;
  const body = await req.json();

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

  const post = await prisma.post.findFirst({
    where: { id: postId, orgId: req.orgId },
  });

  if (!post) {
    return NextResponse.json(
      { error: "Not found", code: "NOT_FOUND", statusCode: 404 },
      { status: 404 },
    );
  }

  if (!isValidTransition(post.status, "SCHEDULED")) {
    return NextResponse.json(
      { error: `Cannot schedule post in ${post.status} status`, code: "INVALID_TRANSITION", statusCode: 400 },
      { status: 400 },
    );
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      status: "SCHEDULED",
      scheduledAt,
      version: { increment: 1 },
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId: req.orgId,
      userId: req.userId,
      action: "SCHEDULE_POST",
      entityType: "Post",
      entityId: postId,
      after: { scheduledAt: scheduledAt.toISOString() },
    },
  }).catch((err) => console.error("[schedulePost] auditLog error:", err));

  return NextResponse.json(updated);
}));
