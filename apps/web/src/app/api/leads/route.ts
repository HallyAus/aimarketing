import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";
import { Prisma } from "@adpilot/db";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email").max(200),
  company: z.string().max(200).optional(),
  source: z.string().max(200).optional(),
  pageId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().max(200).optional(),
  company: z.string().max(200).optional(),
  source: z.string().max(200).optional(),
});

// GET /api/leads — list leads for org
export const GET = withErrorHandler(
  withRole("VIEWER", async (req) => {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || undefined;
    const take = Math.min(parseInt(url.searchParams.get("take") ?? "100"), 500);
    const skip = parseInt(url.searchParams.get("skip") ?? "0");

    const pageId = url.searchParams.get("pageId") || undefined;

    const where: Record<string, unknown> = { orgId: req.orgId };
    if (pageId) {
      where.pageId = pageId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.leadCapture.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.leadCapture.count({ where }),
    ]);

    return NextResponse.json({ leads, total });
  })
);

// POST /api/leads — create a lead (also used by embed form, so uses withErrorHandler without auth for embed)
export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const { name, email, company, source, pageId, metadata } = parsed.data;

  // Try to get orgId from auth, or from a header for embed forms
  let orgId: string | null = null;

  // Check for auth session
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    if (session?.user?.currentOrgId) {
      orgId = session.user.currentOrgId;
    }
  } catch {
    // No auth available
  }

  // For embed forms, use the first org (or a specific org ID from header)
  if (!orgId) {
    const headerOrgId = req.headers.get("x-adpilot-org");
    if (headerOrgId) {
      orgId = headerOrgId;
    } else {
      // Fallback: find first org
      const org = await prisma.organization.findFirst({
        where: { deletedAt: null },
        select: { id: true },
      });
      orgId = org?.id ?? null;
    }
  }

  if (!orgId) {
    return NextResponse.json({ error: "No organization found" }, { status: 400 });
  }

  const lead = await prisma.leadCapture.create({
    data: {
      orgId,
      name,
      email,
      company: company || null,
      source: source || null,
      pageId: pageId || null,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
    },
  });

  return NextResponse.json({ lead }, { status: 201 });
});

// PATCH /api/leads — update a lead
export const PATCH = withErrorHandler(
  withRole("EDITOR", async (req) => {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const { id, ...updates } = parsed.data;

    // Verify the lead belongs to the org
    const existing = await prisma.leadCapture.findFirst({
      where: { id, orgId: req.orgId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const lead = await prisma.leadCapture.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ lead });
  })
);

// DELETE /api/leads — delete a lead
export const DELETE = withErrorHandler(
  withRole("EDITOR", async (req) => {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      throw new ZodValidationError("Lead ID is required");
    }

    const existing = await prisma.leadCapture.findFirst({
      where: { id, orgId: req.orgId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    await prisma.leadCapture.delete({ where: { id } });

    return NextResponse.json({ success: true });
  })
);
