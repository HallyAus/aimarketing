import { prisma } from "@/lib/db";

// ── Unified Post Type ───────────────────────────────────────────────────

export interface UnifiedPost {
  id: string;
  pageId: string;
  platformPostId: string;
  platformUrl: string | null;
  content: string | null;
  mediaUrls: string[];
  postType: string | null;
  publishedAt: Date;
  impressions: number;
  reach: number;
  engagements: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  videoViews: number;
  source: "live" | "historical";
}

// ── Query Options ───────────────────────────────────────────────────────

interface UnifiedPostOptions {
  take: number;
  skip?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

// ── Main Query ──────────────────────────────────────────────────────────

export async function getUnifiedPostTimeline(
  pageId: string,
  options: UnifiedPostOptions,
): Promise<UnifiedPost[]> {
  const { take, skip = 0, dateFrom, dateTo } = options;

  const dateFilter: { publishedAt?: { gte?: Date; lte?: Date } } = {};
  if (dateFrom || dateTo) {
    dateFilter.publishedAt = {};
    if (dateFrom) dateFilter.publishedAt.gte = dateFrom;
    if (dateTo) dateFilter.publishedAt.lte = dateTo;
  }

  // Fetch from both tables in parallel
  const [livePosts, historicalPosts] = await Promise.all([
    prisma.post.findMany({
      where: {
        pageId,
        platformPostId: { not: null },
        status: "PUBLISHED",
        ...dateFilter,
      },
      select: {
        id: true,
        pageId: true,
        platformPostId: true,
        sourceUrl: true,
        content: true,
        mediaUrls: true,
        publishedAt: true,
        engagementSnapshot: true,
      },
      orderBy: { publishedAt: "desc" },
      // Fetch more than needed to handle deduplication
      take: take + skip + 100,
    }),
    prisma.historicalPost.findMany({
      where: {
        pageId,
        ...dateFilter,
      },
      select: {
        id: true,
        pageId: true,
        platformPostId: true,
        platformUrl: true,
        content: true,
        mediaUrls: true,
        postType: true,
        publishedAt: true,
        impressions: true,
        reach: true,
        engagements: true,
        likes: true,
        comments: true,
        shares: true,
        saves: true,
        clicks: true,
        videoViews: true,
      },
      orderBy: { publishedAt: "desc" },
      take: take + skip + 100,
    }),
  ]);

  // Normalize live posts to UnifiedPost format
  const normalizedLive: UnifiedPost[] = livePosts
    .filter((p) => p.platformPostId !== null)
    .map((p) => {
      const snapshot = p.engagementSnapshot as Record<string, number> | null;
      return {
        id: p.id,
        pageId: p.pageId ?? "",
        platformPostId: p.platformPostId!,
        platformUrl: p.sourceUrl,
        content: p.content,
        mediaUrls: p.mediaUrls,
        postType: null,
        publishedAt: p.publishedAt ?? new Date(),
        impressions: snapshot?.impressions ?? 0,
        reach: snapshot?.reach ?? 0,
        engagements: (snapshot?.likes ?? 0) + (snapshot?.comments ?? 0) + (snapshot?.shares ?? 0),
        likes: snapshot?.likes ?? 0,
        comments: snapshot?.comments ?? 0,
        shares: snapshot?.shares ?? 0,
        saves: snapshot?.saves ?? 0,
        clicks: snapshot?.clicks ?? 0,
        videoViews: snapshot?.videoViews ?? 0,
        source: "live" as const,
      };
    });

  // Normalize historical posts
  const normalizedHistorical: UnifiedPost[] = historicalPosts.map((p) => ({
    id: p.id,
    pageId: p.pageId,
    platformPostId: p.platformPostId,
    platformUrl: p.platformUrl,
    content: p.content,
    mediaUrls: p.mediaUrls,
    postType: p.postType,
    publishedAt: p.publishedAt,
    impressions: p.impressions,
    reach: p.reach,
    engagements: p.engagements,
    likes: p.likes,
    comments: p.comments,
    shares: p.shares,
    saves: p.saves,
    clicks: p.clicks,
    videoViews: p.videoViews,
    source: "historical" as const,
  }));

  // Merge and deduplicate — live posts take priority over historical
  const seen = new Set<string>();
  const merged: UnifiedPost[] = [];

  // Add live posts first (higher priority)
  for (const post of normalizedLive) {
    if (!seen.has(post.platformPostId)) {
      seen.add(post.platformPostId);
      merged.push(post);
    }
  }

  // Add historical posts that aren't already covered by live posts
  for (const post of normalizedHistorical) {
    if (!seen.has(post.platformPostId)) {
      seen.add(post.platformPostId);
      merged.push(post);
    }
  }

  // Sort by publishedAt descending
  merged.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

  // Apply skip and take
  return merged.slice(skip, skip + take);
}
