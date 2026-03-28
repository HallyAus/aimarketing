import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@adpilot/db";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED", statusCode: 401 }, { status: 401 });
  }

  const { orgId } = await req.json();
  if (!orgId) {
    return NextResponse.json({ error: "orgId required", code: "VALIDATION_ERROR", statusCode: 400 }, { status: 400 });
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_orgId: { userId: session.user.id, orgId } },
    include: { organization: { select: { deletedAt: true } } },
  });

  if (!membership || membership.organization.deletedAt) {
    return NextResponse.json({ error: "Not a member of this organization", code: "FORBIDDEN", statusCode: 403 }, { status: 403 });
  }

  const cookieStore = await cookies();
  cookieStore.set("adpilot-org-id", orgId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({
    orgId: membership.orgId,
    role: membership.role,
  });
}
