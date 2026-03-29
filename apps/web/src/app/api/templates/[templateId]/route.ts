import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@adpilot/db";
import { updateTemplateSchema } from "@adpilot/shared";

export const GET = withErrorHandler(withRole("VIEWER", async (req, context) => {
  const { templateId } = await context.params;
  const template = await prisma.postTemplate.findFirst({
    where: { id: templateId, orgId: req.orgId },
  });
  if (!template) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }
  return NextResponse.json(template);
}));

export const PATCH = withErrorHandler(withRole("EDITOR", async (req, context) => {
  const { templateId } = await context.params;
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
  const template = await prisma.postTemplate.update({
    where: { id: templateId },
    data: parsed.data,
  });
  return NextResponse.json(template);
}));

export const DELETE = withErrorHandler(withRole("EDITOR", async (req, context) => {
  const { templateId } = await context.params;
  const existing = await prisma.postTemplate.findFirst({
    where: { id: templateId, orgId: req.orgId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }
  await prisma.postTemplate.delete({ where: { id: templateId } });
  return NextResponse.json({ success: true });
}));
