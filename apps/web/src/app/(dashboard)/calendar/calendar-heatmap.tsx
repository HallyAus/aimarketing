"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface HeatmapProps {
  year: number;
  month: number;
  daysInMonth: number;
  startDay: number;
  postCountByDay: Record<number, number>;
  monthName: string;
}

function getHeatmapColor(count: number): string {
  if (count === 0) return "var(--bg-tertiary)";
  if (count <= 2) return "rgba(59, 130, 246, 0.25)";
  if (count <= 5) return "rgba(59, 130, 246, 0.5)";
  return "rgba(59, 130, 246, 0.8)";
}

function getHeatmapBorder(count: number): string {
  if (count === 0) return "2px dashed var(--accent-amber)";
  return "1px solid var(--border-secondary)";
}

export function CalendarHeatmapToggle({
  year,
  month,
  daysInMonth,
  startDay,
  postCountByDay,
  monthName,
  children,
}: HeatmapProps & { children: React.ReactNode }) {
  const [view, setView] = useState<"calendar" | "heatmap">("calendar");
  const router = useRouter();

  // Compute stats
  const totalPosts = Object.values(postCountByDay).reduce((a, b) => a + b, 0);
  const daysWithPosts = Object.values(postCountByDay).filter((c) => c > 0).length;
  const avgPerDay = daysInMonth > 0 ? (totalPosts / daysInMonth).toFixed(1) : "0";
  const busiestDay = Object.entries(postCountByDay).reduce(
    (max, [day, count]) => (count > max.count ? { day: parseInt(day), count } : max),
    { day: 0, count: 0 }
  );
  const gapDays = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter(
    (d) => !postCountByDay[d] || postCountByDay[d] === 0
  );

  const now = new Date();

  return (
    <div>
      {/* View toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setView("calendar")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            view === "calendar"
              ? "bg-[var(--accent-blue-muted)] text-[var(--accent-blue)] border-[var(--accent-blue)]"
              : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:bg-[var(--bg-hover)]"
          }`}
        >
          Calendar View
        </button>
        <button
          onClick={() => setView("heatmap")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            view === "heatmap"
              ? "bg-[var(--accent-blue-muted)] text-[var(--accent-blue)] border-[var(--accent-blue)]"
              : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:bg-[var(--bg-hover)]"
          }`}
        >
          Heatmap View
        </button>
      </div>

      {view === "calendar" ? (
        <>{children}</>
      ) : (
        <div>
          {/* Monthly stats summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="metric-card">
              <p className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Total Posts</p>
              <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{totalPosts}</p>
            </div>
            <div className="metric-card">
              <p className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Avg Posts/Day</p>
              <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{avgPerDay}</p>
            </div>
            <div className="metric-card">
              <p className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Busiest Day</p>
              <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {busiestDay.day > 0 ? `${monthName} ${busiestDay.day}` : "N/A"}
              </p>
              {busiestDay.count > 0 && (
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{busiestDay.count} posts</p>
              )}
            </div>
            <div className="metric-card">
              <p className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Gap Days</p>
              <p className="text-2xl font-bold" style={{ color: gapDays.length > 5 ? "var(--accent-amber)" : "var(--text-primary)" }}>
                {gapDays.length}
              </p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>of {daysInMonth} days</p>
            </div>
          </div>

          {/* Color scale legend */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Less</span>
            <div className="flex gap-1">
              {[0, 1, 3, 6].map((count) => (
                <div
                  key={count}
                  className="w-5 h-5 rounded"
                  style={{ background: getHeatmapColor(count) }}
                  title={`${count === 0 ? "0" : count === 1 ? "1-2" : count === 3 ? "3-5" : "6+"} posts`}
                />
              ))}
            </div>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>More</span>
            <span className="text-xs ml-2" style={{ color: "var(--text-tertiary)" }}>
              <span style={{ color: "var(--accent-amber)" }}>---</span> = gap (0 posts)
            </span>
          </div>

          {/* Heatmap grid */}
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

            <div
              className="grid grid-cols-7 rounded-b-lg overflow-hidden"
              style={{ gap: "1px", background: "var(--border-primary)" }}
            >
              {/* Empty cells before first day */}
              {Array.from({ length: startDay }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="p-2 min-h-[80px]"
                  style={{ background: "var(--bg-primary)" }}
                />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const count = postCountByDay[day] ?? 0;
                const isToday = day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();

                return (
                  <div
                    key={day}
                    className="p-3 min-h-[80px] relative group"
                    style={{
                      background: getHeatmapColor(count),
                      border: count === 0 ? getHeatmapBorder(count) : undefined,
                      outline: isToday ? "2px solid var(--accent-blue)" : "none",
                      outlineOffset: "-2px",
                    }}
                    title={`${monthName} ${day}: ${count} post${count !== 1 ? "s" : ""}`}
                  >
                    <div
                      className="text-xs font-medium"
                      style={{ color: isToday ? "var(--accent-blue)" : count > 5 ? "white" : "var(--text-tertiary)" }}
                    >
                      {day}
                    </div>
                    <div
                      className="text-lg font-bold mt-1"
                      style={{ color: count > 5 ? "white" : count > 0 ? "var(--accent-blue)" : "var(--text-tertiary)" }}
                    >
                      {count}
                    </div>
                    {count === 0 && (
                      <div className="absolute top-1 right-1">
                        <svg className="w-3 h-3" style={{ color: "var(--accent-amber)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                      </div>
                    )}

                    {/* Hover tooltip */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 z-10 hidden group-hover:block pointer-events-none">
                      <div
                        className="px-2 py-1 rounded text-xs font-medium whitespace-nowrap"
                        style={{
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border-primary)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {monthName} {day}: {count} post{count !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile heatmap view */}
          <div className="md:hidden space-y-1">
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const count = postCountByDay[day] ?? 0;
                const isToday = day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();

                return (
                  <div
                    key={day}
                    className="aspect-square rounded flex flex-col items-center justify-center"
                    style={{
                      background: getHeatmapColor(count),
                      border: count === 0 ? getHeatmapBorder(count) : isToday ? "2px solid var(--accent-blue)" : "1px solid var(--border-secondary)",
                    }}
                    title={`${monthName} ${day}: ${count} posts`}
                  >
                    <span className="text-[10px]" style={{ color: count > 5 ? "white" : "var(--text-tertiary)" }}>{day}</span>
                    <span className="text-xs font-bold" style={{ color: count > 5 ? "white" : count > 0 ? "var(--accent-blue)" : "var(--text-tertiary)" }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Fill Gaps button */}
          {gapDays.length > 0 && (
            <div
              className="mt-6 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              style={{
                border: "1px solid var(--accent-amber)",
                background: "var(--accent-amber-muted)",
              }}
            >
              <div>
                <h4 className="text-sm font-medium" style={{ color: "var(--accent-amber)" }}>
                  {gapDays.length} days with no posts detected
                </h4>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  Days without posts: {gapDays.slice(0, 10).map((d) => `${monthName} ${d}`).join(", ")}
                  {gapDays.length > 10 ? ` and ${gapDays.length - 10} more` : ""}
                </p>
              </div>
              <button
                onClick={() => router.push("/ai/bulk-generate")}
                className="btn-primary text-sm flex-shrink-0"
              >
                AI Fill Gaps
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
