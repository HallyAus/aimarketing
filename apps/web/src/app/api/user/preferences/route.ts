import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const twoFactor = await prisma.twoFactorSecret.findUnique({
    where: { userId: session.user.id },
    select: { verified: true, enabledAt: true },
  });

  return NextResponse.json({
    twoFactorEnabled: twoFactor?.verified ?? false,
    twoFactorEnabledAt: twoFactor?.enabledAt?.toISOString() ?? null,
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { lastSelectedPageId } = body;

    if (typeof lastSelectedPageId !== "string" || !lastSelectedPageId) {
      return NextResponse.json(
        { error: "lastSelectedPageId is required" },
        { status: 400 },
      );
    }

    // Verify the page exists and belongs to an org the user is a member of
    const page = await prisma.page.findUnique({
      where: { id: lastSelectedPageId },
      select: { orgId: true },
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id, orgId: page.orgId },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastSelectedPageId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
