import { getSessionOrg } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ActiveAccountBanner } from "@/components/active-account-banner";
import { getActiveAccount, getPageFilter } from "@/lib/active-account";
import { getPlatformAccent, getPlatformLabel } from "@/lib/platform-colors";

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

/** Get the accent color for a post: page-based if pageId exists, else platform default */
function getPostAccent(post: { pageId: string | null; platform: string }): string {
  return post.pageId ? getPageColor(post.pageId) : getPlatformAccent(post.platform);
}

/** Display label for a post entry */
function getPostLabel(post: { pageName: string | null; campaign: { name: string } | null }): string {
  return post.pageName ?? post.campaign?.name ?? "Draft";
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
  const pageFilter = getPageFilter(activeAccount);

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  const startDay = startOfMonth.getDay(); // 0=Sunday
  const daysInMonth = endOfMonth.getDate();

  // Get posts for this month
  const posts = await prisma.post.findMany({
    where: {
      orgId: await getSessionOrg(),
      status: { notIn: ["DELETED"] },
      ...pageFilter,
      OR: [
        { scheduledAt: { gte: startOfMonth, lte: endOfMonth } },
        { publishedAt: { gte: startOfMonth, lte: endOfMonth } },
      ],
    },
    include: { campaign: { select: { name: true } } },
    orderBy: { scheduledAt: "asc" },
  });

  // Group posts by day
  const postsByDay = new Map<number, typeof posts>();
  for (const post of posts) {
    const date = post.publishedAt ?? post.scheduledAt;
    if (!date) continue;
    const day = date.getDate();
    const existing = postsByDay.get(day) ?? [];
    existing.push(post);
    postsByDay.set(day, existing);
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

  const monthName = startOfMonth.toLocaleString("default", { month: "long" });
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return (
    <div>
      <PageHeader
        title="Content Calendar"
        subtitle={activeAccount ? `Showing: ${activeAccount.name}` : "Showing: All Accounts"}
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
      </div>

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

      {/* Mobile list view */}
      <div className="md:hidden space-y-2">
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayPosts = postsByDay.get(day) ?? [];
          if (dayPosts.length === 0) return null;
          const isToday = day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();
          const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const dayOfWeek = new Date(year, month - 1, day).getDay();

          return (
            <div
              key={day}
              className="rounded-lg p-3"
              style={{
                background: "var(--bg-secondary)",
                border: isToday ? "1px solid var(--accent-blue)" : "1px solid var(--border-primary)",
              }}
            >
              <div
                className="text-sm font-medium mb-2"
                style={{ color: isToday ? "var(--accent-blue)" : "var(--text-primary)" }}
              >
                {dayNames[dayOfWeek]}, {monthName} {day}
              </div>
              <div className="space-y-2">
                {dayPosts.map((post) => (
                  <div
                    key={post.id}
                    className="text-sm p-2 rounded flex items-center gap-2"
                    style={{
                      borderLeft: `3px solid ${getPostAccent(post)}`,
                      background: "var(--bg-tertiary)",
                    }}
                  >
                    <span className="text-xs font-medium flex-shrink-0" style={{ color: getPostAccent(post) }}>
                      {getPlatformLabel(post.platform)}
                    </span>
                    <span className="truncate" style={{ color: "var(--text-secondary)" }}>
                      {getPostLabel(post)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {posts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No posts scheduled this month.</p>
          </div>
        )}
      </div>

      {/* Desktop calendar grid */}
      <div className="hidden md:block">
        {/* Day headers */}
        <div
          className="grid grid-cols-7 rounded-t-lg overflow-hidden"
          style={{ gap: "1px", background: "var(--border-primary)" }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="p-2 text-center text-xs font-medium"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div
          className="grid grid-cols-7 rounded-b-lg overflow-hidden"
          style={{ gap: "1px", background: "var(--border-primary)" }}
        >
          {/* Empty cells before first day */}
          {Array.from({ length: startDay }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="p-2 min-h-[100px]"
              style={{ background: "var(--bg-primary)" }}
            />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayPosts = postsByDay.get(day) ?? [];
            const isToday = day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();

            return (
              <div
                key={day}
                className="p-2 min-h-[100px]"
                style={{
                  background: "var(--bg-secondary)",
                  outline: isToday ? `2px solid var(--accent-blue)` : "none",
                  outlineOffset: "-2px",
                }}
              >
                <div
                  className="text-xs mb-1 font-medium"
                  style={{ color: isToday ? "var(--accent-blue)" : "var(--text-tertiary)" }}
                >
                  {day}
                </div>
                <div className="space-y-1">
                  {dayPosts.slice(0, 3).map((post) => (
                    <div
                      key={post.id}
                      className="text-xs p-1 rounded truncate"
                      style={{
                        borderLeft: `2px solid ${getPostAccent(post)}`,
                        background: "var(--bg-tertiary)",
                        color: "var(--text-secondary)",
                      }}
                      title={`${post.platform}${post.pageName ? ` (${post.pageName})` : ""}: ${post.content.substring(0, 100)}`}
                    >
                      {getPostLabel(post)}
                    </div>
                  ))}
                  {dayPosts.length > 3 && (
                    <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      +{dayPosts.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
