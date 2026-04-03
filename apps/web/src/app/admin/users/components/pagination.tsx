"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function Pagination({ total, pageSize }: { total: number; pageSize: number }) {
  const searchParams = useSearchParams();
  const currentPage = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (totalPages <= 1) return null;

  function buildHref(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `/admin/users?${params.toString()}`;
  }

  const buttonStyle = (disabled: boolean): React.CSSProperties => ({
    padding: "6px 14px",
    fontSize: 13,
    borderRadius: 6,
    border: "1px solid var(--border-primary, #2a2a2a)",
    background: disabled ? "transparent" : "var(--bg-secondary)",
    color: disabled ? "var(--text-secondary)" : "var(--text-primary)",
    textDecoration: "none",
    pointerEvents: disabled ? "none" : "auto",
    opacity: disabled ? 0.5 : 1,
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20 }}>
      <Link href={buildHref(currentPage - 1)} style={buttonStyle(currentPage <= 1)}>
        Previous
      </Link>
      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
        Page {currentPage} of {totalPages} ({total} total)
      </span>
      <Link href={buildHref(currentPage + 1)} style={buttonStyle(currentPage >= totalPages)}>
        Next
      </Link>
    </div>
  );
}
