import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { isValidTransition } from "@reachpilot/shared";

// POST /api/posts/[postId]/approve — ADMIN+ only
export const POST = withErrorHandler(withRole("ADMIN", async (req, context) => {
  const postId = (await context.params).postId!;

  const post = await prisma.post.findFirst({
    where: { id: postId, orgId: req.orgId },
  });

  if (!post) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  if (!isValidTransition(post.status, "APPROVED")) {
    return NextResponse.json(
      { error: `Cannot approve post in ${post.status} status`, code: "INVALID_TRANSITION", statusCode: 400 },
      { status: 400 }
    );
  }

  // Approve and auto-schedule if scheduledAt is set
  const newStatus = post.scheduledAt ? "SCHEDULED" : "APPROVED";

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      status: newStatus,
      approvedBy: req.userId,
      version: { increment: 1 },
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId: req.orgId,
      userId: req.userId,
      action: "APPROVE_POST",
      entityType: "Post",
      entityId: postId,
      after: { status: newStatus },
    },
  });

  return NextResponse.json(updated);
}));
