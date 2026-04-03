import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { sanitizeHtml, decrypt, publishNowSchema } from "@adpilot/shared";
import { publishPost } from "@adpilot/platform-sdk";

// POST /api/posts/publish-now
// Immediately publishes a post to the specified platform
export const POST = withErrorHandler(
  withRole("EDITOR", async (req) => {
    const rawBody = await req.json();
    const parsed = publishNowSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
    }
    const body = parsed.data;

    // Check if publishing is paused for this org
    const org = await prisma.organization.findUniqueOrThrow({
      where: { id: req.orgId },
      select: { publishingPaused: true },
    });
    if (org.publishingPaused) {
      return NextResponse.json(
        { error: "Publishing is paused. Re-enable in settings.", code: "PUBLISHING_PAUSED", statusCode: 403 },
        { status: 403 },
      );
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

    // Resolve page from Page model (first-class entity)
    let resolvedPageId = body.pageId ?? null;
    let resolvedPageName: string | null = null;
    if (resolvedPageId) {
      const pageRecord = await prisma.page.findUnique({
        where: { id: resolvedPageId },
        select: { id: true, name: true, platformPageId: true },
      });
      if (pageRecord) {
        resolvedPageName = pageRecord.name;
      }
    }
    if (!resolvedPageName && connection.platformAccountName) {
      resolvedPageName = connection.platformAccountName;
    }

    // Create the post record in PUBLISHING state
    const post = await prisma.post.create({
      data: {
        orgId: req.orgId,
        campaignId,
        platform: body.platform as never,
        content: sanitizeHtml(body.content),
        mediaUrls: body.mediaUrls ?? [],
        pageId: resolvedPageId,
        pageName: resolvedPageName ?? body.pageName ?? null,
        status: "PUBLISHING",
      },
    });

    // Decrypt the access token — prefer Page model, fall back to connection
    const masterKey = process.env.MASTER_ENCRYPTION_KEY ?? "";
    let accessToken: string;
    let pageUserId = connection.platformUserId;

    if (resolvedPageId) {
      // Use Page model for token resolution (first-class entity)
      const pageRecord = await prisma.page.findUnique({
        where: { id: resolvedPageId },
        select: { accessToken: true, platformPageId: true },
      });
      if (pageRecord) {
        accessToken = decrypt(pageRecord.accessToken, masterKey);
        pageUserId = pageRecord.platformPageId;
      } else {
        accessToken = decrypt(connection.accessToken, masterKey);
      }
    } else if ((body.platform === "FACEBOOK" || body.platform === "INSTAGRAM") && connection.metadata) {
      // Legacy fallback for posts without a Page record
      const meta = connection.metadata as Record<string, unknown>;
      const selectedPages = meta.selectedPages as Array<{ id: string; accessToken: string; name?: string }> | undefined;
      if (selectedPages && selectedPages.length > 0) {
        accessToken = decrypt(selectedPages[0]!.accessToken, masterKey);
        pageUserId = selectedPages[0]!.id;
      } else {
        accessToken = decrypt(connection.accessToken, masterKey);
      }
    } else {
      accessToken = decrypt(connection.accessToken, masterKey);
    }

    // Call the publisher
    const result = await publishPost(body.platform, {
      content: body.content,
      mediaUrls: body.mediaUrls,
      platform: body.platform,
      accessToken,
      platformUserId: pageUserId,
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
