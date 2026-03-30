import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demo Analytics — AdPilot",
  robots: { index: true },
};

const PLATFORM_DATA = [
  {
    platform: "Facebook",
    impressions: "892K",
    clicks: "34.2K",
    ctr: "3.83%",
    spend: "$8,420",
    conversions: 1247,
  },
  {
    platform: "Instagram",
    impressions: "724K",
    clicks: "28.1K",
    ctr: "3.88%",
    spend: "$7,120",
    conversions: 982,
  },
  {
    platform: "LinkedIn",
    impressions: "341K",
    clicks: "12.8K",
    ctr: "3.75%",
    spend: "$4,890",
    conversions: 634,
  },
  {
    platform: "Twitter",
    impressions: "298K",
    clicks: "9.4K",
    ctr: "3.15%",
    spend: "$2,870",
    conversions: 389,
  },
  {
    platform: "TikTok",
    impressions: "145K",
    clicks: "4.5K",
    ctr: "3.10%",
    spend: "$1,500",
    conversions: 169,
  },
];

const TOP_POSTS = [
  {
    content:
      "Introducing MediSync Pro: The future of connected health monitoring is here. Join 10,000+ healthcare providers who trust Meridian...",
    platform: "LinkedIn",
    engagement: "12,847",
    impressions: "89.2K",
  },
  {
    content:
      "5 ways telemedicine is transforming patient care in rural communities. Our latest research shows a 340% increase in...",
    platform: "Facebook",
    engagement: "8,923",
    impressions: "67.4K",
  },
  {
    content:
      "Behind the scenes at Meridian Health R&D. Watch our team test the next generation of wearable health sensors...",
    platform: "Instagram",
    engagement: "7,456",
    impressions: "54.1K",
  },
  {
    content:
      "Dr. Sarah Chen on why preventive healthcare is the single most important investment any organization can make for its workforce...",
    platform: "Twitter",
    engagement: "5,234",
    impressions: "41.8K",
  },
  {
    content:
      "POV: You just synced all your health data in one tap. MediSync Pro makes it effortless. Link in bio for early access...",
    platform: "TikTok",
    engagement: "4,891",
    impressions: "38.6K",
  },
];

export default function DemoAnalyticsPage() {
  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Post performance overview"
        action={
          <button
            className="btn-secondary relative group"
            style={{ opacity: 0.5, cursor: "not-allowed" }}
            disabled
          >
            Export CSV
            <span
              className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-primary)",
              }}
            >
              Available in full version
            </span>
          </button>
        }
      />

      {/* Overview metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <MetricCard label="Impressions" value="2.4M" accent="var(--accent-blue)" />
        <MetricCard label="Clicks" value="89K" accent="var(--accent-emerald)" />
        <MetricCard label="Conversions" value="3,421" accent="var(--accent-purple)" />
        <MetricCard label="Total Spend" value="$24.8K" accent="var(--accent-amber)" />
      </div>

      {/* Platform Breakdown */}
      <div className="section-label mb-3">Platform Breakdown</div>
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              {["Platform", "Impressions", "Clicks", "CTR", "Spend", "Conversions"].map(
                (h) => (
                  <th
                    key={h}
                    className={`px-3 py-2 ${h === "Platform" ? "text-left" : "text-right"}`}
                    style={{
                      color: "var(--text-secondary)",
                      borderBottom: "1px solid var(--border-secondary)",
                    }}
                  >
                    <span className="section-label">{h}</span>
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {PLATFORM_DATA.map((row) => (
              <tr key={row.platform} className="table-row">
                <td className="px-3 py-2.5" style={{ color: "var(--text-primary)" }}>
                  {row.platform}
                </td>
                <td
                  className="px-3 py-2.5 text-right font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {row.impressions}
                </td>
                <td
                  className="px-3 py-2.5 text-right font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {row.clicks}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className="badge badge-success">{row.ctr}</span>
                </td>
                <td
                  className="px-3 py-2.5 text-right font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {row.spend}
                </td>
                <td
                  className="px-3 py-2.5 text-right font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {row.conversions.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top Performing Posts */}
      <div className="section-label mb-3">Top Performing Posts</div>
      <div className="space-y-2">
        {TOP_POSTS.map((post, i) => (
          <div
            key={i}
            className="table-row flex flex-col sm:flex-row sm:items-center justify-between px-3 py-3 rounded-lg gap-2"
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <span className="badge badge-info text-[10px] flex-shrink-0 mt-0.5">
                {post.platform}
              </span>
              <span
                className="text-sm truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {post.content}
              </span>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0 ml-3">
              <div className="text-right">
                <div
                  className="text-xs font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {post.engagement}
                </div>
                <div className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                  engagements
                </div>
              </div>
              <div className="text-right">
                <div
                  className="text-xs font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {post.impressions}
                </div>
                <div className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                  impressions
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
