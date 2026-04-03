import { prisma } from "./db";

/**
 * Fetch recent post content for an org to prevent AI from repeating
 * the same hooks, angles, and phrasing.
 *
 * Returns a formatted string to inject into AI prompts.
 */
export async function getContentMemory(orgId: string, limit = 40): Promise<string> {
  const recentPosts = await prisma.post.findMany({
    where: {
      orgId,
      status: { in: ["PUBLISHED", "SCHEDULED", "DRAFT"] },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      content: true,
      platform: true,
      createdAt: true,
    },
  });

  if (recentPosts.length === 0) return "";

  const postList = recentPosts
    .map((p, i) => `${i + 1}. [${p.platform}] ${p.content.substring(0, 150)}`)
    .join("\n");

  return `
CONTENT MEMORY — DO NOT REPEAT:
The following ${recentPosts.length} posts have already been created for this brand. You MUST create something DIFFERENT. Do not reuse the same:
- Headlines or hooks
- Calls to action (vary them: "Learn more", "Get started", "Try free", "See how", etc.)
- Content angles (if 5 posts talk about pricing, talk about features, speed, reliability, etc.)
- Phrasing patterns (don't start multiple posts the same way)
- Emoji combinations

Recent posts:
${postList}

Generate content that takes a FRESH angle not covered above.`;
}
