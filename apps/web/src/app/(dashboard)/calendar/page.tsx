import { getSessionOrg } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@adpilot/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Content Calendar",
  robots: { index: false },
};

const PLATFORM_ACCENT: Record<string, string> = {
  FACEBOOK: "var(--accent-blue)",
  INSTAGRAM: "#e1306c",
  TIKTOK: "var(--text-primary)",
  LINKEDIN: "#0077b5",
  TWITTER_X: "var(--text-secondary)",
  YOUTUBE: "var(--accent-red)",
  GOOGLE_ADS: "var(--accent-emerald)",
  PINTEREST: "#e60023",
  SNAPCHAT: "var(--accent-amber)",
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

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  const startDay = startOfMonth.getDay(); // 0=Sunday
  const daysInMonth = endOfMonth.getDate();

  // Get posts for this month
  const posts = await prisma.post.findMany({
    where: {
      orgId: await getSessionOrg(),
      status: { notIn: ["DELETED"] },
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

  const monthName = startOfMonth.toLocaleString("default", { month: "long" });
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Content Calendar</h1>
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
                      borderLeft: `3px solid ${PLATFORM_ACCENT[post.platform] ?? "var(--border-primary)"}`,
                      background: "var(--bg-tertiary)",
                    }}
                  >
                    <span className="text-xs font-medium flex-shrink-0" style={{ color: PLATFORM_ACCENT[post.platform] ?? "var(--text-secondary)" }}>
                      {post.platform.replaceAll("_", " ")}
                    </span>
                    <span className="truncate" style={{ color: "var(--text-secondary)" }}>
                      {post.campaign.name}
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
                        borderLeft: `2px solid ${PLATFORM_ACCENT[post.platform] ?? "var(--border-primary)"}`,
                        background: "var(--bg-tertiary)",
                        color: "var(--text-secondary)",
                      }}
                      title={`${post.platform}: ${post.content.substring(0, 100)}`}
                    >
                      {post.campaign.name}
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
