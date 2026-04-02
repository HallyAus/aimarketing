import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";

// GET /api/approvals — list approval requests for current org
export const GET = withErrorHandler(withRole("VIEWER", async (req) => {
  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "PENDING";

  const approvals = await prisma.approvalRequest.findMany({
    where: {
      post: { orgId: req.orgId },
      ...(status !== "ALL" ? { status } : {}),
    },
    include: {
      post: { select: { id: true, content: true, platform: true, pageName: true, status: true } },
      requester: { select: { id: true, name: true, email: true } },
      reviewer: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: approvals });
}));

// POST /api/approvals — create an approval request for a post
export const POST = withErrorHandler(withRole("EDITOR", async (req) => {
  const { postId } = await req.json();
  if (!postId) {
    return NextResponse.json({ error: "postId is required", code: "VALIDATION_ERROR", statusCode: 400 }, { status: 400 });
  }

  const post = await prisma.post.findFirst({ where: { id: postId, orgId: req.orgId } });
  if (!post) {
    return NextResponse.json({ error: "Post not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  const existing = await prisma.approvalRequest.findUnique({ where: { postId } });
  if (existing) {
    return NextResponse.json({ error: "Approval request already exists", code: "CONFLICT", statusCode: 409 }, { status: 409 });
  }

  const [approval] = await prisma.$transaction([
    prisma.approvalRequest.create({
      data: { postId, requestedBy: req.userId, status: "PENDING" },
    }),
    prisma.post.update({ where: { id: postId }, data: { status: "PENDING_APPROVAL" } }),
  ]);

  return NextResponse.json(approval, { status: 201 });
}));

// PATCH /api/approvals — approve or reject
export const PATCH = withErrorHandler(withRole("ADMIN", async (req) => {
  const { approvalId, action, comment } = await req.json();
  if (!approvalId || !["APPROVED", "REJECTED"].includes(action)) {
    return NextResponse.json({ error: "approvalId and action (APPROVED|REJECTED) are required", code: "VALIDATION_ERROR", statusCode: 400 }, { status: 400 });
  }

  const approval = await prisma.approvalRequest.findUnique({
    where: { id: approvalId },
    include: { post: true },
  });
  if (!approval || approval.post.orgId !== req.orgId) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  const [updated] = await prisma.$transaction([
    prisma.approvalRequest.update({
      where: { id: approvalId },
      data: { status: action, reviewedBy: req.userId, comment, reviewedAt: new Date() },
    }),
    prisma.post.update({
      where: { id: approval.postId },
      data: {
        status: action === "APPROVED" ? "APPROVED" : "REJECTED",
        approvedBy: action === "APPROVED" ? req.userId : undefined,
        rejectionReason: action === "REJECTED" ? comment : undefined,
      },
    }),
  ]);

  return NextResponse.json(updated);
}));
