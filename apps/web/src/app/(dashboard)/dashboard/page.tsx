import { prisma } from "@/lib/db";
import Link from "next/link";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { PlatformBadge } from "@/components/platform-badge";
import { StatusBadge } from "@/components/status-badge";
import { getActiveAccount } from "@/lib/active-account";
import { getActivePageId, pageWhere } from "@/lib/active-page";
import { getActivePageServer } from "@/lib/get-active-page-server";
import { getUserTimezone } from "@/lib/timezone-cookie";
import { DashboardWidgets } from "./widgets";
import { DashboardTabs } from "./dashboard-tabs";
import { QuickPost } from "./quick-post";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

/* ── Helpers ─────────────────────────────────────────────── */

function relativeTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const absDiffMs = Math.abs(diffMs);
  const isPast = diffMs < 0;

  const minutes = Math.floor(absDiffMs / 60000);
  const hours = Math.floor(absDiffMs / 3600000);
  const days = Math.floor(absDiffMs / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return isPast ? `${minutes}m ago` : `in ${minutes}m`;
  if (hours < 24) return isPast ? `${hours}h ago` : `in ${hours}h`;
  if (days < 7) return isPast ? `${days}d ago` : `in ${days}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(date: Date, tz: string): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz,
  });
}

function isTodayInTz(date: Date, tz: string): boolean {
  const nowStr = new Date().toLocaleDateString("en-CA", { timeZone: tz });
  const dateStr = date.toLocaleDateString("en-CA", { timeZone: tz });
  return nowStr === dateStr;
}

function isTomorrowInTz(date: Date, tz: string): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toLocaleDateString("en-CA", { timeZone: tz });
  const dateStr = date.toLocaleDateString("en-CA", { timeZone: tz });
  return tomorrowStr === dateStr;
}

function formatScheduleLabel(date: Date, tz: string): string {
  if (isTodayInTz(date, tz)) return `Today ${formatTime(date, tz)}`;
  if (isTomorrowInTz(date, tz)) return `Tomorrow ${formatTime(date, tz)}`;
  const dayPart = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: tz });
  return `${dayPart} ${formatTime(date, tz)}`;
}

/** Compute start of "today" in user's timezone as a UTC Date */
function getTodayStartInTz(tz: string): Date {
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: tz }); // "2026-04-03"
  const midnightUTC = new Date(todayStr + "T00:00:00Z");
  const sample = new Date();
  const utcStr = sample.toLocaleString("en-US", { timeZone: "UTC" });
  const tzStr = sample.toLocaleString("en-US", { timeZone: tz });
  const utcMs = new Date(utcStr).getTime();
  const tzMs = new Date(tzStr).getTime();
  const offsetMs = tzMs - utcMs;
  return new Date(midnightUTC.getTime() - offsetMs);
}

/* ── SVG Icons ───────────────────────────────────────────── */

function RocketIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09zM12 15l-3-3M22 2l-7.5 10.5M9.344 11.652l-3.249 3.249a.5.5 0 00-.105.552l1.06 2.651 5.25-5.252M12.348 14.656l3.249-3.249a.5.5 0 00.105-.552l-1.06-2.651-5.25 5.252" />
    </svg>
  );
}
function PlusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function SparklesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function LayersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  );
}
function CheckCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
    </svg>
  );
}
function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}

/* ── Platform config for overview cards ──────────────────── */

const PLATFORM_META: Record<string, { label: string; color: string }> = {
  FACEBOOK: { label: "Facebook", color: "#1877F2" },
  INSTAGRAM: { label: "Instagram", color: "#E4405F" },
  LINKEDIN: { label: "LinkedIn", color: "#0A66C2" },
  TWITTER_X: { label: "Twitter / X", color: "#1DA1F2" },
  TIKTOK: { label: "TikTok", color: "#00F2EA" },
  YOUTUBE: { label: "YouTube", color: "#FF0000" },
  GOOGLE_ADS: { label: "Google Ads", color: "#4285F4" },
  PINTEREST: { label: "Pinterest", color: "#BD081C" },
  SNAPCHAT: { label: "Snapchat", color: "#FFFC00" },
};

const CORE_PLATFORMS = [
  { key: "FACEBOOK", label: "Facebook", color: "blue" },
  { key: "INSTAGRAM", label: "Instagram", color: "purple" },
  { key: "LINKEDIN", label: "LinkedIn", color: "blue" },
  { key: "TWITTER_X", label: "Twitter / X", color: "neutral" },
] as const;

/* ── Page Component ──────────────────────────────────────── */

interface DashboardSearchParams {
  page?: string;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  const resolvedParams = await searchParams;

  // Legacy: still support getActiveAccount for backwards compat
  const activeAccount = await getActiveAccount();

  const org = await prisma.organization.findFirst({
    where: { deletedAt: null },
    include: {
      _count: {
        select: {
          platformConnections: true,
          campaigns: true,
          memberships: true,
        },
      },
    },
  });

  if (!org) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={<RocketIcon />}
          title="Welcome to AdPilot"
          description="Create your first organization to get started."
          action={<Link href="/onboarding" className="btn-primary">Get Started</Link>}
        />
      </div>
    );
  }

  // ── Resolve active page (page-scoped architecture) ────
  // Try the new getActivePageServer first; fall back to legacy if no pages exist
  let activePageId: string | null = null;
  let activePageInfo: {
    id: string;
    platform: string;
    name: string;
    avatarUrl: string | null;
    isActive: boolean;
    followerCount: number;
  } | null = null;

  // Check if org has any pages at all
  const pageCount = await prisma.page.count({ where: { orgId: org.id, isActive: true } });

  if (pageCount > 0) {
    try {
      const result = await getActivePageServer(resolvedParams);
      activePageId = result.pageId;
      activePageInfo = result.page;
    } catch {
      // getActivePageServer redirects to /select-page if no page found
      // If we catch here, fallback to legacy behavior
      const legacyPageId = await getActivePageId(org.id);
      activePageId = legacyPageId;
    }
  } else {
    // No pages — use legacy orgId scoping
    activePageId = await getActivePageId(org.id);
  }

  // Build page filter for queries
  const pf = activePageId ? { pageId: activePageId } : {};

  const userTz = await getUserTimezone();
  const now = new Date();
  const todayStart = getTodayStartInTz(userTz);
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  /* Parallel data fetching — single Promise.all for max speed */
  const [
    totalPosts,
    scheduledCount,
    publishedToday,
    publishedYesterday,
    draftCount,
    failedCount,
    upcomingPosts,
    platformConnections,
    pages,
    recentLogs,
    nextScheduledPost,
    scheduledPosts7d,
    recentPublishedPosts,
  ] = await Promise.all([
    prisma.post.count({
      where: { orgId: org.id, ...pf },
    }),
    prisma.post.count({
      where: { orgId: org.id, status: "SCHEDULED", ...pf },
    }),
    prisma.post.count({
      where: { orgId: org.id, status: "PUBLISHED", publishedAt: { gte: todayStart }, ...pf },
    }),
    prisma.post.count({
      where: { orgId: org.id, status: "PUBLISHED", publishedAt: { gte: yesterdayStart, lt: todayStart }, ...pf },
    }),
    prisma.post.count({
      where: { orgId: org.id, status: "DRAFT", ...pf },
    }),
    prisma.post.count({
      where: { orgId: org.id, status: "FAILED", ...pf },
    }),
    prisma.post.findMany({
      where: {
        orgId: org.id,
        status: "SCHEDULED",
        scheduledAt: { gte: now, lte: in48h },
        ...pf,
      },
      include: { campaign: { select: { id: true, name: true } } },
      orderBy: { scheduledAt: "asc" },
      take: 10,
    }),
    prisma.platformConnection.findMany({
      where: { orgId: org.id },
      select: { id: true, platform: true, status: true, platformAccountName: true },
    }),
    prisma.page.findMany({
      where: { orgId: org.id, isActive: true },
      select: {
        id: true,
        platform: true,
        name: true,
        connectionId: true,
        _count: { select: { posts: true } },
      },
    }),
    prisma.auditLog.findMany({
      where: { orgId: org.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, action: true, entityType: true, createdAt: true },
    }),
    prisma.post.findFirst({
      where: { orgId: org.id, status: "SCHEDULED", scheduledAt: { gte: now }, ...pf },
      orderBy: { scheduledAt: "asc" },
      select: { scheduledAt: true },
    }),
    // Scheduled posts for next 7 days (for tabs section)
    prisma.post.findMany({
      where: {
        orgId: org.id,
        status: "SCHEDULED",
        scheduledAt: { gte: now, lte: in7d },
        ...pf,
      },
      include: { campaign: { select: { name: true } } },
      orderBy: { scheduledAt: "asc" },
      take: 20,
    }),
    // Recent published posts (for tabs section)
    prisma.post.findMany({
      where: { orgId: org.id, status: "PUBLISHED", ...pf },
      include: { campaign: { select: { name: true } } },
      orderBy: { publishedAt: "desc" },
      take: 10,
    }),
  ]);

  /* Derived data */
  const publishedTrend = publishedYesterday > 0
    ? { value: Math.round(((publishedToday - publishedYesterday) / publishedYesterday) * 100), direction: (publishedToday >= publishedYesterday ? "up" : "down") as "up" | "down" }
    : undefined;

  // Platform Overview: when page is active, show only that page's platform
  const activePlatformFilter = activePageInfo?.platform ?? null;

  const platformMap = new Map<string, { connections: typeof platformConnections; pages: typeof pages; postCount: number }>();
  for (const conn of platformConnections) {
    // If we have an active page, only show its platform in overview
    if (activePlatformFilter && conn.platform !== activePlatformFilter) continue;
    if (!platformMap.has(conn.platform)) {
      platformMap.set(conn.platform, { connections: [], pages: [], postCount: 0 });
    }
    platformMap.get(conn.platform)!.connections.push(conn);
  }
  for (const page of pages) {
    if (activePlatformFilter && page.platform !== activePlatformFilter) continue;
    const entry = platformMap.get(page.platform);
    if (entry) {
      entry.pages.push(page);
      entry.postCount += page._count.posts;
    }
  }
  // For connected platforms with no pages, count posts by platform directly
  for (const [platform, entry] of platformMap) {
    if (entry.pages.length === 0 && entry.connections.length > 0) {
      const count = await prisma.post.count({
        where: { orgId: org.id, platform: platform as never },
      });
      entry.postCount = count;
    }
  }

  const connectedPlatformCount = platformMap.size;

  // Determine which platforms to show in overview
  const overviewPlatforms = activePlatformFilter
    ? CORE_PLATFORMS.filter((p) => p.key === activePlatformFilter)
    : CORE_PLATFORMS;

  return (
    <div>
      <PageHeader
        title={org.name}
        subtitle={activePageInfo
          ? `Overview for ${activePageInfo.name} — ${PLATFORM_META[activePageInfo.platform]?.label ?? activePageInfo.platform}`
          : activeAccount
            ? `Overview of your marketing activity, upcoming posts, and platform status — ${activeAccount.name}`
            : "Overview of your marketing activity, upcoming posts, and platform status"
        }
        action={<span className="badge badge-info">{org.plan}</span>}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }]}
      />

      {/* Page summary header — shown when a specific page is active */}
      {activePageInfo && (
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg mb-4"
          style={{
            background: `${PLATFORM_META[activePageInfo.platform]?.color ?? "#888"}10`,
            border: `1px solid ${PLATFORM_META[activePageInfo.platform]?.color ?? "#888"}30`,
          }}
        >
          {/* Platform dot */}
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: PLATFORM_META[activePageInfo.platform]?.color ?? "#888" }}
          />

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
              {activePageInfo.name}
            </span>
            <PlatformBadge platform={activePageInfo.platform} size="sm" />
          </div>

          {/* Connection status */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: activePageInfo.isActive
                  ? "var(--accent-emerald, #22c55e)"
                  : "var(--accent-red, #ef4444)",
              }}
            />
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {activePageInfo.isActive ? "Connected" : "Disconnected"}
            </span>
          </div>

          {activePageInfo.followerCount > 0 && (
            <span className="text-xs flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>
              {activePageInfo.followerCount.toLocaleString()} followers
            </span>
          )}
        </div>
      )}

      {/* Welcome banner for new users with zero posts and zero connections */}
      {totalPosts === 0 && platformConnections.length === 0 && (
        <div
          className="rounded-xl p-5 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          style={{
            background: "var(--accent-blue-muted)",
            border: "1px solid var(--accent-blue)",
          }}
        >
          <div>
            <h2 className="text-base font-bold mb-1" style={{ color: "var(--text-primary)" }}>
              Welcome to AdPilot! Let&apos;s set up your account.
            </h2>
            <p className="text-sm m-0" style={{ color: "var(--text-secondary)" }}>
              Connect your social accounts and create your first campaign in minutes.
            </p>
          </div>
          <Link href="/onboarding" className="btn-primary text-sm flex-shrink-0">
            Get Started &rarr;
          </Link>
        </div>
      )}

      {/* Real-time polling widget bar */}
      <DashboardWidgets />

      {/* Quick Post — generate and publish in one click */}
      <div className="mb-4">
        <QuickPost />
      </div>

      {/* ── TOP: 5 Metric Cards ───────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-4">
        <Link href="/campaigns" className="no-underline">
          <MetricCard
            label="Total Posts"
            value={totalPosts}
            accent="var(--accent-blue)"
            icon={<FileIcon />}
          />
        </Link>
        <Link href="/campaigns?status=SCHEDULED" className="no-underline">
          <MetricCard
            label="Scheduled"
            value={scheduledCount}
            accent="var(--accent-amber)"
            icon={<ClockIcon />}
          />
        </Link>
        <Link href="/campaigns?status=PUBLISHED" className="no-underline">
          <MetricCard
            label="Published Today"
            value={publishedToday}
            accent="var(--accent-emerald)"
            trend={publishedTrend}
            icon={<CheckCircleIcon />}
          />
        </Link>
        <Link href="/campaigns?status=DRAFT" className="no-underline">
          <MetricCard
            label="Drafts"
            value={draftCount}
            accent="var(--text-secondary)"
            icon={<EditIcon />}
          />
        </Link>
        <div className={failedCount > 0 ? "ring-1 ring-[var(--accent-red)] rounded-xl" : ""}>
          <Link href="/campaigns?status=FAILED" className="no-underline">
            <MetricCard
              label="Failed"
              value={failedCount}
              accent={failedCount > 0 ? "var(--accent-red)" : "var(--text-tertiary)"}
              icon={<AlertIcon />}
            />
          </Link>
        </div>
      </div>

      {/* ── MIDDLE: 2-column layout ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">

        {/* Left (2fr): Upcoming Posts */}
        <div className="lg:col-span-2">
          <div className="card p-0 overflow-hidden h-full">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-secondary)]">
              <div className="section-label" style={{ margin: 0 }}>Upcoming Posts (next 48h)</div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "var(--accent-amber-muted)", color: "var(--accent-amber)" }}>
                {upcomingPosts.length} queued
              </span>
            </div>

            {upcomingPosts.length === 0 ? (
              <div className="px-4 py-8">
                <EmptyState
                  title="No scheduled posts"
                  description="Generate content with AI or create a campaign to fill your queue."
                  action={
                    <div className="flex gap-2">
                      <Link href="/ai" className="btn-primary text-sm">Generate with AI</Link>
                      <Link href="/campaigns/new" className="btn-ghost text-sm">New Campaign</Link>
                    </div>
                  }
                />
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-secondary)]">
                {upcomingPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={post.campaign ? `/campaigns/${post.campaign.id}` : "/campaigns"}
                    className="flex items-start gap-3 px-4 py-2.5 no-underline hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <div className="flex-shrink-0 w-[5.5rem] sm:w-[7rem] text-right">
                      <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                        {post.scheduledAt ? formatScheduleLabel(post.scheduledAt, userTz) : "--"}
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: "var(--accent-amber)" }}>
                        {post.scheduledAt ? relativeTime(post.scheduledAt) : ""}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {post.pageName && (
                          <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                            {post.pageName}
                          </span>
                        )}
                        <PlatformBadge platform={post.platform} size="sm" />
                      </div>
                      <div className="text-sm truncate" style={{ color: "var(--text-primary)" }}>
                        {post.content.substring(0, 100)}
                      </div>
                      {post.campaign && (
                        <div className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                          {post.campaign.name}
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      <StatusBadge status={post.status} size="sm" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right (1fr): Stacked panels */}
        <div className="flex flex-col gap-3">

          {/* Quick Actions */}
          <div className="card p-3">
            <div className="section-label mb-2">Quick Actions</div>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/campaigns/new" className="btn-ghost text-xs flex items-center justify-center gap-1.5 py-2 no-underline">
                <PlusIcon size={14} /> New Post
              </Link>
              <Link href="/ai" className="btn-ghost text-xs flex items-center justify-center gap-1.5 py-2 no-underline">
                <SparklesIcon /> AI Generate
              </Link>
              <Link href="/calendar" className="btn-ghost text-xs flex items-center justify-center gap-1.5 py-2 no-underline">
                <CalendarIcon /> Calendar
              </Link>
              <Link href="/ai?mode=bulk" className="btn-ghost text-xs flex items-center justify-center gap-1.5 py-2 no-underline">
                <LayersIcon /> Bulk Generate
              </Link>
            </div>
          </div>

          {/* Publishing Status */}
          <div className="card p-3">
            <div className="section-label mb-2">Publishing Status</div>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: org.publishingPaused ? "var(--accent-amber)" : "var(--accent-emerald)",
                  boxShadow: org.publishingPaused ? "none" : "0 0 6px var(--accent-emerald)",
                }}
              />
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {org.publishingPaused ? "Publishing Paused" : "Publishing Active"}
              </span>
            </div>
            <div className="space-y-1.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
              <div className="flex items-center gap-1.5">
                <LinkIcon />
                {connectedPlatformCount} platform{connectedPlatformCount !== 1 ? "s" : ""} connected
              </div>
              <div className="flex items-center gap-1.5">
                <ClockIcon />
                {nextScheduledPost?.scheduledAt
                  ? `Next post ${relativeTime(nextScheduledPost.scheduledAt)}`
                  : "No posts scheduled"
                }
              </div>
              <div className="flex items-center gap-1.5">
                <FileIcon />
                {scheduledCount} post{scheduledCount !== 1 ? "s" : ""} in queue
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card p-3 flex-1">
            <div className="section-label mb-2">Recent Activity</div>
            {recentLogs.length === 0 ? (
              <div className="text-xs py-2" style={{ color: "var(--text-tertiary)" }}>
                No recent activity
              </div>
            ) : (
              <div className="space-y-2">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2">
                    <div
                      className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: "var(--text-tertiary)" }}
                    />
                    <div className="min-w-0">
                      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        {log.action.replace(/_/g, " ").toLowerCase()}{" "}
                        <span style={{ color: "var(--text-tertiary)" }}>
                          {log.entityType.toLowerCase()}
                        </span>
                      </span>
                      <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                        {relativeTime(log.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabbed Content: Overview | Scheduled | Recent ── */}
      <div className="mb-4">
        <DashboardTabs
          recentPosts={recentPublishedPosts.map((post) => ({
            id: post.id,
            campaignId: post.campaignId,
            content: post.content,
            platform: post.platform,
            pageName: post.pageName,
            status: post.status,
            scheduledAt: post.scheduledAt?.toISOString() ?? null,
            publishedAt: post.publishedAt?.toISOString() ?? null,
            campaignName: post.campaign?.name ?? null,
          }))}
          scheduledPosts={scheduledPosts7d.map((post) => ({
            id: post.id,
            campaignId: post.campaignId,
            content: post.content,
            platform: post.platform,
            pageName: post.pageName,
            status: post.status,
            scheduledAt: post.scheduledAt?.toISOString() ?? null,
            publishedAt: post.publishedAt?.toISOString() ?? null,
            campaignName: post.campaign?.name ?? null,
          }))}
        />
      </div>

      {/* ── BOTTOM: Platform Overview ─────────────────── */}
      <div className="card p-3">
        <div className="section-label mb-3">
          {activePageInfo
            ? `${PLATFORM_META[activePageInfo.platform]?.label ?? activePageInfo.platform} Overview`
            : "Platform Overview"
          }
        </div>
        <div className={`grid gap-3 ${overviewPlatforms.length === 1 ? "grid-cols-1 max-w-xs" : "grid-cols-2 md:grid-cols-4"}`}>
          {overviewPlatforms.map(({ key, label }) => {
            const data = platformMap.get(key);
            const isConnected = !!data && data.connections.length > 0;
            const hasExpired = data?.connections.some((c) => c.status === "EXPIRED");
            const pageCountForPlatform = data?.pages.length ?? 0;
            const postCount = data?.postCount ?? 0;

            return (
              <div
                key={key}
                className="rounded-lg p-3 border"
                style={{
                  borderColor: isConnected ? "var(--border-primary)" : "var(--border-secondary)",
                  background: isConnected ? "var(--bg-primary)" : "var(--bg-secondary)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <PlatformBadge platform={key} size="md" />
                  {isConnected && !hasExpired && (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent-emerald)" }} />
                  )}
                  {hasExpired && (
                    <span className="text-[10px] font-medium" style={{ color: "var(--accent-red)" }}>Expired</span>
                  )}
                </div>

                {isConnected ? (
                  <div className="space-y-0.5">
                    <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {pageCountForPlatform > 0 ? `${pageCountForPlatform} page${pageCountForPlatform !== 1 ? "s" : ""}` : `${data?.connections.length ?? 0} account${(data?.connections.length ?? 0) !== 1 ? "s" : ""}`}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {postCount} post{postCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                ) : (
                  <Link
                    href="/settings/connections"
                    className="text-xs font-medium no-underline"
                    style={{ color: "var(--accent-blue)" }}
                  >
                    Connect &rarr;
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
