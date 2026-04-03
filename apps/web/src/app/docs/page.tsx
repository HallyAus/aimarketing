import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import "@/styles/marketing.css";

export const metadata: Metadata = {
  title: "Documentation | AdPilot",
  description:
    "AdPilot platform documentation. Getting started guides, API overview, platform integrations, webhooks, and timezone handling.",
  openGraph: {
    title: "Documentation | AdPilot",
    description:
      "AdPilot platform documentation — guides, API reference, and integration docs.",
    type: "website",
    url: "https://adpilot.au/docs",
  },
};

const sections = [
  {
    id: "getting-started",
    title: "Getting Started",
    items: [
      {
        title: "Create Your Account",
        description:
          "Sign up for AdPilot and configure your workspace. Choose your plan, set your timezone, and invite team members.",
      },
      {
        title: "Connect Your First Platform",
        description:
          "Link a social media account using OAuth. AdPilot requests minimal permissions and uses PKCE for secure authorization.",
      },
      {
        title: "Create and Schedule Content",
        description:
          "Use the AI Content Studio to generate platform-optimized posts. Schedule them across timezones or publish immediately.",
      },
      {
        title: "Review Analytics",
        description:
          "Monitor performance across all connected platforms from a single dashboard. Track engagement, reach, and growth trends.",
      },
    ],
  },
  {
    id: "api-overview",
    title: "API Overview",
    items: [
      {
        title: "Authentication",
        description:
          "All API requests require a Bearer token. Generate API keys from your dashboard under Settings > API Keys.",
      },
      {
        title: "Rate Limits",
        description:
          "Free: 100 requests/hour. Pro: 1,000 requests/hour. Agency: 10,000 requests/hour. Rate limit headers are included in every response.",
      },
      {
        title: "Endpoints",
        description:
          "RESTful API with JSON request and response bodies. Base URL: https://api.adpilot.au/v1. Full OpenAPI spec coming soon.",
      },
      {
        title: "SDKs",
        description:
          "Official TypeScript/JavaScript SDK available. Python and Go SDKs are on the roadmap.",
      },
    ],
  },
  {
    id: "platform-integrations",
    title: "Platform Integrations",
    items: [
      {
        title: "Facebook & Instagram",
        description:
          "Publish posts, stories, and reels. Requires Facebook Business account. Supports carousel posts and scheduled publishing.",
      },
      {
        title: "TikTok",
        description:
          "Upload videos and manage captions. Supports direct publishing via TikTok Content Posting API.",
      },
      {
        title: "LinkedIn",
        description:
          "Publish articles, text posts, and image posts to personal profiles and company pages.",
      },
      {
        title: "X (Twitter)",
        description:
          "Post tweets, threads, and media. Supports the X API v2 with OAuth 2.0 PKCE.",
      },
      {
        title: "YouTube",
        description:
          "Upload videos, manage titles and descriptions, set visibility and scheduling. Requires YouTube channel with API access.",
      },
      {
        title: "Google Ads",
        description:
          "Create and manage ad campaigns. Supports responsive search ads, display ads, and performance tracking.",
      },
      {
        title: "Pinterest",
        description:
          "Create pins with images and descriptions. Supports rich pins and board management.",
      },
      {
        title: "Snapchat",
        description:
          "Manage Snapchat Ads and public stories. Supports creative uploads and audience targeting.",
      },
    ],
  },
  {
    id: "webhooks",
    title: "Webhook Documentation",
    items: [
      {
        title: "Setting Up Webhooks",
        description:
          "Configure webhook endpoints in Settings > Webhooks. Provide an HTTPS URL and select which events to receive.",
      },
      {
        title: "Event Types",
        description:
          "Available events: post.published, post.failed, post.scheduled, analytics.updated, account.connected, account.disconnected.",
      },
      {
        title: "Payload Format",
        description:
          "All webhooks deliver JSON payloads with event type, timestamp (ISO 8601 with timezone), and event-specific data.",
      },
      {
        title: "Verification",
        description:
          "Each webhook includes an X-AdPilot-Signature header (HMAC-SHA256) for payload verification. Signing secret available in your dashboard.",
      },
    ],
  },
  {
    id: "timezone-handling",
    title: "Timezone Handling",
    items: [
      {
        title: "Automatic Detection",
        description:
          "AdPilot detects your timezone using the Intl API on first login. All times in the dashboard display in your local timezone.",
      },
      {
        title: "Scheduling Across Timezones",
        description:
          "Schedule posts for specific times in any timezone. AdPilot stores schedules with IANA timezone identifiers and handles DST transitions automatically.",
      },
      {
        title: "Team Timezone Support",
        description:
          "Each team member sees times in their own timezone. The content calendar supports timezone overlays to visualize global publishing schedules.",
      },
      {
        title: "API Timezone Conventions",
        description:
          "All API timestamps use ISO 8601 format with timezone offset. You can specify a timezone parameter on scheduling endpoints using IANA timezone names.",
      },
    ],
  },
];

export default function DocsPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" style={{ background: "var(--bg-primary)" }}>
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <p
                className="marketing-label mb-4"
                style={{ color: "var(--accent-blue)" }}
              >
                Documentation
              </p>
              <h1
                className="marketing-h1 mb-6"
                style={{ color: "var(--text-primary)" }}
              >
                Platform Docs
              </h1>
              <p
                className="marketing-body max-w-2xl mx-auto"
                style={{ color: "var(--text-secondary)" }}
              >
                Everything you need to get started with AdPilot, integrate with
                our API, and connect your platforms.
              </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-10">
              {/* Sidebar nav */}
              <nav className="lg:w-56 shrink-0">
                <div
                  className="lg:sticky lg:top-24 space-y-1"
                >
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="block px-3 py-2 text-sm rounded-lg transition-colors"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {section.title}
                    </a>
                  ))}
                </div>
              </nav>

              {/* Content */}
              <div className="flex-1 space-y-16">
                {sections.map((section) => (
                  <div key={section.id} id={section.id}>
                    <h2
                      className="marketing-h2 mb-6"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {section.title}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      {section.items.map((item) => (
                        <div
                          key={item.title}
                          className="glass rounded-xl p-5"
                          style={{ borderColor: "var(--border-primary)" }}
                        >
                          <h3
                            className="text-sm font-semibold mb-2"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {item.title}
                          </h3>
                          <p
                            className="text-sm"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {item.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* API docs note */}
                <div
                  className="glass rounded-xl p-6 text-center"
                  style={{
                    borderColor: "var(--accent-blue)",
                    borderWidth: "1px",
                    borderStyle: "dashed",
                  }}
                >
                  <p
                    className="text-sm font-medium mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Full API docs coming soon
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    We're building interactive API documentation with request
                    examples and live testing. In the meantime,{" "}
                    <Link
                      href="/contact"
                      style={{ color: "var(--accent-blue)" }}
                    >
                      contact us
                    </Link>{" "}
                    for API access.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
