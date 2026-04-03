import { getSessionOrg } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ActiveAccountBanner } from "@/components/active-account-banner";
import { getActiveAccount } from "@/lib/active-account";
import { getActivePageId, pageWhere } from "@/lib/active-page";
import { CalendarHeatmapToggle } from "./calendar-heatmap";
import { CalendarGrid } from "./calendar-grid";
import type { CalendarPost } from "./post-detail-panel";

/** Palette of 10 distinct colors for page/account differentiation */
const PAGE_COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
  "#06b6d4", // cyan
  "#f97316", // orange
  "#6366f1", // indigo
  "#14b8a6", // teal
];

/** Deterministic color from pageId hash */
function getPageColor(pageId: string): string {
  let hash = 0;
  for (let i = 0; i < pageId.length; i++) {
    hash = ((hash << 5) - hash + pageId.charCodeAt(i)) | 0;
  }
  return PAGE_COLORS[Math.abs(hash) % PAGE_COLORS.length]!;
}

export const metadata: Metadata = {
  title: "Content Calendar",
  robots: { index: false },
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = parseInt(params.year ?? String(now.getFullYear()), 10);
  const month = parseInt(params.month ?? String(now.getMonth() + 1), 10);

  const activeAccount = await getActiveAccount();
  const orgId = await getSessionOrg();
  const activePageId = await getActivePageId(orgId);
  const pf = pageWhere(activePageId);

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  const startDay = startOfMonth.getDay(); // 0=Sunday
  const daysInMonth = endOfMonth.getDate();

  // Get posts for this month
  const posts = await prisma.post.findMany({
    where: {
      orgId,
      status: { notIn: ["DELETED"] },
      ...pf,
      OR: [
        { scheduledAt: { gte: startOfMonth, lte: endOfMonth } },
        { publishedAt: { gte: startOfMonth, lte: endOfMonth } },
      ],
    },
    include: { campaign: { select: { name: true } } },
    orderBy: { scheduledAt: "asc" },
  });

  // Serialize posts for client components
  const serializedPosts: CalendarPost[] = posts.map((post) => ({
    id: post.id,
    campaignId: post.campaignId,
    content: post.content,
    platform: post.platform,
    pageName: post.pageName,
    pageId: post.pageId,
    status: post.status,
    scheduledAt: post.scheduledAt?.toISOString() ?? null,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    campaignName: post.campaign?.name ?? null,
    errorMessage: post.errorMessage,
    version: post.version,
  }));

  // Group serialized posts by day
  const postsByDay: Record<number, CalendarPost[]> = {};
  for (const post of serializedPosts) {
    const date = post.publishedAt ?? post.scheduledAt;
    if (!date) continue;
    const day = new Date(date).getDate();
    if (!postsByDay[day]) postsByDay[day] = [];
    postsByDay[day].push(post);
  }

  // Build legend: unique pages/accounts
  const uniquePages = new Map<string, { color: string; label: string }>();
  for (const post of posts) {
    if (post.pageId && !uniquePages.has(post.pageId)) {
      uniquePages.set(post.pageId, {
        color: getPageColor(post.pageId),
        label: post.pageName ?? post.pageId,
      });
    }
  }

  // Post count by day for heatmap
  const postCountByDay: Record<number, number> = {};
  for (let d = 1; d <= daysInMonth; d++) {
    postCountByDay[d] = postsByDay[d]?.length ?? 0;
  }

  const monthName = startOfMonth.toLocaleString("default", { month: "long" });
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return (
    <div>
      <PageHeader
        title="Content Calendar"
        subtitle={activeAccount ? `See all your posts on a monthly calendar \— click any post to edit, reschedule, or delete \— ${activeAccount.name}` : "See all your posts on a monthly calendar \— click any post to edit, reschedule, or delete"}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Calendar" },
        ]}
      />
      <ActiveAccountBanner account={activeAccount} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-4">
          <a
            href={`/calendar?month=${prevMonth}&year=${prevYear}`}
            className="text-sm min-h-[44px] flex items-center"
            style={{ color: "var(--text-secondary)" }}
          >
            &larr; Prev
          </a>
          <span className="font-medium" style={{ color: "var(--text-primary)" }}>{monthName} {year}</span>
          <a
            href={`/calendar?month=${nextMonth}&year=${nextYear}`}
            className="text-sm min-h-[44px] flex items-center"
            style={{ color: "var(--text-secondary)" }}
          >
            Next &rarr;
          </a>
        </div>

        {/* Status legend */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "var(--accent-blue)" }} />
            Scheduled
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "var(--accent-emerald)" }} />
            Published
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "var(--text-tertiary)" }} />
            Draft
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "var(--accent-red)" }} />
            Failed
          </div>
        </div>
      </div>

      <CalendarHeatmapToggle
        year={year}
        month={month}
        daysInMonth={daysInMonth}
        startDay={startDay}
        postCountByDay={postCountByDay}
        monthName={monthName}
      >
        {/* Page/account legend */}
        {uniquePages.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {Array.from(uniquePages.entries()).map(([id, { color, label }]) => (
              <div key={id} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                {label}
              </div>
            ))}
          </div>
        )}

        {/* Interactive calendar grid (client component) */}
        <CalendarGrid
          year={year}
          month={month}
          daysInMonth={daysInMonth}
          startDay={startDay}
          monthName={monthName}
          postsByDay={postsByDay}
        />
      </CalendarHeatmapToggle>
    </div>
  );
}
