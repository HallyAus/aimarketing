import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@adpilot/db";
import { createTemplateSchema, sanitizeHtml } from "@adpilot/shared";

export const GET = withErrorHandler(withRole("VIEWER", async (req) => {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  const where = { orgId: req.orgId };

  const [templates, total] = await Promise.all([
    prisma.postTemplate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.postTemplate.count({ where }),
  ]);

  return NextResponse.json({
    data: templates,
    pagination: { page, limit, total, hasMore: skip + templates.length < total },
  });
}));

export const POST = withErrorHandler(withRole("EDITOR", async (req) => {
  const body = await req.json();
  const parsed = createTemplateSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const sanitizedData = {
    ...parsed.data,
    name: sanitizeHtml(parsed.data.name),
    content: sanitizeHtml(parsed.data.content),
  };

  const template = await prisma.postTemplate.create({
    data: {
      orgId: req.orgId,
      createdBy: req.userId,
      ...sanitizedData,
    },
  });

  return NextResponse.json(template, { status: 201 });
}));
