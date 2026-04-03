import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import "@/styles/marketing.css";

export const metadata: Metadata = {
  title: "Changelog | AdPilot",
  description:
    "What's new in AdPilot. Product updates, new features, and improvements.",
  openGraph: {
    title: "Changelog | AdPilot",
    description: "What's new in AdPilot. Product updates and improvements.",
    type: "website",
    url: "https://adpilot.au/changelog",
  },
};

const entries = [
  {
    version: "v1.2",
    date: "March 20, 2026",
    title: "TikTok Integration",
    tag: "New Feature",
    tagColor: "var(--accent-blue)",
    description:
      "Full TikTok publishing support is here. Upload videos, manage captions and hashtags, and schedule TikTok posts alongside your other platforms. Supports the TikTok Content Posting API with direct upload — no workarounds needed.",
    highlights: [
      "Direct video upload via TikTok Content Posting API",
      "Hashtag suggestions powered by AI",
      "Scheduled publishing with timezone-aware delivery",
      "TikTok analytics integrated into the unified dashboard",
    ],
  },
  {
    version: "v1.1",
    date: "March 5, 2026",
    title: "AI Content Studio Improvements",
    tag: "Enhancement",
    tagColor: "var(--accent-purple)",
    description:
      "Major upgrades to the AI Content Studio. Better brand voice matching, platform-specific tone adaptation, and a new side-by-side editor that shows how your content will look on each platform before publishing.",
    highlights: [
      "Brand voice training with custom examples",
      "Side-by-side multi-platform preview",
      "Improved content suggestions with engagement predictions",
      "Batch content generation for weekly planning",
    ],
  },
  {
    version: "v1.0.3",
    date: "February 20, 2026",
    title: "Timezone Auto-Detection",
    tag: "Improvement",
    tagColor: "#22c55e",
    description:
      "AdPilot now automatically detects your timezone on first login using the Intl API. All dashboard times display in your local timezone, and scheduled posts account for DST transitions automatically.",
    highlights: [
      "Automatic timezone detection via Intl API",
      "DST-aware scheduling — no more off-by-one-hour posts",
      "Per-team-member timezone display",
      "Timezone overlay on the content calendar",
    ],
  },
  {
    version: "v1.0.2",
    date: "February 10, 2026",
    title: "Team Collaboration Features",
    tag: "New Feature",
    tagColor: "var(--accent-blue)",
    description:
      "Invite team members, assign roles, and set up approval workflows. Content can now be drafted, reviewed, and approved before publishing — all within AdPilot.",
    highlights: [
      "Team invitations with role-based access (Admin, Editor, Viewer)",
      "Content approval workflows with one-click approve/reject",
      "Activity log showing all team actions",
      "Per-member analytics and publishing history",
    ],
  },
  {
    version: "v1.0",
    date: "January 28, 2026",
    title: "AdPilot Public Beta Launch",
    tag: "Launch",
    tagColor: "#f59e0b",
    description:
      "AdPilot launches in public beta. AI-powered content creation, 9-platform publishing, smart scheduling, and unified analytics — all from one dashboard. Free, Pro ($49/mo), and Agency ($299/mo) plans available from day one.",
    highlights: [
      "AI Content Studio powered by Claude",
      "Publishing to Facebook, Instagram, TikTok, LinkedIn, X, YouTube, Google Ads, Pinterest, and Snapchat",
      "Smart scheduling with optimal time recommendations",
      "Unified analytics dashboard across all platforms",
      "Webhook support for custom integrations",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" style={{ background: "var(--bg-primary)" }}>
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-16">
              <p
                className="marketing-label mb-4"
                style={{ color: "var(--accent-blue)" }}
              >
                Changelog
              </p>
              <h1
                className="marketing-h1 mb-6"
                style={{ color: "var(--text-primary)" }}
              >
                What's New
              </h1>
              <p
                className="marketing-body"
                style={{ color: "var(--text-secondary)" }}
              >
                Product updates, new features, and improvements to AdPilot.
              </p>
            </div>

            <div className="space-y-8">
              {entries.map((entry) => (
                <div
                  key={entry.version}
                  className="glass rounded-xl p-6 md:p-8"
                  style={{ borderColor: "var(--border-primary)" }}
                >
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span
                      className="text-sm font-bold px-3 py-1 rounded-full"
                      style={{
                        background: "rgba(59, 130, 246, 0.15)",
                        color: "var(--accent-blue)",
                      }}
                    >
                      {entry.version}
                    </span>
                    <span
                      className="text-xs font-medium px-2 py-1 rounded-full"
                      style={{
                        background: `color-mix(in srgb, ${entry.tagColor} 15%, transparent)`,
                        color: entry.tagColor,
                      }}
                    >
                      {entry.tag}
                    </span>
                    <span
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {entry.date}
                    </span>
                  </div>

                  <h2
                    className="text-xl font-semibold mb-3"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {entry.title}
                  </h2>

                  <p
                    className="text-sm mb-4"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {entry.description}
                  </p>

                  <ul className="space-y-2">
                    {entry.highlights.map((h) => (
                      <li
                        key={h}
                        className="flex items-start gap-2 text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <span
                          className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: "var(--accent-blue)" }}
                        />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
