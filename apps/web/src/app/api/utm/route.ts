import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";

// GET /api/utm — list UTM links for current org
export const GET = withErrorHandler(withRole("VIEWER", async (req) => {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  const [links, total] = await Promise.all([
    prisma.utmLink.findMany({
      where: { orgId: req.orgId },
      include: { post: { select: { id: true, content: true, platform: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.utmLink.count({ where: { orgId: req.orgId } }),
  ]);

  return NextResponse.json({ data: links, pagination: { page, limit, total, hasMore: skip + links.length < total } });
}));

// POST /api/utm — create a new UTM link
export const POST = withErrorHandler(withRole("EDITOR", async (req) => {
  const { url: baseUrl, source, medium, campaign, term, content, postId } = await req.json();
  if (!baseUrl || !source || !medium || !campaign) {
    return NextResponse.json({ error: "url, source, medium, and campaign are required", code: "VALIDATION_ERROR", statusCode: 400 }, { status: 400 });
  }

  // Build the full UTM URL
  const utmUrl = new URL(baseUrl);
  utmUrl.searchParams.set("utm_source", source);
  utmUrl.searchParams.set("utm_medium", medium);
  utmUrl.searchParams.set("utm_campaign", campaign);
  if (term) utmUrl.searchParams.set("utm_term", term);
  if (content) utmUrl.searchParams.set("utm_content", content);

  const link = await prisma.utmLink.create({
    data: {
      orgId: req.orgId,
      postId: postId ?? null,
      url: utmUrl.toString(),
      source,
      medium,
      campaign,
      term: term ?? null,
      content: content ?? null,
    },
  });

  return NextResponse.json(link, { status: 201 });
}));

// DELETE /api/utm — delete a UTM link
export const DELETE = withErrorHandler(withRole("EDITOR", async (req) => {
  const url = new URL(req.url);
  const linkId = url.searchParams.get("linkId");
  if (!linkId) {
    return NextResponse.json({ error: "linkId is required", code: "VALIDATION_ERROR", statusCode: 400 }, { status: 400 });
  }

  const link = await prisma.utmLink.findFirst({ where: { id: linkId, orgId: req.orgId } });
  if (!link) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  await prisma.utmLink.delete({ where: { id: linkId } });
  return NextResponse.json({ success: true });
}));
