import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@adpilot/db";

const PLATFORM_COLORS: Record<string, string> = {
  FACEBOOK: "border-l-blue-600",
  INSTAGRAM: "border-l-pink-500",
  TIKTOK: "border-l-gray-900",
  LINKEDIN: "border-l-blue-700",
  TWITTER_X: "border-l-gray-800",
  YOUTUBE: "border-l-red-600",
  GOOGLE_ADS: "border-l-green-600",
  PINTEREST: "border-l-red-500",
  SNAPCHAT: "border-l-yellow-400",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.currentOrgId) redirect("/org-picker");

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
      orgId: session.user.currentOrgId,
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Content Calendar</h1>
        <div className="flex items-center gap-4">
          <a href={`/calendar?month=${prevMonth}&year=${prevYear}`} className="text-sm text-gray-500 hover:text-gray-800">&larr; Prev</a>
          <span className="font-medium">{monthName} {year}</span>
          <a href={`/calendar?month=${nextMonth}&year=${nextYear}`} className="text-sm text-gray-500 hover:text-gray-800">Next &rarr;</a>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-t-lg overflow-hidden">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="bg-gray-50 p-2 text-center text-xs font-medium text-gray-500">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-b-lg overflow-hidden">
        {/* Empty cells before first day */}
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-white p-2 min-h-[100px]" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayPosts = postsByDay.get(day) ?? [];
          const isToday = day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();

          return (
            <div key={day} className={`bg-white p-2 min-h-[100px] ${isToday ? "ring-2 ring-blue-500 ring-inset" : ""}`}>
              <div className={`text-xs mb-1 ${isToday ? "font-bold text-blue-600" : "text-gray-400"}`}>{day}</div>
              <div className="space-y-1">
                {dayPosts.slice(0, 3).map((post) => (
                  <div
                    key={post.id}
                    className={`text-xs p-1 rounded border-l-2 bg-gray-50 truncate ${PLATFORM_COLORS[post.platform] ?? "border-l-gray-300"}`}
                    title={`${post.platform}: ${post.content.substring(0, 100)}`}
                  >
                    {post.campaign.name}
                  </div>
                ))}
                {dayPosts.length > 3 && (
                  <div className="text-xs text-gray-400">+{dayPosts.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
