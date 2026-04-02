import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";

// GET /api/rss — list RSS feeds for current org
export const GET = withErrorHandler(withRole("VIEWER", async (req) => {
  const url = new URL(req.url);
  const pageId = url.searchParams.get("pageId");

  const feeds = await prisma.rssFeed.findMany({
    where: {
      page: { orgId: req.orgId },
      ...(pageId ? { pageId } : {}),
    },
    include: { page: { select: { id: true, name: true, platform: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: feeds });
}));

// POST /api/rss — create a new RSS feed
export const POST = withErrorHandler(withRole("EDITOR", async (req) => {
  const { pageId, url: feedUrl, name, autoPost, tone } = await req.json();
  if (!pageId || !feedUrl) {
    return NextResponse.json({ error: "pageId and url are required", code: "VALIDATION_ERROR", statusCode: 400 }, { status: 400 });
  }

  const page = await prisma.page.findFirst({ where: { id: pageId, orgId: req.orgId } });
  if (!page) {
    return NextResponse.json({ error: "Page not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  const feed = await prisma.rssFeed.create({
    data: { pageId, url: feedUrl, name: name ?? null, autoPost: autoPost ?? false, tone: tone ?? null },
  });

  return NextResponse.json(feed, { status: 201 });
}));

// PATCH /api/rss — update an RSS feed
export const PATCH = withErrorHandler(withRole("EDITOR", async (req) => {
  const { feedId, isActive, autoPost, tone, name } = await req.json();
  if (!feedId) {
    return NextResponse.json({ error: "feedId is required", code: "VALIDATION_ERROR", statusCode: 400 }, { status: 400 });
  }

  const feed = await prisma.rssFeed.findUnique({ where: { id: feedId }, include: { page: true } });
  if (!feed || feed.page.orgId !== req.orgId) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  const updated = await prisma.rssFeed.update({
    where: { id: feedId },
    data: {
      ...(isActive !== undefined ? { isActive } : {}),
      ...(autoPost !== undefined ? { autoPost } : {}),
      ...(tone !== undefined ? { tone } : {}),
      ...(name !== undefined ? { name } : {}),
      lastCheckedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}));

// DELETE /api/rss — delete an RSS feed
export const DELETE = withErrorHandler(withRole("EDITOR", async (req) => {
  const url = new URL(req.url);
  const feedId = url.searchParams.get("feedId");
  if (!feedId) {
    return NextResponse.json({ error: "feedId is required", code: "VALIDATION_ERROR", statusCode: 400 }, { status: 400 });
  }

  const feed = await prisma.rssFeed.findUnique({ where: { id: feedId }, include: { page: true } });
  if (!feed || feed.page.orgId !== req.orgId) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  await prisma.rssFeed.delete({ where: { id: feedId } });
  return NextResponse.json({ success: true });
}));
