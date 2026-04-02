"use client";

import { useState } from "react";

export function BackfillPagesButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ updated: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleBackfill() {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/posts/backfill-pages", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Backfill failed");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleBackfill}
        disabled={loading}
        className="btn-secondary text-sm inline-flex items-center gap-2"
        style={{ opacity: loading ? 0.6 : 1 }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
        </svg>
        {loading ? "Backfilling..." : "Backfill page assignments"}
      </button>

      {result && (
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          Updated <strong style={{ color: "var(--accent-green, #22c55e)" }}>{result.updated}</strong> post{result.updated !== 1 ? "s" : ""}.
          {result.skipped > 0 && (
            <> Skipped <strong style={{ color: "var(--accent-amber, #f59e0b)" }}>{result.skipped}</strong> (multiple pages configured).</>
          )}
        </p>
      )}

      {error && (
        <p className="text-xs" style={{ color: "var(--accent-red, #ef4444)" }}>{error}</p>
      )}
    </div>
  );
}
