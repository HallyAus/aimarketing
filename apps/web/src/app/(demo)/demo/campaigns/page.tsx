import { PageHeader } from "@/components/page-header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demo Campaigns — AdPilot",
  robots: { index: true },
};

const CAMPAIGNS = [
  {
    id: 1,
    name: "Q1 Brand Awareness Push",
    objective: "Brand Awareness",
    status: "ACTIVE",
    statusClass: "badge-success",
    platforms: ["Facebook", "Instagram"],
    posts: 234,
    startDate: "Jan 15, 2026",
    endDate: "Mar 31, 2026",
    creator: "Sarah Chen",
  },
  {
    id: 2,
    name: "Product Launch — MediSync Pro",
    objective: "Conversions",
    status: "ACTIVE",
    statusClass: "badge-success",
    platforms: ["Facebook", "Instagram", "LinkedIn", "Twitter", "TikTok"],
    posts: 156,
    startDate: "Feb 1, 2026",
    endDate: "Apr 15, 2026",
    creator: "James Rivera",
  },
  {
    id: 3,
    name: "Retargeting — Cart Abandoners",
    objective: "Conversions",
    status: "COMPLETED",
    statusClass: "badge-purple",
    platforms: ["Google Ads", "Facebook", "Instagram"],
    posts: 89,
    startDate: "Nov 1, 2025",
    endDate: "Jan 31, 2026",
    creator: "Sarah Chen",
  },
  {
    id: 4,
    name: "Thought Leadership Series",
    objective: "Engagement",
    status: "ACTIVE",
    statusClass: "badge-success",
    platforms: ["LinkedIn", "Twitter"],
    posts: 67,
    startDate: "Mar 1, 2026",
    endDate: "Jun 30, 2026",
    creator: "Dr. Emily Tran",
  },
  {
    id: 5,
    name: "Holiday Season Campaign",
    objective: "Traffic",
    status: "DRAFT",
    statusClass: "badge-neutral",
    platforms: ["TikTok", "Instagram"],
    posts: 0,
    startDate: "Nov 15, 2026",
    endDate: "Dec 31, 2026",
    creator: "James Rivera",
  },
  {
    id: 6,
    name: "Patient Testimonials",
    objective: "Trust & Social Proof",
    status: "ACTIVE",
    statusClass: "badge-success",
    platforms: ["Instagram", "YouTube"],
    posts: 42,
    startDate: "Feb 15, 2026",
    endDate: "May 15, 2026",
    creator: "Aisha Patel",
  },
  {
    id: 7,
    name: "Wellness Blog Syndication",
    objective: "Traffic",
    status: "PAUSED",
    statusClass: "badge-warning",
    platforms: ["Facebook", "LinkedIn", "Pinterest"],
    posts: 118,
    startDate: "Oct 1, 2025",
    endDate: "Ongoing",
    creator: "Sarah Chen",
  },
  {
    id: 8,
    name: "Summer Health Tips",
    objective: "Engagement",
    status: "DRAFT",
    statusClass: "badge-neutral",
    platforms: ["TikTok", "Instagram", "Facebook"],
    posts: 0,
    startDate: "Jun 1, 2026",
    endDate: "Aug 31, 2026",
    creator: "Dr. Emily Tran",
  },
];

export default function DemoCampaignsPage() {
  return (
    <div>
      <PageHeader
        title="Campaigns"
        action={
          <button
            className="btn-primary text-sm"
            style={{ opacity: 0.5, cursor: "not-allowed" }}
            title="Available in full version"
            disabled
          >
            New Campaign
          </button>
        }
      />

      <div className="space-y-3">
        {CAMPAIGNS.map((c) => (
          <div key={c.id} className="card card-hover block cursor-default">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="min-w-0">
                <div
                  className="font-medium truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {c.name}
                </div>
                <div
                  className="text-sm mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {c.objective} &middot; {c.posts} posts &middot; by {c.creator}
                </div>
                <div
                  className="text-xs mt-1"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {c.startDate} &mdash; {c.endDate}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`badge ${c.statusClass}`}>{c.status}</span>
                <span
                  className="text-xs hidden sm:inline"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {c.platforms.join(", ")}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sign-up CTA inline */}
      <div
        className="mt-8 rounded-xl p-6 text-center"
        style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(59,130,246,0.1) 100%)",
          border: "1px solid var(--border-primary)",
        }}
      >
        <h3
          className="text-lg font-bold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Ready to manage your own campaigns?
        </h3>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Create, schedule, and optimize campaigns across all platforms with AI-powered
          insights.
        </p>
        <a
          href="/signin"
          className="btn-primary inline-flex items-center gap-2"
        >
          Sign Up Free
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}
