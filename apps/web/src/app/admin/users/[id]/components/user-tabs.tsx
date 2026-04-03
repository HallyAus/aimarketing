"use client";

import { useState } from "react";

const tabs = ["Profile", "Organizations", "Activity", "Posts", "Sessions"] as const;
type Tab = (typeof tabs)[number];

export function UserTabs({ children }: { children: Record<Tab, React.ReactNode> }) {
  const [active, setActive] = useState<Tab>("Profile");

  return (
    <div>
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border-primary, #2a2a2a)", marginBottom: 20, minWidth: "max-content" }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              style={{
                padding: "10px 16px",
                fontSize: 13,
                fontWeight: active === tab ? 600 : 400,
                color: active === tab ? "var(--text-primary)" : "var(--text-secondary)",
                background: "transparent",
                border: "none",
                borderBottom: active === tab ? "2px solid var(--accent-blue)" : "2px solid transparent",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      {children[active]}
    </div>
  );
}
