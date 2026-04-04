import { NextResponse } from "next/server";
import { callClaude, extractText } from "@/lib/ai";
import { withErrorHandler } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

/* ── Reddit fetcher ────────────────────────────────────────────── */

interface RedditPost {
  title: string;
  selftext: string;
  subreddit: string;
  author: string;
  score: number;
  num_comments: number;
  url: string;
  permalink: string;
  created_utc: number;
}

async function fetchRedditPosts(topic: string, limit = 10): Promise<RedditPost[]> {
  try {
    // Search Reddit for the topic across all subreddits
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(topic)}&sort=hot&t=week&limit=${limit}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "ReachPilot/1.0 (community-feed)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data?.children ?? []).map((child: any) => child.data as RedditPost);
  } catch {
    return [];
  }
}

/* ── RSS/Blog fetcher (simple) ─────────────────────────────────── */

interface WebResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
}

async function fetchWebContent(topic: string): Promise<WebResult[]> {
  // Use a simple approach: fetch from known industry sources
  // In production, could integrate a web search API
  try {
    // Try Reddit RSS as a fallback source for blog-like content
    const url = `https://www.reddit.com/r/all/search.json?q=${encodeURIComponent(topic)}&sort=relevance&t=month&limit=5`;
    const res = await fetch(url, {
      headers: { "User-Agent": "ReachPilot/1.0 (community-feed)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data?.children ?? [])
      .filter((child: any) => child.data.is_self === false && child.data.url)
      .map((child: any) => ({
        title: child.data.title,
        snippet: child.data.selftext?.substring(0, 200) || "",
        url: child.data.url,
        source: child.data.domain || child.data.subreddit_name_prefixed,
      }));
  } catch {
    return [];
  }
}

/* ── Claude curation ───────────────────────────────────────────── */

interface FeedItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceType: "reddit" | "web" | "blog";
  url: string;
  engagement: number;
  comments: number;
  timeAgo: string;
  engagementSuggestion: string;
  relevanceScore: number;
}

async function curateWithClaude(
  topics: string[],
  redditPosts: RedditPost[],
  webResults: WebResult[],
): Promise<FeedItem[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    // Return uncurated feed if no API key
    return redditPosts.slice(0, 15).map((p, i) => ({
      id: `reddit_${i}`,
      title: p.title,
      summary: p.selftext?.substring(0, 200) || "No description",
      source: `r/${p.subreddit}`,
      sourceType: "reddit" as const,
      url: `https://reddit.com${p.permalink}`,
      engagement: p.score,
      comments: p.num_comments,
      timeAgo: formatTimeAgo(p.created_utc),
      engagementSuggestion: "",
      relevanceScore: 80,
    }));
  }

  const contentSummary = [
    "REDDIT POSTS:",
    ...redditPosts.slice(0, 15).map((p, i) =>
      `[R${i}] r/${p.subreddit} | "${p.title}" | ${p.score} upvotes, ${p.num_comments} comments | ${formatTimeAgo(p.created_utc)} | https://reddit.com${p.permalink}`
    ),
    "",
    "WEB ARTICLES:",
    ...webResults.slice(0, 5).map((w, i) =>
      `[W${i}] ${w.source} | "${w.title}" | ${w.url}`
    ),
  ].join("\n");

  const response = await callClaude({
    feature: "community_feed",
    messages: [{
      role: "user",
      content: `You are a social media marketing expert. Curate a community feed for someone interested in: ${topics.join(", ")}

Here are the raw posts and articles found:

${contentSummary}

Select the 10-15 most relevant and engaging items. For EACH item, provide:
1. A brief engagement suggestion — what the user could comment/reply to build genuine relationships in this community. Keep suggestions authentic and value-adding, not spammy.
2. A relevance score (0-100) based on how relevant it is to the topics.

Return ONLY a JSON array (no markdown, no fences):
[
  {
    "ref": "R0 or W0",
    "engagementSuggestion": "Share your experience with... / Ask about their setup... / Offer a tip about...",
    "relevanceScore": 85
  }
]

Sort by relevance descending. Only include items scoring 50+.`,
    }],
  });

  const cleaned = extractText(response).replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  let curated: Array<{ ref: string; engagementSuggestion: string; relevanceScore: number }>;
  try {
    curated = JSON.parse(cleaned);
  } catch {
    curated = [];
  }

  // Map back to feed items
  const items: FeedItem[] = [];
  for (const c of curated) {
    const match = c.ref.match(/^(R|W)(\d+)$/);
    if (!match) continue;
    const [, type, idxStr] = match;
    const idx = parseInt(idxStr!, 10);

    if (type === "R" && redditPosts[idx]) {
      const p = redditPosts[idx]!;
      items.push({
        id: `reddit_${idx}_${p.permalink.slice(-8)}`,
        title: p.title,
        summary: p.selftext?.substring(0, 300) || "Discussion thread",
        source: `r/${p.subreddit}`,
        sourceType: "reddit",
        url: `https://reddit.com${p.permalink}`,
        engagement: p.score,
        comments: p.num_comments,
        timeAgo: formatTimeAgo(p.created_utc),
        engagementSuggestion: c.engagementSuggestion,
        relevanceScore: c.relevanceScore,
      });
    } else if (type === "W" && webResults[idx]) {
      const w = webResults[idx]!;
      items.push({
        id: `web_${idx}_${Date.now()}`,
        title: w.title,
        summary: w.snippet || "External article",
        source: w.source,
        sourceType: "web",
        url: w.url,
        engagement: 0,
        comments: 0,
        timeAgo: "",
        engagementSuggestion: c.engagementSuggestion,
        relevanceScore: c.relevanceScore,
      });
    }
  }

  return items;
}

function formatTimeAgo(utcSeconds: number): string {
  const diff = Date.now() / 1000 - utcSeconds;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ── Route handler ─────────────────────────────────────────────── */

// GET /api/community/feed — fetch curated feed for org's topics
export const GET = withErrorHandler(
  withRole("VIEWER", async (req) => {
    const topics = await prisma.communityTopic.findMany({
      where: { orgId: req.orgId },
      select: { topic: true },
    });

    if (topics.length === 0) {
      return NextResponse.json({ items: [], message: "Add topics to see your community feed" });
    }

    const topicList = topics.map((t) => t.topic);

    // Fetch content from multiple sources in parallel
    const [redditPosts, webResults] = await Promise.all([
      // Fetch reddit for each topic, then combine and dedupe
      Promise.all(topicList.map((t) => fetchRedditPosts(t, 8))).then((results) => {
        const all = results.flat();
        const seen = new Set<string>();
        return all.filter((p) => {
          if (seen.has(p.permalink)) return false;
          seen.add(p.permalink);
          return true;
        });
      }),
      // Fetch web content
      Promise.all(topicList.map((t) => fetchWebContent(t))).then((results) => {
        const all = results.flat();
        const seen = new Set<string>();
        return all.filter((w) => {
          if (seen.has(w.url)) return false;
          seen.add(w.url);
          return true;
        });
      }),
    ]);

    // Curate with Claude
    const items = await curateWithClaude(topicList, redditPosts, webResults);

    return NextResponse.json({ items, topicCount: topicList.length });
  }),
);
