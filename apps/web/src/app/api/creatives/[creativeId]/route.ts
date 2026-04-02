import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { updateCreativeSchema } from "@adpilot/shared";
import { deleteFromR2 } from "@/lib/r2";

// GET /api/creatives/[creativeId]
export const GET = withErrorHandler(withRole("VIEWER", async (req, context) => {
  const creativeId = (await context.params).creativeId!;

  const creative = await prisma.creative.findFirst({
    where: { id: creativeId, orgId: req.orgId },
  });

  if (!creative) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  return NextResponse.json(creative);
}));

// PATCH /api/creatives/[creativeId] — update name/tags
export const PATCH = withErrorHandler(withRole("EDITOR", async (req, context) => {
  const creativeId = (await context.params).creativeId!;
  const body = await req.json();
  const parsed = updateCreativeSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const existing = await prisma.creative.findFirst({
    where: { id: creativeId, orgId: req.orgId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  const creative = await prisma.creative.update({
    where: { id: creativeId },
    data: parsed.data,
  });

  return NextResponse.json(creative);
}));

// DELETE /api/creatives/[creativeId]
export const DELETE = withErrorHandler(withRole("EDITOR", async (req, context) => {
  const creativeId = (await context.params).creativeId!;

  const creative = await prisma.creative.findFirst({
    where: { id: creativeId, orgId: req.orgId },
  });

  if (!creative) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  // Delete from R2
  try {
    await deleteFromR2(creative.r2Key);
    if (creative.thumbnailUrl) {
      const thumbKey = creative.r2Key.replace(/\/original\./, "/thumb.");
      await deleteFromR2(thumbKey);
    }
  } catch (error) {
    console.warn("R2 cleanup failed:", error);
  }

  await prisma.creative.delete({ where: { id: creativeId } });

  await prisma.auditLog.create({
    data: {
      orgId: req.orgId,
      userId: req.userId,
      action: "DELETE",
      entityType: "Creative",
      entityId: creativeId,
      before: { name: creative.name, r2Key: creative.r2Key },
    },
  });

  return NextResponse.json({ success: true });
}));
