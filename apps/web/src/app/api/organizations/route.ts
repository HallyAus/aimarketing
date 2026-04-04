import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { createOrgSchema, checkPlanLimit } from "@reachpilot/shared";

// GET /api/organizations — list user's organizations
export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED", statusCode: 401 }, { status: 401 });
  }

  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          publishingPaused: true,
          createdAt: true,
        },
      },
    },
  });

  return NextResponse.json(
    memberships.map((m) => ({
      ...m.organization,
      role: m.role,
    }))
  );
});

// POST /api/organizations — create a new organization
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED", statusCode: 401 }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createOrgSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  // Check if slug is taken
  const existing = await prisma.organization.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Slug already taken", code: "SLUG_TAKEN", statusCode: 409 },
      { status: 409 }
    );
  }

  // Check org limit for current user
  const orgCount = await prisma.membership.count({
    where: { userId: session.user.id, role: "OWNER" },
  });

  // For now, use FREE plan limit. Will be refined when we check user's highest plan.
  if (orgCount >= 1) {
    // Check if user has any AGENCY plan orgs (which allow unlimited)
    const agencyOrg = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        role: "OWNER",
        organization: { plan: "AGENCY" },
      },
    });
    if (!agencyOrg) {
      return NextResponse.json(
        { error: "Organization limit reached for your plan", code: "PLAN_LIMIT", statusCode: 403 },
        { status: 403 }
      );
    }
  }

  const org = await prisma.organization.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      memberships: {
        create: {
          userId: session.user.id,
          role: "OWNER",
          acceptedAt: new Date(),
        },
      },
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      orgId: org.id,
      userId: session.user.id,
      action: "CREATE",
      entityType: "Organization",
      entityId: org.id,
      after: { name: org.name, slug: org.slug },
      ipAddress: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip"),
    },
  });

  return NextResponse.json(org, { status: 201 });
});
