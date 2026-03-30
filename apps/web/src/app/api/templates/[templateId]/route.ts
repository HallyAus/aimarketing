import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@adpilot/db";
import { updateTemplateSchema, sanitizeHtml } from "@adpilot/shared";

export const GET = withErrorHandler(withRole("VIEWER", async (req, context) => {
  const templateId = (await context.params).templateId!;
  const template = await prisma.postTemplate.findFirst({
    where: { id: templateId, orgId: req.orgId },
  });
  if (!template) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }
  return NextResponse.json(template);
}));

export const PATCH = withErrorHandler(withRole("EDITOR", async (req, context) => {
  const templateId = (await context.params).templateId!;
  const body = await req.json();
  const parsed = updateTemplateSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }
  const existing = await prisma.postTemplate.findFirst({
    where: { id: templateId, orgId: req.orgId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }
  const sanitizedData = {
    ...parsed.data,
    ...(parsed.data.name && { name: sanitizeHtml(parsed.data.name) }),
    ...(parsed.data.content && { content: sanitizeHtml(parsed.data.content) }),
  };
  const template = await prisma.postTemplate.update({
    where: { id: templateId },
    data: sanitizedData,
  });
  return NextResponse.json(template);
}));

export const DELETE = withErrorHandler(withRole("EDITOR", async (req, context) => {
  const templateId = (await context.params).templateId!;
  const existing = await prisma.postTemplate.findFirst({
    where: { id: templateId, orgId: req.orgId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }
  await prisma.postTemplate.delete({ where: { id: templateId } });
  return NextResponse.json({ success: true });
}));
