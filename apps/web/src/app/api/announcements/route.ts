import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the user's organization tier
  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: {
      organization: { select: { plan: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const userTier = membership?.organization.plan || "FREE";
  const now = new Date();

  const announcements = await prisma.announcement.findMany({
    where: {
      isActive: true,
      OR: [
        { showFrom: null },
        { showFrom: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { showUntil: null },
            { showUntil: { gte: now } },
          ],
        },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter by tier on the application side (Prisma array contains is limited)
  const filtered = announcements.filter(
    (a) => a.targetTiers.length === 0 || a.targetTiers.includes(userTier)
  );

  return NextResponse.json({ announcements: filtered });
}
