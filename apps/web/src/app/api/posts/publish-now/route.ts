import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { sanitizeHtml } from "@adpilot/shared";
import { publishPost } from "@adpilot/platform-sdk";

interface PublishNowBody {
  content: string;
  platform: string;
  connectionId: string;
  campaignId?: string;
  mediaUrls?: string[];
}

const VALID_PLATFORMS = [
  "FACEBOOK",
  "INSTAGRAM",
  "LINKEDIN",
  "TWITTER_X",
];

// POST /api/posts/publish-now
// Immediately publishes a post to the specified platform
export const POST = withErrorHandler(
  withRole("EDITOR", async (req) => {
    const body = (await req.json()) as PublishNowBody;

    if (!body.content?.trim()) {
      throw new ZodValidationError("content is required");
    }
    if (!body.platform || !VALID_PLATFORMS.includes(body.platform)) {
      throw new ZodValidationError(
        `platform must be one of: ${VALID_PLATFORMS.join(", ")}`,
      );
    }
    if (!body.connectionId) {
      throw new ZodValidationError("connectionId is required");
    }

    // Get the platform connection and verify it belongs to the org
    const connection = await prisma.platformConnection.findFirst({
      where: {
        id: body.connectionId,
        orgId: req.orgId,
        platform: body.platform as never,
        status: "ACTIVE",
      },
    });

    if (!connection) {
      return NextResponse.json(
        {
          error: "Platform connection not found or inactive",
          code: "CONNECTION_NOT_FOUND",
          statusCode: 404,
        },
        { status: 404 },
      );
    }

    // If a campaignId is provided, verify it
    let campaignId = body.campaignId;
    if (campaignId) {
      const campaign = await prisma.campaign.findFirst({
        where: { id: campaignId, orgId: req.orgId },
      });
      if (!campaign) {
        return NextResponse.json(
          { error: "Campaign not found", code: "NOT_FOUND", statusCode: 404 },
          { status: 404 },
        );
      }
    } else {
      // Create or find a default "Quick Posts" campaign for this org
      let defaultCampaign = await prisma.campaign.findFirst({
        where: { orgId: req.orgId, name: "Quick Posts" },
        orderBy: { createdAt: "desc" },
      });
      if (!defaultCampaign) {
        defaultCampaign = await prisma.campaign.create({
          data: {
            orgId: req.orgId,
            name: "Quick Posts",
            objective: "ENGAGEMENT",
            targetPlatforms: [body.platform as never],
            createdBy: req.userId,
            status: "ACTIVE",
          },
        });
      }
      campaignId = defaultCampaign.id;
    }

    // Create the post record in PUBLISHING state
    const post = await prisma.post.create({
      data: {
        orgId: req.orgId,
        campaignId,
        platform: body.platform as never,
        content: sanitizeHtml(body.content),
        mediaUrls: body.mediaUrls ?? [],
        status: "PUBLISHING",
      },
    });

    // Call the publisher
    const result = await publishPost(body.platform, {
      content: body.content,
      mediaUrls: body.mediaUrls,
      platform: body.platform,
      accessToken: connection.accessToken,
      platformUserId: connection.platformUserId,
    });

    if (result.success) {
      // Update post to PUBLISHED
      const updatedPost = await prisma.post.update({
        where: { id: post.id },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          platformPostId: result.platformPostId ?? null,
          version: { increment: 1 },
        },
      });

      await prisma.auditLog
        .create({
          data: {
            orgId: req.orgId,
            userId: req.userId,
            action: "PUBLISH_NOW",
            entityType: "Post",
            entityId: post.id,
            after: {
              platform: body.platform,
              platformPostId: result.platformPostId,
              url: result.url,
            },
          },
        })
        .catch((err) => console.error("[publishNow] auditLog error:", err));

      return NextResponse.json({
        success: true,
        post: updatedPost,
        platformPostId: result.platformPostId,
        url: result.url,
      });
    }

    // Publishing failed — update post to FAILED
    await prisma.post.update({
      where: { id: post.id },
      data: {
        status: "FAILED",
        errorMessage: result.error ?? "Unknown publishing error",
        version: { increment: 1 },
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: result.error ?? "Failed to publish post",
        postId: post.id,
      },
      { status: 502 },
    );
  }),
);
