import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";

// GET /api/pages — list pages for current org
export const GET = withErrorHandler(
  withAuth(async (req) => {
    const pages = await prisma.page.findMany({
      where: { orgId: req.orgId, isActive: true },
      select: {
        id: true,
        platform: true,
        name: true,
        platformPageId: true,
        pictureUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: pages });
  }),
);
