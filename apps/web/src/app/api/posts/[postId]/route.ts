import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { updatePostSchema, sanitizeHtml } from "@adpilot/shared";

// PATCH /api/posts/[postId] — optimistic concurrency
export const PATCH = withErrorHandler(withRole("EDITOR", async (req, context) => {
  const postId = (await context.params).postId!;
  const body = await req.json();
  const parsed = updatePostSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const { version, ...updateData } = parsed.data;

  const existing = await prisma.post.findFirst({
    where: { id: postId, orgId: req.orgId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  if (existing.version !== version) {
    return NextResponse.json(
      { error: "Conflict — post was modified", code: "CONFLICT", statusCode: 409, currentVersion: existing.version },
      { status: 409 }
    );
  }

  // Editable in DRAFT, REJECTED, or SCHEDULED status
  if (!["DRAFT", "REJECTED", "SCHEDULED"].includes(existing.status)) {
    return NextResponse.json(
      { error: `Cannot edit post in ${existing.status} status`, code: "INVALID_STATUS", statusCode: 400 },
      { status: 400 }
    );
  }

  const post = await prisma.post.update({
    where: { id: postId },
    data: {
      ...updateData,
      ...(updateData.content && { content: sanitizeHtml(updateData.content) }),
      scheduledAt: updateData.scheduledAt ? new Date(updateData.scheduledAt) : updateData.scheduledAt === null ? null : undefined,
      status: "DRAFT", // Reset to DRAFT on edit
      version: { increment: 1 },
    },
  });

  return NextResponse.json(post);
}));

// DELETE /api/posts/[postId]
export const DELETE = withErrorHandler(withRole("EDITOR", async (req, context) => {
  const postId = (await context.params).postId!;

  const post = await prisma.post.findFirst({
    where: { id: postId, orgId: req.orgId },
  });

  if (!post) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  // Can't delete published posts — soft-delete via status
  if (post.status === "PUBLISHED") {
    await prisma.post.update({
      where: { id: postId },
      data: { status: "DELETED", version: { increment: 1 } },
    });
  } else {
    await prisma.post.delete({ where: { id: postId } });
  }

  return NextResponse.json({ success: true });
}));
