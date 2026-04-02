"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatTimeOnly, getUserTimezone } from "@/lib/timezone";
import { PostDetailPanel, type CalendarPost } from "./post-detail-panel";

interface CalendarGridProps {
  year: number;
  month: number;
  daysInMonth: number;
  startDay: number;
  monthName: string;
  postsByDay: Record<number, CalendarPost[]>;
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "var(--accent-blue)",
  PUBLISHED: "var(--accent-emerald)",
  DRAFT: "var(--text-tertiary)",
  FAILED: "var(--accent-red)",
  PENDING_APPROVAL: "var(--accent-amber)",
};

const STATUS_BG: Record<string, string> = {
  SCHEDULED: "var(--accent-blue-muted)",
  PUBLISHED: "var(--accent-emerald-muted)",
  DRAFT: "var(--bg-tertiary)",
  FAILED: "var(--accent-red-muted)",
  PENDING_APPROVAL: "var(--accent-amber-muted)",
};

const PLATFORM_LABELS: Record<string, string> = {
  FACEBOOK: "FB",
  INSTAGRAM: "IG",
  LINKEDIN: "LI",
  TWITTER_X: "X",
  TIKTOK: "TT",
  YOUTUBE: "YT",
  PINTEREST: "Pin",
  GOOGLE_ADS: "GAds",
  SNAPCHAT: "SC",
};

function PostEntry({
  post,
  onClick,
}: {
  post: CalendarPost;
  onClick: () => void;
}) {
  const tz = getUserTimezone();
  const date = post.scheduledAt ?? post.publishedAt;
  const time = date ? formatTimeOnly(date, tz) : "";
  const statusColor = STATUS_COLORS[post.status] ?? "var(--text-tertiary)";
  const statusBg = STATUS_BG[post.status] ?? "var(--bg-tertiary)";
  const platformLabel = PLATFORM_LABELS[post.platform] ?? post.platform;
  const contentPreview = post.content.substring(0, 40);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="w-full text-left text-xs p-1.5 rounded transition-all hover:ring-1"
      style={{
        borderLeft: `3px solid ${statusColor}`,
        background: statusBg,
        color: "var(--text-secondary)",
        cursor: "pointer",
        border: "none",
        borderLeftWidth: "3px",
        borderLeftStyle: "solid",
        borderLeftColor: statusColor,
      }}
      title={`${post.platform}${post.pageName ? ` (${post.pageName})` : ""}: ${post.content.substring(0, 100)}`}
    >
      <div className="flex items-center gap-1">
        {time && (
          <span
            className="font-medium flex-shrink-0"
            style={{ color: statusColor, fontSize: "10px" }}
          >
            {time}
          </span>
        )}
        <span
          className="flex-shrink-0 font-medium"
          style={{ fontSize: "9px", color: "var(--text-tertiary)" }}
        >
          {platformLabel}
        </span>
      </div>
      <div className="truncate mt-0.5" style={{ fontSize: "10px" }}>
        {contentPreview}
      </div>
    </button>
  );
}

