import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@adpilot/shared";
import { publishPost } from "@adpilot/platform-sdk";

// Vercel Cron calls this every 5 minutes to publish due posts
// Secured by CRON_SECRET header
export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const masterKey = process.env.MASTER_ENCRYPTION_KEY ?? "";

  // Find all scheduled posts that are due
  const duePosts = await prisma.post.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: now },
    },
    include: {
      organization: { select: { publishingPaused: true } },
    },
    take: 20, // Process max 20 per invocation to stay within Vercel timeout
    orderBy: { scheduledAt: "asc" },
  });

  if (duePosts.length === 0) {
    return NextResponse.json({ published: 0, message: "No posts due" });
  }

  const results: Array<{ postId: string; status: string; error?: string }> = [];

  for (const post of duePosts) {
    // Skip if org has paused publishing
    if (post.organization.publishingPaused) {
      results.push({ postId: post.id, status: "skipped", error: "Publishing paused" });
      continue;
    }

    // Find the connection for this platform + org
    const connection = await prisma.platformConnection.findFirst({
      where: {
        orgId: post.orgId,
        platform: post.platform,
        status: "ACTIVE",
      },
    });

    if (!connection) {
      await prisma.post.update({
        where: { id: post.id },
        data: { status: "FAILED", errorMessage: "No active connection for " + post.platform },
      });
      results.push({ postId: post.id, status: "failed", error: "No connection" });
      continue;
    }

    // Get the right access token — prefer Page record, fall back to connection metadata
    let accessToken: string;
    let pageUserId = connection.platformUserId;

    try {
      // First, try to resolve from the Page model (first-class entity)
      if (post.pageId) {
        const pageRecord = await prisma.page.findUnique({
          where: { id: post.pageId },
          select: { accessToken: true, platformPageId: true },
        });
        if (pageRecord) {
          accessToken = decrypt(pageRecord.accessToken, masterKey);
          pageUserId = pageRecord.platformPageId;
        } else {
          // Fall back to connection metadata
          accessToken = decrypt(connection.accessToken, masterKey);
        }
      } else if ((post.platform === "FACEBOOK" || post.platform === "INSTAGRAM") && connection.metadata) {
        // Legacy fallback: look up from connection metadata
        const meta = connection.metadata as Record<string, unknown>;
        const selectedPages = meta.selectedPages as Array<{ id: string; accessToken: string }> | undefined;
        if (selectedPages && selectedPages.length > 0) {
          accessToken = decrypt(selectedPages[0]!.accessToken, masterKey);
          pageUserId = selectedPages[0]!.id;
        } else {
          accessToken = decrypt(connection.accessToken, masterKey);
        }
      } else {
        accessToken = decrypt(connection.accessToken, masterKey);
      }
    } catch (e) {
      await prisma.post.update({
        where: { id: post.id },
        data: { status: "FAILED", errorMessage: "Token decryption failed" },
      });
      results.push({ postId: post.id, status: "failed", error: "Token error" });
      continue;
    }

    // Mark as publishing
    await prisma.post.update({
      where: { id: post.id },
      data: { status: "PUBLISHING" },
    });

    // Publish
    try {
      const result = await publishPost(post.platform, {
        content: post.content,
        mediaUrls: post.mediaUrls,
        platform: post.platform,
        accessToken,
        platformUserId: pageUserId,
      });

      if (result.success) {
        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: "PUBLISHED",
            publishedAt: new Date(),
            platformPostId: result.platformPostId ?? null,
          },
        });
        results.push({ postId: post.id, status: "published" });
      } else {
        await prisma.post.update({
          where: { id: post.id },
          data: { status: "FAILED", errorMessage: result.error ?? "Unknown error" },
        });
        results.push({ postId: post.id, status: "failed", error: result.error });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      await prisma.post.update({
        where: { id: post.id },
        data: { status: "FAILED", errorMessage: msg },
      });
      results.push({ postId: post.id, status: "failed", error: msg });
    }
  }

  return NextResponse.json({
    published: results.filter(r => r.status === "published").length,
    failed: results.filter(r => r.status === "failed").length,
    skipped: results.filter(r => r.status === "skipped").length,
    results,
  });
}
