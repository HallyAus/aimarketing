import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@reachpilot/shared";
import { publishPost } from "@reachpilot/platform-sdk";

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

  // Find all scheduled posts that are due — eagerly load connections and pages to avoid N+1
  const duePosts = await prisma.post.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: now },
    },
    include: {
      organization: { select: { publishingPaused: true } },
      page: { select: { accessToken: true, platformPageId: true } },
    },
    take: 20, // Process max 20 per invocation to stay within Vercel timeout
    orderBy: { scheduledAt: "asc" },
  });

  if (duePosts.length === 0) {
    return NextResponse.json({ published: 0, message: "No posts due" });
  }

  // Batch-fetch active connections for all unique orgId+platform pairs
  const orgPlatformPairs = [...new Set(duePosts.map((p) => `${p.orgId}:${p.platform}`))];
  const allConnections = await prisma.platformConnection.findMany({
    where: {
      OR: orgPlatformPairs.map((pair) => {
        const [orgId, platform] = pair.split(":");
        return { orgId: orgId!, platform: platform as never, status: "ACTIVE" as const };
      }),
    },
  });
  const connectionMap = new Map(
    allConnections.map((c) => [`${c.orgId}:${c.platform}`, c]),
  );

  const results: Array<{ postId: string; status: string; error?: string }> = [];

  for (const post of duePosts) {
    // Skip if org has paused publishing
    if (post.organization.publishingPaused) {
      results.push({ postId: post.id, status: "skipped", error: "Publishing paused" });
      continue;
    }

    // Look up connection from pre-fetched map
    const connection = connectionMap.get(`${post.orgId}:${post.platform}`);

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
      // First, try to resolve from the eagerly-loaded Page record
      if (post.pageId && post.page) {
        accessToken = decrypt(post.page.accessToken, masterKey);
        pageUserId = post.page.platformPageId;
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
