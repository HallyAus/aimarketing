import Link from "next/link";
import { PageHeader } from "@/components/page-header";

const SETTINGS_CARDS = [
  {
    href: "/settings/connections",
    title: "Connections",
    description: "Connect your social media accounts and manage platform integrations.",
    icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
  },
  {
    href: "/settings/team",
    title: "Team",
    description: "Invite team members, manage roles, and configure permissions.",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    href: "/settings/billing",
    title: "Billing",
    description: "Manage your subscription, payment methods, and view invoices.",
    icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  },
  {
    href: "/settings/rss",
    title: "RSS Feeds",
    description: "Subscribe to RSS feeds and auto-generate posts from new articles.",
    icon: "M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z",
  },
  {
    href: "/settings/webhooks",
    title: "Webhooks",
    description: "Configure webhook endpoints for real-time event notifications.",
    icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
  },
  {
    href: "/settings/auto-reply",
    title: "Auto-Reply",
    description: "Set up automatic replies for comments and direct messages.",
    icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  },
  {
    href: "/settings/crm",
    title: "CRM",
    description: "Configure CRM integrations and lead management workflows.",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    href: "/settings/reports",
    title: "Reports",
    description: "Configure automated reporting schedules and delivery preferences.",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
];

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage your account, integrations, and preferences."
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Settings" },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {SETTINGS_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-lg p-5 transition-all hover:ring-1 group"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-primary)",
              textDecoration: "none",
            }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
              style={{ background: "var(--bg-tertiary)" }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "var(--accent-blue)" }}
              >
                <path d={card.icon} />
              </svg>
            </div>
            <h3
              className="text-sm font-semibold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              {card.title}
            </h3>
            <p
              className="text-xs leading-relaxed m-0"
              style={{ color: "var(--text-tertiary)" }}
            >
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
