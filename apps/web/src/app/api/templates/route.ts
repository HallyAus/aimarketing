import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@adpilot/db";
import { createTemplateSchema } from "@adpilot/shared";

export const GET = withErrorHandler(withRole("VIEWER", async (req) => {
  const templates = await prisma.postTemplate.findMany({
    where: { orgId: req.orgId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(templates);
}));

export const POST = withErrorHandler(withRole("EDITOR", async (req) => {
  const body = await req.json();
  const parsed = createTemplateSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const template = await prisma.postTemplate.create({
    data: {
      orgId: req.orgId,
      createdBy: req.userId,
      ...parsed.data,
    },
  });

  return NextResponse.json(template, { status: 201 });
}));
