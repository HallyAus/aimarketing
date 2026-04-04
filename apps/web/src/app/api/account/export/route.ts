import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";

/**
 * POST /api/account/export
 *
 * GDPR Article 20 — Right to Data Portability
 * Collects all user data and returns as machine-readable JSON.
 * Protected by auth. Rate-limited to 1 export per 24 hours. Audit logged.
 */
export const POST = withErrorHandler(async (req) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED", statusCode: 401 },
      { status: 401 },
    );
  }

  const userId = session.user.id;

  // --- Rate limit: 1 export per 24 hours ---
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentExport = await prisma.auditLog.findFirst({
    where: {
      userId,
      action: "DATA_EXPORT",
      createdAt: { gte: oneDayAgo },
    },
  });

  if (recentExport) {
    return NextResponse.json(
      {
        error: "You can only request one data export every 24 hours.",
        code: "RATE_LIMITED",
        statusCode: 429,
      },
      { status: 429 },
    );
  }

  // --- Collect all user data ---
  const [user, memberships, posts, connections, analytics, campaigns, auditLogs] =
    await Promise.all([
      // Profile
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          timezone: true,
          locale: true,
          dateFormat: true,
          onboardingComplete: true,
          setupComplete: true,
          createdAt: true,
          updatedAt: true,
        },
      }),

      // Organization memberships
      prisma.membership.findMany({
        where: { userId },
        select: {
          orgId: true,
          role: true,
          acceptedAt: true,
          createdAt: true,
          organization: {
            select: { name: true, slug: true },
          },
        },
      }),

      // Posts created within user's orgs
      prisma.post.findMany({
        where: {
          organization: {
            memberships: { some: { userId } },
          },
        },
        select: {
          id: true,
          platform: true,
          content: true,
          mediaUrls: true,
          scheduledAt: true,
          publishedAt: true,
          status: true,
          tone: true,
          sourceUrl: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),

      // Connected accounts (NO tokens — security)
      prisma.platformConnection.findMany({
        where: { connectedBy: userId },
        select: {
          id: true,
          platform: true,
          platformUserId: true,
          platformAccountName: true,
          scopes: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          // Deliberately excluding accessToken, refreshToken
        },
      }),

      // Analytics snapshots for user's posts (excluding LinkedIn per API terms)
      prisma.analyticsSnapshot.findMany({
        where: {
          platform: { notIn: ["LINKEDIN", "LINKEDIN_PAGE"] },
          post: {
            organization: {
              memberships: { some: { userId } },
            },
          },
        },
        select: {
          id: true,
          postId: true,
          platform: true,
          snapshotAt: true,
          impressions: true,
          reach: true,
          clicks: true,
          likes: true,
          comments: true,
          shares: true,
          saves: true,
          videoViews: true,
          createdAt: true,
        },
        orderBy: { snapshotAt: "desc" },
        take: 5000, // Cap to avoid memory issues
      }),

      // Campaigns
      prisma.campaign.findMany({
        where: {
          organization: {
            memberships: { some: { userId } },
          },
        },
        select: {
          id: true,
          name: true,
          status: true,
          objective: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),

      // Audit logs for this user
      prisma.auditLog.findMany({
        where: { userId },
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1000,
      }),
    ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    format: "ReachPilot Data Export v1",
    profile: user,
    memberships,
    posts,
    connections,
    analytics,
    campaigns,
    auditLogs,
  };

  // --- Audit log the export ---
  await prisma.auditLog.create({
    data: {
      userId,
      orgId: session.user.currentOrgId ?? null,
      action: "DATA_EXPORT",
      entityType: "User",
      entityId: userId,
      after: { exportedAt: exportData.exportedAt },
    },
  });

  return NextResponse.json(exportData, {
    headers: {
      "Content-Disposition": `attachment; filename="reachpilot-data-export-${userId}.json"`,
      "Content-Type": "application/json",
    },
  });
});
