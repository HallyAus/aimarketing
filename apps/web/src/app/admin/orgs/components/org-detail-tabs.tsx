"use client";

import { useState } from "react";

interface OrgDetailTabsProps {
  overview: React.ReactNode;
  members: React.ReactNode;
  billing: React.ReactNode;
  posts: React.ReactNode;
  auditLog: React.ReactNode;
}

const tabs = [
  { key: "overview", label: "Overview" },
  { key: "members", label: "Members" },
  { key: "billing", label: "Billing" },
  { key: "posts", label: "Posts" },
  { key: "auditLog", label: "Audit Log" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export function OrgDetailTabs({ overview, members, billing, posts, auditLog }: OrgDetailTabsProps) {
  const [active, setActive] = useState<TabKey>("overview");

  const content: Record<TabKey, React.ReactNode> = {
    overview,
    members,
    billing,
    posts,
    auditLog,
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid var(--border-primary)",
          marginBottom: 24,
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            style={{
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: active === tab.key ? 600 : 400,
              color: active === tab.key ? "var(--accent-blue)" : "var(--text-secondary)",
              background: "transparent",
              border: "none",
              borderBottom: active === tab.key ? "2px solid var(--accent-blue)" : "2px solid transparent",
              cursor: "pointer",
              transition: "color 0.15s, border-color 0.15s",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {content[active]}
    </div>
  );
}
