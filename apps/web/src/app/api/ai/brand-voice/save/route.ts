import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";

// GET /api/ai/brand-voice/save — list saved brand voices for the org's pages
export const GET = withErrorHandler(
  withAuth(async (req) => {
    const pageId = req.nextUrl.searchParams.get("pageId");

    // Get all pages for this org, then find brand voices
    const pages = await prisma.page.findMany({
      where: { orgId: req.orgId },
      select: { id: true },
    });
    const pageIds = pageId ? [pageId] : pages.map((p) => p.id);

    const voices = await prisma.brandVoice.findMany({
      where: { pageId: { in: pageIds } },
      orderBy: { createdAt: "desc" },
      include: { page: { select: { id: true, name: true, platform: true } } },
    });

    return NextResponse.json({ voices });
  }),
);

// POST /api/ai/brand-voice/save — save a brand voice profile
export const POST = withErrorHandler(
  withAuth(async (req) => {
    const body = await req.json();
    const { pageId, name, description, sampleTexts, aiPrompt, isDefault } = body;

    if (!pageId || !name) {
      return NextResponse.json(
        { error: "pageId and name are required", code: "VALIDATION_ERROR", statusCode: 400 },
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

    // If setting as default, unset any existing defaults for this page
    if (isDefault) {
      await prisma.brandVoice.updateMany({
        where: { pageId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const voice = await prisma.brandVoice.create({
      data: {
        pageId,
        name,
        description: description ?? null,
        sampleTexts: sampleTexts ?? [],
        aiPrompt: aiPrompt ?? null,
        isDefault: isDefault ?? false,
      },
    });

    return NextResponse.json(voice, { status: 201 });
  }),
);

// DELETE /api/ai/brand-voice/save?id=xxx — delete a brand voice
export const DELETE = withErrorHandler(
  withAuth(async (req) => {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "id query parameter is required", code: "VALIDATION_ERROR", statusCode: 400 },
        { status: 400 },
      );
    }

    const voice = await prisma.brandVoice.findUnique({ where: { id } });
    if (!voice) {
      return NextResponse.json(
        { error: "Not found", code: "NOT_FOUND", statusCode: 404 },
        { status: 404 },
      );
    }

    // Verify ownership via page -> org
    const page = await prisma.page.findFirst({
      where: { id: voice.pageId, orgId: req.orgId },
    });
    if (!page) {
      return NextResponse.json(
        { error: "Not found", code: "NOT_FOUND", statusCode: 404 },
        { status: 404 },
      );
    }

    await prisma.brandVoice.delete({ where: { id } });
    return NextResponse.json({ success: true });
  }),
);
