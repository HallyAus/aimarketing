import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/admin/components/admin-auth";
import { z } from "zod";

const querySchema = z.object({
  q: z.string().min(1).max(200),
});

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    q: url.searchParams.get("q"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Search query is required", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const term = parsed.data.q;

  const [users, organizations, posts] = await Promise.all([
    prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          { email: { contains: term, mode: "insensitive" } },
          { name: { contains: term, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        systemRole: true,
        status: true,
      },
      take: 5,
    }),
    prisma.organization.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { slug: { contains: term, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
      },
      take: 5,
    }),
    prisma.post.findMany({
      where: {
        content: { contains: term, mode: "insensitive" },
      },
      select: {
        id: true,
        content: true,
        platform: true,
        status: true,
        orgId: true,
      },
      take: 5,
    }),
  ]);

  // Truncate post content for search results
  const truncatedPosts = posts.map((p) => ({
    ...p,
    content: p.content.length > 120 ? p.content.slice(0, 120) + "..." : p.content,
  }));

  return NextResponse.json({
    users,
    organizations,
    posts: truncatedPosts,
  });
}
