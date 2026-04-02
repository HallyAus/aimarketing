"use client";

import { useState } from "react";
import Link from "next/link";
import {
  formatSmartDate,
  getRelativeTime,
  getUserTimezone,
} from "@/lib/timezone";

interface PostData {
  id: string;
  campaignId: string | null;
  content: string;
  platform: string;
  pageName: string | null;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  campaignName: string | null;
}

interface DashboardTabsProps {
  recentPosts: PostData[];
  scheduledPosts: PostData[];
}

type TabKey = "overview" | "scheduled" | "recent";

function PlatformBadge({ platform }: { platform: string }) {
  const labels: Record<string, string> = {
    FACEBOOK: "Facebook",
    INSTAGRAM: "Instagram",
    LINKEDIN: "LinkedIn",
    TWITTER_X: "Twitter/X",
    TIKTOK: "TikTok",
    YOUTUBE: "YouTube",
    PINTEREST: "Pinterest",
    GOOGLE_ADS: "Google Ads",
    SNAPCHAT: "Snapchat",
  };
  return (
    <span className="badge badge-info text-[10px]">
      {labels[platform] ?? platform}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string }> = {
    SCHEDULED: {
      bg: "var(--accent-blue-muted)",
      text: "var(--accent-blue)",
    },
    PUBLISHED: {
      bg: "var(--accent-emerald-muted)",
      text: "var(--accent-emerald)",
    },
    DRAFT: { bg: "var(--bg-tertiary)", text: "var(--text-tertiary)" },
    FAILED: { bg: "var(--accent-red-muted)", text: "var(--accent-red)" },
  };
  const s = styles[status] ?? styles.DRAFT!;
  return (
    <span
      className="text-[10px] font-medium px-1.5 py-0.5 rounded"
      style={{ background: s.bg, color: s.text }}
    >
      {status}
    </span>
  );
}

function PostRow({ post }: { post: PostData }) {
  const href = post.campaignId
    ? `/campaigns/${post.campaignId}`
    : "/campaigns";

  return (
    <Link
      href={href}
      className="table-row flex items-center justify-between px-3 py-2.5 rounded-lg no-underline hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0">
        <PlatformBadge platform={post.platform} />
        {post.pageName && (
          <span
            className="text-xs flex-shrink-0"
            style={{ color: "var(--text-tertiary)" }}
          >
            &rarr; {post.pageName}
          </span>
        )}
        <span
          className="text-sm truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {post.content.substring(0, 80)}
        </span>
      </div>
      <div
        className="text-xs whitespace-nowrap ml-3"
        style={{ color: "var(--text-tertiary)" }}
      >
        {post.campaignName ?? "Draft"}
      </div>
    </Link>
  );
}

function ScheduledPostRow({ post }: { post: PostData }) {
  const href = post.campaignId
    ? `/campaigns/${post.campaignId}`
    : "/campaigns";

  return (
    <Link
      href={href}
      className="flex items-center justify-between px-3 py-3 rounded-lg no-underline hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-primary)",
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex flex-col items-center flex-shrink-0 w-16">
          <span
            className="text-xs font-medium"
            style={{ color: "var(--accent-blue)" }}
          >
            {post.scheduledAt
              ? formatSmartDate(post.scheduledAt, getUserTimezone())
              : "Unscheduled"}
          </span>
        </div>
        <div
          className="w-px h-8 flex-shrink-0"
          style={{ background: "var(--border-primary)" }}
        />
        <PlatformBadge platform={post.platform} />
        {post.pageName && (
          <span
            className="text-xs flex-shrink-0"
            style={{ color: "var(--text-tertiary)" }}
          >
            {post.pageName}
          </span>
        )}
        <span
          className="text-sm truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {post.content.substring(0, 60)}
          {post.content.length > 60 ? "..." : ""}
        </span>
      </div>
      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
        <StatusBadge status={post.status} />
        {post.scheduledAt && (
          <span
            className="text-xs whitespace-nowrap"
            style={{ color: "var(--text-tertiary)" }}
          >
            {getRelativeTime(post.scheduledAt)}
          </span>
        )}
      </div>
    </Link>
  );
}

export function DashboardTabs({
  recentPosts,
  scheduledPosts,
}: DashboardTabsProps) {
  const [tab, setTab] = useState<TabKey>("overview");

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    {
      key: "scheduled",
      label: "Scheduled",
      count: scheduledPosts.length,
    },
    { key: "recent", label: "Recent", count: recentPosts.length },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div
        className="flex items-center gap-1 mb-4 border-b"
        style={{ borderColor: "var(--border-primary)" }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2.5 text-sm font-medium transition-colors relative"
            style={{
              color:
                tab === t.key
                  ? "var(--accent-blue)"
                  : "var(--text-tertiary)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span
                className="ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                style={{
                  background:
                    tab === t.key
                      ? "var(--accent-blue-muted)"
                      : "var(--bg-tertiary)",
                  color:
                    tab === t.key
                      ? "var(--accent-blue)"
                      : "var(--text-tertiary)",
                }}
              >
                {t.count}
              </span>
            )}
            {tab === t.key && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ background: "var(--accent-blue)" }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Overview tab — both sections */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Upcoming scheduled */}
          {scheduledPosts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="section-label">Upcoming Scheduled</div>
                <button
                  onClick={() => setTab("scheduled")}
                  className="text-xs font-medium"
                  style={{
                    color: "var(--accent-blue)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  View all &rarr;
                </button>
              </div>
              <div className="space-y-2">
                {scheduledPosts.slice(0, 3).map((post) => (
                  <ScheduledPostRow key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}

          {/* Recent posts */}
          <div>
            <div className="section-label mb-3">Recent Posts</div>
            {recentPosts.length === 0 ? (
              <div
                className="text-center py-8 rounded-lg"
                style={{
                  background: "var(--bg-secondary)",
                  color: "var(--text-tertiary)",
                }}
              >
                <p className="text-sm">No published posts yet.</p>
                <p className="text-xs mt-1">
                  Create a campaign to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentPosts.slice(0, 5).map((post) => (
                  <PostRow key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scheduled tab */}
      {tab === "scheduled" && (
        <div>
          {scheduledPosts.length === 0 ? (
            <div
              className="text-center py-12 rounded-lg"
              style={{
                background: "var(--bg-secondary)",
                border: "1px dashed var(--border-primary)",
                color: "var(--text-tertiary)",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto mb-3"
                style={{ color: "var(--text-tertiary)" }}
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <p className="text-sm font-medium">
                No upcoming scheduled posts
              </p>
              <p className="text-xs mt-1">
                Schedule posts from your campaigns or use AI auto-schedule.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {scheduledPosts.map((post) => (
                <ScheduledPostRow key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent tab */}
      {tab === "recent" && (
        <div>
          {recentPosts.length === 0 ? (
            <div
              className="text-center py-12 rounded-lg"
              style={{
                background: "var(--bg-secondary)",
                border: "1px dashed var(--border-primary)",
                color: "var(--text-tertiary)",
              }}
            >
              <p className="text-sm font-medium">
                No published posts yet
              </p>
              <p className="text-xs mt-1">
                Create a campaign to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentPosts.map((post) => (
                <PostRow key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
