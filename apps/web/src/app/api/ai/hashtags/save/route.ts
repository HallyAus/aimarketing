import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";

// GET /api/ai/hashtags/save — list saved hashtag sets for the org's pages
export const GET = withErrorHandler(
  withAuth(async (req) => {
    const pageId = req.nextUrl.searchParams.get("pageId");

    const pages = await prisma.page.findMany({
      where: { orgId: req.orgId },
      select: { id: true },
    });
    const pageIds = pageId ? [pageId] : pages.map((p) => p.id);

    const sets = await prisma.hashtagSet.findMany({
      where: { pageId: { in: pageIds } },
      orderBy: { createdAt: "desc" },
      include: { page: { select: { id: true, name: true, platform: true } } },
    });

    return NextResponse.json({ sets });
  }),
);

// POST /api/ai/hashtags/save — save a hashtag set
export const POST = withErrorHandler(
  withAuth(async (req) => {
    const body = await req.json();
    const { pageId, name, hashtags, category } = body;

    if (!pageId || !name || !hashtags?.length) {
      return NextResponse.json(
        { error: "pageId, name, and hashtags are required", code: "VALIDATION_ERROR", statusCode: 400 },
        { status: 400 },
      );
    }

    // Verify the page belongs to this org
    const page = await prisma.page.findFirst({
      where: { id: pageId, orgId: req.orgId },
    });
    if (!page) {
      return NextResponse.json(
        { error: "Page not found", code: "NOT_FOUND", statusCode: 404 },
        { status: 404 },
      );
    }

    const set = await prisma.hashtagSet.create({
      data: {
        pageId,
        name,
        hashtags,
        category: category ?? null,
      },
    });

    return NextResponse.json(set, { status: 201 });
  }),
);

// DELETE /api/ai/hashtags/save?id=xxx — delete a hashtag set
export const DELETE = withErrorHandler(
  withAuth(async (req) => {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "id query parameter is required", code: "VALIDATION_ERROR", statusCode: 400 },
        { status: 400 },
      );
    }

    const set = await prisma.hashtagSet.findUnique({ where: { id } });
    if (!set) {
      return NextResponse.json(
        { error: "Not found", code: "NOT_FOUND", statusCode: 404 },
        { status: 404 },
      );
    }

    const page = await prisma.page.findFirst({
      where: { id: set.pageId, orgId: req.orgId },
    });
    if (!page) {
      return NextResponse.json(
        { error: "Not found", code: "NOT_FOUND", statusCode: 404 },
        { status: 404 },
      );
    }

    await prisma.hashtagSet.delete({ where: { id } });
    return NextResponse.json({ success: true });
  }),
);
