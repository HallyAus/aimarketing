import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, systemRole: true },
  });
  if (!user || (user.systemRole !== "ADMIN" && user.systemRole !== "SUPER_ADMIN")) return null;
  return user;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      memberships: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true, lastLoginAt: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      _count: {
        select: {
          memberships: true,
          platformConnections: true,
          posts: true,
        },
      },
    },
  });

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  // Get payment methods
  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { orgId: id },
    orderBy: { isDefault: "desc" },
  });

  // Get recent posts
  const recentPosts = await prisma.post.findMany({
    where: { orgId: id },
    select: {
      id: true,
      platform: true,
      content: true,
      status: true,
      scheduledAt: true,
      publishedAt: true,
      createdAt: true,
      pageName: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Get recent audit logs
  const auditLogs = await prisma.auditLog.findMany({
    where: { orgId: id },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    ...org,
    paymentMethods,
    recentPosts,
    auditLogs,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const allowedFields = [
    "name",
    "billingEmail",
    "maxUsers",
    "maxPlatforms",
    "maxPostsPerMonth",
    "features",
    "publishingPaused",
    "defaultTimezone",
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  for (const key of allowedFields) {
    if (key in body) {
      data[key] = body[key];
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
  }

  const before = await prisma.organization.findUnique({ where: { id } });

  const updated = await prisma.organization.update({
    where: { id },
    data,
  });

  await prisma.auditLog.create({
    data: {
      orgId: id,
      userId: admin.id,
      action: "ORG_UPDATED",
      entityType: "Organization",
      entityId: id,
      before: before ? JSON.parse(JSON.stringify(before)) : undefined,
      after: JSON.parse(JSON.stringify(data)),
    },
  });

  return NextResponse.json(updated);
}
