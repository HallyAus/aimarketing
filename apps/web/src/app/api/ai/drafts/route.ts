import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";

interface DraftPostInput {
  content: string;
  platform: string;
  sourceUrl?: string;
  tone?: string;
  pageId?: string;
  pageName?: string;
}

// GET /api/ai/drafts — list all draft posts for the current org (no campaign, not scheduled)
// Optional: ?pageId=xxx to filter by page
export const GET = withErrorHandler(
  withAuth(async (req) => {
    const pageId = req.nextUrl.searchParams.get("pageId");
    const where: Record<string, unknown> = {
      orgId: req.orgId,
      status: "DRAFT",
      campaignId: null,
    };
    if (pageId) {
      where.pageId = pageId;
    }

    const drafts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        platform: true,
        content: true,
        sourceUrl: true,
        tone: true,
        status: true,
        pageId: true,
        pageName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ drafts });
  }),
);

// POST /api/ai/drafts — save generated posts as drafts
export const POST = withErrorHandler(
  withAuth(async (req) => {
    const body = (await req.json()) as { posts?: DraftPostInput[] };

    if (!body.posts || !Array.isArray(body.posts) || body.posts.length === 0) {
      return NextResponse.json(
        { error: "posts array is required and must not be empty", code: "VALIDATION_ERROR", statusCode: 400 },
        { status: 400 },
      );
    }

    // Validate each post has required fields
    for (const post of body.posts) {
      if (!post.content || !post.platform) {
        return NextResponse.json(
          { error: "Each post must have content and platform", code: "VALIDATION_ERROR", statusCode: 400 },
          { status: 400 },
        );
      }
    }

    const validPlatforms = [
      "FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN",
      "TWITTER_X", "GOOGLE_ADS", "YOUTUBE", "PINTEREST", "SNAPCHAT",
    ];

    const created = await prisma.$transaction(
      body.posts.map((post) => {
        const platform = post.platform.toUpperCase();
        if (!validPlatforms.includes(platform)) {
          throw new Error(`Invalid platform: ${post.platform}`);
        }
        return prisma.post.create({
          data: {
            orgId: req.orgId,
            platform: platform as "FACEBOOK" | "INSTAGRAM" | "TIKTOK" | "LINKEDIN" | "TWITTER_X" | "GOOGLE_ADS" | "YOUTUBE" | "PINTEREST" | "SNAPCHAT",
            content: post.content,
            status: "DRAFT",
            sourceUrl: post.sourceUrl ?? null,
            tone: post.tone ?? null,
            pageId: post.pageId ?? null,
            pageName: post.pageName ?? null,
          },
          select: {
            id: true,
            platform: true,
            content: true,
            sourceUrl: true,
            tone: true,
            createdAt: true,
          },
        });
      }),
    );

    return NextResponse.json({ drafts: created, count: created.length }, { status: 201 });
  }),
);

// DELETE /api/ai/drafts?id=xxx — delete a specific draft
export const DELETE = withErrorHandler(
  withAuth(async (req) => {
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id query parameter is required", code: "VALIDATION_ERROR", statusCode: 400 },
        { status: 400 },
      );
    }

    // Ensure the draft belongs to the current org and is actually a draft
    const draft = await prisma.post.findFirst({
      where: {
        id,
        orgId: req.orgId,
        status: "DRAFT",
        campaignId: null,
      },
    });

    if (!draft) {
      return NextResponse.json(
        { error: "Draft not found", code: "NOT_FOUND", statusCode: 404 },
        { status: 404 },
      );
    }

    await prisma.post.delete({ where: { id } });

    return NextResponse.json({ success: true });
  }),
);
