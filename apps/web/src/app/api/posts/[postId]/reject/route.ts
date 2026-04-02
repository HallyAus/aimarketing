import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { isValidTransition, rejectPostSchema } from "@adpilot/shared";

// POST /api/posts/[postId]/reject — ADMIN+ only
export const POST = withErrorHandler(withRole("ADMIN", async (req, context) => {
  const postId = (await context.params).postId!;
  const body = await req.json();
  const parsed = rejectPostSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const post = await prisma.post.findFirst({
    where: { id: postId, orgId: req.orgId },
  });

  if (!post) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  if (!isValidTransition(post.status, "REJECTED")) {
    return NextResponse.json(
      { error: `Cannot reject post in ${post.status} status`, code: "INVALID_TRANSITION", statusCode: 400 },
      { status: 400 }
    );
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      status: "REJECTED",
      rejectionReason: parsed.data.reason,
      version: { increment: 1 },
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId: req.orgId,
      userId: req.userId,
      action: "REJECT_POST",
      entityType: "Post",
      entityId: postId,
      after: { status: "REJECTED", reason: parsed.data.reason },
    },
  });

  return NextResponse.json(updated);
}));
