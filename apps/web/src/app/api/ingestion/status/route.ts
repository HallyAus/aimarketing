import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth-middleware";

export const GET = withAuth(async (req: NextRequest & { userId: string; orgId: string }) => {
  const pageId = req.nextUrl.searchParams.get("pageId");

  if (!pageId) {
    return NextResponse.json(
      { error: "Missing pageId parameter", code: "BAD_REQUEST" },
      { status: 400 },
    );
  }

  // Verify the page belongs to the user's org
  const page = await prisma.page.findFirst({
    where: { id: pageId, orgId: req.orgId },
    select: { id: true },
  });

  if (!page) {
    return NextResponse.json(
      { error: "Page not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  // Get the latest ingestion job for this page
  const job = await prisma.ingestionJob.findFirst({
    where: { pageId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      progress: true,
      processedItems: true,
      failedItems: true,
      totalItems: true,
      oldestPostDate: true,
      startedAt: true,
      completedAt: true,
      lastActivityAt: true,
      errorMessage: true,
      rateLimitHits: true,
      nextRetryAfter: true,
      createdAt: true,
    },
  });

  if (!job) {
    return NextResponse.json({ job: null });
  }

  return NextResponse.json({ job });
});
