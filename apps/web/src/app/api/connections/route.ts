import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";

// GET /api/connections — list active platform connections for current org
export const GET = withErrorHandler(
  withRole("VIEWER", async (req) => {
    const connections = await prisma.platformConnection.findMany({
      where: {
        orgId: req.orgId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        platform: true,
        platformAccountName: true,
        platformUserId: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: connections });
  }),
);