function MobilePostEntry({
  post,
  onClick,
}: {
  post: CalendarPost;
  onClick: () => void;
}) {
  const tz = getUserTimezone();
  const date = post.scheduledAt ?? post.publishedAt;
  const time = date ? formatTimeOnly(date, tz) : "";
  const statusColor = STATUS_COLORS[post.status] ?? "var(--text-tertiary)";
  const platformLabel = PLATFORM_LABELS[post.platform] ?? post.platform;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={`View ${platformLabel} post${post.pageName ? ` on ${post.pageName}` : ""}: ${post.content.substring(0, 60)}`}
      className="w-full text-sm p-3 rounded flex items-start gap-2 transition-all hover:ring-1 text-left min-h-[44px]"
      style={{
        borderLeft: `3px solid ${statusColor}`,
        background: "var(--bg-tertiary)",
        cursor: "pointer",
        border: "none",
        borderLeftWidth: "3px",
        borderLeftStyle: "solid",
        borderLeftColor: statusColor,
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {time && (
            <span
              className="text-xs font-medium"
              style={{ color: statusColor }}
            >
              {time}
            </span>
          )}
          <span
            className="text-xs font-medium flex-shrink-0"
            style={{ color: statusColor }}
          >
            {platformLabel}
          </span>
          {post.pageName && (
            <span
              className="text-xs truncate"
              style={{ color: "var(--text-tertiary)" }}
            >
              {post.pageName}
            </span>
          )}
        </div>
        <div
          className="text-xs truncate"
          style={{ color: "var(--text-secondary)" }}
        >
          {post.content.substring(0, 80)}
        </div>
      </div>
      {/* Status dot */}
      <span
        className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
        style={{ background: statusColor }}
      />
    </button>
  );
}

export function CalendarGrid({
  year,
  month,
  daysInMonth,
  startDay,
  monthName,
  postsByDay,
}: CalendarGridProps) {
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null);
  const router = useRouter();
  const now = new Date();

  const handlePostUpdated = useCallback(() => {
    // Refresh the page data
    router.refresh();
    setSelectedPost(null);
  }, [router]);

  return (
    <>
      {/* Mobile list view */}
      <div className="md:hidden space-y-2">
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayPosts = postsByDay[day] ?? [];
          if (dayPosts.length === 0) return null;
          const isToday =
            day === now.getDate() &&
            month === now.getMonth() + 1 &&
            year === now.getFullYear();
          const dayNames = [
            "Sun",
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
          ];
          const dayOfWeek = new Date(year, month - 1, day).getDay();

          return (
            <div
              key={day}
              className="rounded-lg p-3"
              style={{
                background: "var(--bg-secondary)",
                border: isToday
                  ? "1px solid var(--accent-blue)"
                  : "1px solid var(--border-primary)",
              }}
            >
              <div
                className="text-sm font-medium mb-2"
                style={{
                  color: isToday
                    ? "var(--accent-blue)"
                    : "var(--text-primary)",
                }}
              >
                {dayNames[dayOfWeek]}, {monthName} {day}
              </div>
              <div className="space-y-2">
                {dayPosts.map((post) => (
                  <MobilePostEntry
                    key={post.id}
                    post={post}
                    onClick={() => setSelectedPost(post)}
                  />
                ))}
              </div>
            </div>
          );
        })}
        {Object.keys(postsByDay).length === 0 && (
          <div className="text-center py-8">
            <p
              className="text-sm"
              style={{ color: "var(--text-tertiary)" }}
            >
              No posts scheduled this month.
            </p>
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
              style={{
                background: "var(--bg-tertiary)",
                color: "var(--text-secondary)",
              }}
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
              className="p-2 min-h-[110px]"
              style={{ background: "var(--bg-primary)" }}
            />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayPosts = postsByDay[day] ?? [];
            const isToday =
              day === now.getDate() &&
              month === now.getMonth() + 1 &&
              year === now.getFullYear();

            return (
              <div
                key={day}
                className="p-2 min-h-[110px] cursor-pointer transition-all hover:ring-1"
                style={{
                  background: "var(--bg-secondary)",
                  outline: isToday
                    ? "2px solid var(--accent-blue)"
                    : "none",
                  outlineOffset: "-2px",
                }}
                onClick={() => {
                  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T09:00`;
                  router.push(`/ai?prefillDate=${encodeURIComponent(dateStr)}`);
                }}
                title={`Create a new post for ${monthName} ${day}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T09:00`;
                    router.push(`/ai?prefillDate=${encodeURIComponent(dateStr)}`);
                  }
                }}
              >
                <div
                  className="text-xs mb-1.5 font-medium"
                  style={{
                    color: isToday
                      ? "var(--accent-blue)"
                      : "var(--text-tertiary)",
                  }}
                >
                  {day}
                  {dayPosts.length === 0 && (
                    <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--accent-blue)", fontSize: "9px" }}>+ New</span>
                  )}
                </div>
                <div className="space-y-1">
                  {dayPosts.slice(0, 3).map((post) => (
                    <PostEntry
                      key={post.id}
                      post={post}
                      onClick={() => setSelectedPost(post)}
                    />
                  ))}
                  {dayPosts.length > 3 && (
                    <button
                      className="text-xs w-full text-left px-1 py-1"
                      style={{
                        color: "var(--accent-blue)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                      aria-label={`View ${dayPosts.length - 3} more posts`}
                      onClick={() => {
                        // Show the 4th post in detail, user can navigate from there
                        setSelectedPost(dayPosts[3]!);
                      }}
                    >
                      +{dayPosts.length - 3} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Post detail slide-out panel */}
      {selectedPost && (
        <PostDetailPanel
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onPostUpdated={handlePostUpdated}
        />
      )}
    </>
  );
}
