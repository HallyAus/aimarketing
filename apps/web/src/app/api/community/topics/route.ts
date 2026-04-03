import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

// GET /api/community/topics — list org's community topics
export const GET = withErrorHandler(
  withRole("VIEWER", async (req) => {
    const topics = await prisma.communityTopic.findMany({
      where: { orgId: req.orgId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ topics });
  }),
);

// POST /api/community/topics — add a topic
export const POST = withErrorHandler(
  withRole("EDITOR", async (req) => {
    const { topic } = await req.json();
    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const trimmed = topic.trim().toLowerCase();

    // Check for duplicate
    const existing = await prisma.communityTopic.findUnique({
      where: { orgId_topic: { orgId: req.orgId, topic: trimmed } },
    });
    if (existing) {
      return NextResponse.json({ error: "Topic already exists" }, { status: 409 });
    }

    // Limit to 20 topics per org
    const count = await prisma.communityTopic.count({ where: { orgId: req.orgId } });
    if (count >= 20) {
      return NextResponse.json({ error: "Maximum 20 topics allowed" }, { status: 400 });
    }

    const created = await prisma.communityTopic.create({
      data: { orgId: req.orgId, topic: trimmed },
    });

    return NextResponse.json({ topic: created });
  }),
);

// DELETE /api/community/topics — remove a topic
export const DELETE = withErrorHandler(
  withRole("EDITOR", async (req) => {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Topic ID is required" }, { status: 400 });
    }

    await prisma.communityTopic.deleteMany({
      where: { id, orgId: req.orgId },
    });

    return NextResponse.json({ success: true });
  }),
);
