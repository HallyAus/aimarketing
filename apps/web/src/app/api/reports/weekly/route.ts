import { NextResponse } from "next/server";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";
import { z } from "zod";

const sendSchema = z.object({
  recipients: z.array(z.string().email()).min(1, "At least one recipient required"),
  orgId: z.string().optional(),
});

function generateWeeklyHTML(data: {
  orgName: string;
  period: string;
  totalPosts: number;
  publishedPosts: number;
  totalImpressions: number;
  totalEngagement: number;
  engagementRate: number;
  topPost: { content: string; likes: number } | null;
  platformBreakdown: { platform: string; posts: number; engagement: number }[];
}): string {
  const platformRows = data.platformBreakdown
    .map(
      (p) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a3d;color:#e8e8ed;">${p.platform}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a3d;color:#9898a8;text-align:right;">${p.posts}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a3d;color:#9898a8;text-align:right;">${p.engagement.toLocaleString()}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#12121a;border:1px solid #2a2a3d;border-radius:12px;padding:24px;margin-bottom:16px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
        <div style="width:32px;height:32px;background:#3b82f6;border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:12px;">AP</div>
        <span style="color:#e8e8ed;font-weight:700;font-size:16px;">ReachPilot Weekly Report</span>
      </div>
      <h1 style="color:#e8e8ed;font-size:20px;margin:0 0 4px;">${data.orgName}</h1>
      <p style="color:#8888a0;font-size:13px;margin:0;">${data.period}</p>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:16px;">
      <div style="flex:1;background:#12121a;border:1px solid #1f1f2e;border-radius:12px;padding:16px;text-align:center;">
        <div style="color:#3b82f6;font-size:24px;font-weight:700;">${data.totalPosts}</div>
        <div style="color:#8888a0;font-size:11px;margin-top:4px;">Total Posts</div>
      </div>
      <div style="flex:1;background:#12121a;border:1px solid #1f1f2e;border-radius:12px;padding:16px;text-align:center;">
        <div style="color:#10b981;font-size:24px;font-weight:700;">${data.publishedPosts}</div>
        <div style="color:#8888a0;font-size:11px;margin-top:4px;">Published</div>
      </div>
      <div style="flex:1;background:#12121a;border:1px solid #1f1f2e;border-radius:12px;padding:16px;text-align:center;">
        <div style="color:#f59e0b;font-size:24px;font-weight:700;">${data.engagementRate.toFixed(1)}%</div>
        <div style="color:#8888a0;font-size:11px;margin-top:4px;">Engagement</div>
      </div>
    </div>

    <div style="background:#12121a;border:1px solid #1f1f2e;border-radius:12px;padding:16px;margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
        <div>
          <div style="color:#8888a0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">Impressions</div>
          <div style="color:#e8e8ed;font-size:18px;font-weight:600;">${data.totalImpressions.toLocaleString()}</div>
        </div>
        <div>
          <div style="color:#8888a0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">Total Engagement</div>
          <div style="color:#e8e8ed;font-size:18px;font-weight:600;">${data.totalEngagement.toLocaleString()}</div>
        </div>
      </div>
    </div>

    ${
      data.platformBreakdown.length > 0
        ? `<div style="background:#12121a;border:1px solid #1f1f2e;border-radius:12px;padding:16px;margin-bottom:16px;">
      <h3 style="color:#e8e8ed;font-size:14px;margin:0 0 12px;">Platform Breakdown</h3>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="padding:8px 12px;text-align:left;color:#8888a0;font-size:11px;text-transform:uppercase;border-bottom:1px solid #2a2a3d;">Platform</th>
            <th style="padding:8px 12px;text-align:right;color:#8888a0;font-size:11px;text-transform:uppercase;border-bottom:1px solid #2a2a3d;">Posts</th>
            <th style="padding:8px 12px;text-align:right;color:#8888a0;font-size:11px;text-transform:uppercase;border-bottom:1px solid #2a2a3d;">Engagement</th>
          </tr>
        </thead>
        <tbody>${platformRows}</tbody>
      </table>
    </div>`
        : ""
    }

    ${
      data.topPost
        ? `<div style="background:#12121a;border:1px solid #3b82f6;border-radius:12px;padding:16px;margin-bottom:16px;">
      <h3 style="color:#3b82f6;font-size:14px;margin:0 0 8px;">Top Performing Post</h3>
      <p style="color:#9898a8;font-size:13px;margin:0 0 8px;">${data.topPost.content.slice(0, 200)}${data.topPost.content.length > 200 ? "..." : ""}</p>
      <span style="color:#10b981;font-size:12px;">${data.topPost.likes} engagements</span>
    </div>`
        : ""
    }

    <div style="text-align:center;padding:16px;">
      <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/analytics" style="display:inline-block;background:#3b82f6;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;">View Full Analytics</a>
    </div>

    <p style="text-align:center;color:#8888a0;font-size:11px;margin-top:16px;">
      Sent by ReachPilot. Manage your report preferences in Settings.
    </p>
  </div>
</body>
</html>`;
}

// POST /api/reports/weekly — generate and send weekly report
export const POST = withErrorHandler(
  withRole("ADMIN", async (req) => {
    const body = await req.json();
    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) {
      throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const { recipients } = parsed.data;
    const orgId = req.orgId;

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true },
    });

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const now = new Date();

    const [totalPosts, publishedPosts, snapshots, posts] = await Promise.all([
      prisma.post.count({ where: { orgId, createdAt: { gte: weekAgo } } }),
      prisma.post.count({ where: { orgId, status: "PUBLISHED", publishedAt: { gte: weekAgo } } }),
      prisma.analyticsSnapshot.findMany({
        where: {
          post: { orgId, status: "PUBLISHED" },
          snapshotAt: { gte: weekAgo },
        },
        orderBy: { snapshotAt: "desc" },
        distinct: ["postId"],
        include: { post: { select: { content: true, platform: true } } },
      }),
      prisma.post.findMany({
        where: { orgId, status: "PUBLISHED", publishedAt: { gte: weekAgo } },
        select: { platform: true },
      }),
    ]);

    const totalImpressions = snapshots.reduce((sum, s) => sum + s.impressions, 0);
    const totalEngagement = snapshots.reduce(
      (sum, s) => sum + s.likes + s.comments + s.shares + s.saves,
      0
    );
    const engagementRate = totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0;

    // Top post
    const topSnapshot = snapshots.sort(
      (a, b) =>
        b.likes + b.comments + b.shares + b.saves -
        (a.likes + a.comments + a.shares + a.saves)
    )[0];
    const topPost = topSnapshot
      ? {
          content: topSnapshot.post.content,
          likes: topSnapshot.likes + topSnapshot.comments + topSnapshot.shares + topSnapshot.saves,
        }
      : null;

    // Platform breakdown
    const platformMap = new Map<string, { posts: number; engagement: number }>();
    for (const p of posts) {
      const existing = platformMap.get(p.platform) ?? { posts: 0, engagement: 0 };
      existing.posts++;
      platformMap.set(p.platform, existing);
    }
    for (const s of snapshots) {
      const existing = platformMap.get(s.platform);
      if (existing) {
        existing.engagement += s.likes + s.comments + s.shares + s.saves;
      }
    }

    const platformBreakdown = Array.from(platformMap.entries()).map(
      ([platform, data]) => ({ platform: platform.replace("_", " "), ...data })
    );

    const period = `${weekAgo.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

    const html = generateWeeklyHTML({
      orgName: org?.name ?? "Your Organization",
      period,
      totalPosts,
      publishedPosts,
      totalImpressions,
      totalEngagement,
      engagementRate,
      topPost,
      platformBreakdown,
    });

    // Send via Resend
    let sent = false;
    if (process.env.RESEND_API_KEY) {
      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || "ReachPilot <reports@reachpilot.app>",
            to: recipients,
            subject: `Weekly Performance Report - ${period}`,
            html,
          }),
        });
        sent = resendRes.ok;
      } catch {
        // Resend failed, still return the HTML
      }
    }

    // Store the report
    await prisma.performanceReport.create({
      data: {
        orgId,
        reportType: "WEEKLY",
        startDate: weekAgo,
        endDate: now,
        data: {
          totalPosts,
          publishedPosts,
          totalImpressions,
          totalEngagement,
          engagementRate,
          platformBreakdown,
        },
        sentTo: recipients,
      },
    });

    return NextResponse.json({ sent, html, period });
  })
);

// GET /api/reports/weekly — preview weekly report HTML
export const GET = withErrorHandler(
  withRole("VIEWER", async (req) => {
    const reports = await prisma.performanceReport.findMany({
      where: { orgId: req.orgId, reportType: "WEEKLY" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        data: true,
        sentTo: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ reports });
  })
);
