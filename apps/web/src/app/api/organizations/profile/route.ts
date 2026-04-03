import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { withAuth, withRole } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";
import { z } from "zod";

const profileSchema = z.object({
  businessProfile: z.object({
    businessName: z.string().max(200).optional(),
    websiteUrl: z.string().max(2000).optional(),
    industry: z.string().max(200).optional(),
    targetAudience: z.string().max(2000).optional(),
    competitorUrls: z.array(z.string().max(2000)).max(5).optional(),
    brandKeywords: z.string().max(1000).optional(),
  }),
});

// GET /api/organizations/profile
export const GET = withErrorHandler(withAuth(async (req) => {
  const org = await prisma.organization.findUnique({
    where: { id: req.orgId },
    select: { name: true, metadata: true },
  });

  if (!org) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const meta = org.metadata as Record<string, unknown> | null;
  return NextResponse.json({
    orgName: org.name,
    businessProfile: meta?.businessProfile ?? null,
  });
}));

// PATCH /api/organizations/profile
export const PATCH = withErrorHandler(withRole("EDITOR", async (req) => {
  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const org = await prisma.organization.findUnique({
    where: { id: req.orgId },
    select: { metadata: true },
  });

  const existingMeta = (org?.metadata as Record<string, unknown>) ?? {};
  const updatedMeta = {
    ...existingMeta,
    businessProfile: parsed.data.businessProfile,
  };

  await prisma.organization.update({
    where: { id: req.orgId },
    data: { metadata: updatedMeta },
  });

  return NextResponse.json({ success: true });
}));
