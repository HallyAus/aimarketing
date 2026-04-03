import { decrypt } from "@adpilot/shared";
import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { isValidTransition } from "@adpilot/shared";
import { publishPost } from "@adpilot/platform-sdk";

// POST /api/posts/[postId]/publish — publish an existing post immediately
export const POST = withErrorHandler(withRole("EDITOR", async (req, context) => {
  const postId = (await context.params).postId!;
  const body = await req.json();

  if (!body.connectionId) {
    throw new ZodValidationError("connectionId is required");
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

  // Allow publish from DRAFT, APPROVED, SCHEDULED, or FAILED
  const publishableStatuses = ["DRAFT", "APPROVED", "SCHEDULED", "FAILED"];
  if (!publishableStatuses.includes(post.status)) {
    return NextResponse.json(
      { error: `Cannot publish post in ${post.status} status`, code: "INVALID_TRANSITION", statusCode: 400 },
      { status: 400 },
    );
  }

  const connection = await prisma.platformConnection.findFirst({
    where: {
      id: body.connectionId,
      orgId: req.orgId,
      platform: post.platform,
      status: "ACTIVE",
    },
  });

  if (!connection) {
    return NextResponse.json(
      { error: "Platform connection not found or inactive", code: "CONNECTION_NOT_FOUND", statusCode: 404 },
      { status: 404 },
    );
  }

  // Set to PUBLISHING
  await prisma.post.update({
    where: { id: postId },
    data: { status: "PUBLISHING", version: { increment: 1 } },
  });

  const result = await publishPost(post.platform, {
    content: post.content,
    mediaUrls: post.mediaUrls,
    platform: post.platform,
    accessToken: decrypt(connection.accessToken, process.env.MASTER_ENCRYPTION_KEY ?? ""),
    platformUserId: connection.platformUserId,
  });

  if (result.success) {
    const updated = await prisma.post.update({
      where: { id: postId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        platformPostId: result.platformPostId ?? null,
        version: { increment: 1 },
      },
    });

    await prisma.auditLog.create({
      data: {
        orgId: req.orgId,
        userId: req.userId,
        action: "PUBLISH_NOW",
        entityType: "Post",
        entityId: postId,
        after: {
          platform: post.platform,
          platformPostId: result.platformPostId,
          url: result.url,
        },
      },
    }).catch((err) => console.error("[publishPost] auditLog error:", err));

    return NextResponse.json({
      success: true,
      post: updated,
      platformPostId: result.platformPostId,
      url: result.url,
    });
  }

  // Failed
  await prisma.post.update({
    where: { id: postId },
    data: {
      status: "FAILED",
      errorMessage: result.error ?? "Unknown publishing error",
      version: { increment: 1 },
    },
  });

  return NextResponse.json(
    { success: false, error: result.error ?? "Failed to publish post", postId },
    { status: 502 },
  );
}));
