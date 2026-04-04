import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demo Dashboard — ReachPilot",
  robots: { index: true },
};

const CAMPAIGNS = [
  {
    name: "Q1 Brand Awareness Push",
    status: "ACTIVE",
    statusClass: "badge-success",
    platforms: "Facebook + Instagram",
    posts: 234,
  },
  {
    name: "Product Launch — MediSync Pro",
    status: "ACTIVE",
    statusClass: "badge-success",
    platforms: "All platforms",
    posts: 156,
  },
  {
    name: "Retargeting — Cart Abandoners",
    status: "COMPLETED",
    statusClass: "badge-purple",
    platforms: "Google Ads + Meta",
    posts: 89,
  },
  {
    name: "Thought Leadership Series",
    status: "ACTIVE",
    statusClass: "badge-success",
    platforms: "LinkedIn + Twitter",
    posts: 67,
  },
  {
    name: "Holiday Season Campaign",
    status: "DRAFT",
    statusClass: "badge-neutral",
    platforms: "TikTok + Instagram",
    posts: 0,
  },
];

export default function DemoDashboardPage() {
  return (
    <div>
      <PageHeader
        title="Meridian Health"
        subtitle="Organization overview"
        action={<span className="badge badge-info">PRO</span>}
      />

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <MetricCard label="Total Campaigns" value={12} accent="var(--accent-blue)" />
        <MetricCard label="Active Posts" value="847" accent="var(--accent-emerald)" />
        <MetricCard label="Avg. Engagement" value="4.8%" accent="var(--accent-amber)" />
        <MetricCard label="Revenue Impact" value="$2.4M" accent="var(--accent-purple)" />
      </div>

      {/* Quick actions — greyed out */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        {[
          {
            icon: "+",
            iconBg: "var(--accent-blue-muted)",
            iconColor: "var(--accent-blue)",
            label: "New Campaign",
            desc: "Create and schedule posts",
          },
          {
            icon: "AI",
            iconBg: "var(--accent-purple-muted)",
            iconColor: "var(--accent-purple)",
            label: "AI Studio",
            desc: "Generate content with AI",
          },
          {
            icon: "\u26A1",
            iconBg: "var(--accent-emerald-muted)",
            iconColor: "var(--accent-emerald)",
            label: "Connect Platforms",
            desc: "Link social accounts",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="card flex items-center gap-3 relative group"
            style={{ opacity: 0.5, cursor: "not-allowed" }}
            title="Available in full version"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-sm"
              style={{ background: item.iconBg, color: item.iconColor }}
            >
              {item.icon}
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {item.label}
              </div>
              <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {item.desc}
              </div>
            </div>
            {/* Tooltip */}
            <div
              className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-primary)",
              }}
            >
              Available in full version
            </div>
          </div>
        ))}
      </div>

      {/* Recent campaigns */}
      <div>
        <div className="section-label mb-3">Recent Campaigns</div>
        <div className="space-y-1">
          {CAMPAIGNS.map((c) => (
            <div
              key={c.name}
              className="table-row flex items-center justify-between px-3 py-2.5 rounded-lg"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`badge ${c.statusClass} text-[10px]`}>{c.status}</span>
                <span
                  className="text-sm truncate font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {c.name}
                </span>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0 ml-3">
                <span className="text-xs hidden sm:inline" style={{ color: "var(--text-tertiary)" }}>
                  {c.platforms}
                </span>
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  {c.posts} posts
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
