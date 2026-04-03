"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const statuses = ["ALL", "ACTIVE", "SUSPENDED", "BANNED"] as const;
const roles = ["ALL", "USER", "ADMIN", "SUPER_ADMIN"] as const;
const plans = ["ALL", "FREE", "PRO", "AGENCY"] as const;

export function UserFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "" || value === "ALL") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete("page"); // reset to page 1 on filter change
      router.push(`/admin/users?${params.toString()}`);
    },
    [router, searchParams],
  );

  const inputStyle: React.CSSProperties = {
    padding: "8px 12px",
    fontSize: 13,
    borderRadius: 6,
    border: "1px solid var(--border-primary, #2a2a2a)",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    outline: "none",
  };

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
      <input
        type="text"
        placeholder="Search email or name..."
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(e) => updateParam("q", e.target.value)}
        style={{ ...inputStyle, width: 260 }}
      />
      <select
        defaultValue={searchParams.get("status") ?? "ALL"}
        onChange={(e) => updateParam("status", e.target.value)}
        style={inputStyle}
      >
        {statuses.map((s) => (
          <option key={s} value={s}>
            Status: {s}
          </option>
        ))}
      </select>
      <select
        defaultValue={searchParams.get("role") ?? "ALL"}
        onChange={(e) => updateParam("role", e.target.value)}
        style={inputStyle}
      >
        {roles.map((r) => (
          <option key={r} value={r}>
            Role: {r.replace("_", " ")}
          </option>
        ))}
      </select>
      <select
        defaultValue={searchParams.get("plan") ?? "ALL"}
        onChange={(e) => updateParam("plan", e.target.value)}
        style={inputStyle}
      >
        {plans.map((p) => (
          <option key={p} value={p}>
            Plan: {p}
          </option>
        ))}
      </select>
    </div>
  );
}
