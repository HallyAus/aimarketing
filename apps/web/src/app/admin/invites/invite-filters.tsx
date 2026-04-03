"use client";

import { useRouter, useSearchParams } from "next/navigation";

const STATUSES = ["ALL", "PENDING", "ACCEPTED", "DECLINED", "CANCELLED", "EXPIRED"];

const selectStyle: React.CSSProperties = {
  padding: "8px 12px",
  fontSize: 13,
  borderRadius: 8,
  border: "1px solid var(--border-primary, #2a2a2a)",
  background: "var(--bg-secondary)",
  color: "var(--text-primary)",
  outline: "none",
};

export function InviteFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/admin/invites?${params.toString()}`);
  }

  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
      <select
        value={searchParams.get("status") || "ALL"}
        onChange={(e) => updateFilter("status", e.target.value)}
        style={selectStyle}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s === "ALL" ? "All Statuses" : s}
          </option>
        ))}
      </select>
    </div>
  );
}
