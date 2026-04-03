"use client";

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function CacheStatus({
  cached,
  generatedAt,
  rateLimited,
  onRegenerate,
  loading,
}: {
  cached?: boolean;
  generatedAt?: string;
  rateLimited?: boolean;
  onRegenerate: () => void;
  loading: boolean;
}) {
  if (!generatedAt) return null;

  return (
    <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: "var(--text-tertiary)" }}>
      {cached && (
        <span className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Last analyzed: {timeAgo(generatedAt)}
        </span>
      )}
      {rateLimited && (
        <span style={{ color: "var(--accent-amber)" }}>
          Rate limited — try again later
        </span>
      )}
      <button
        onClick={onRegenerate}
        disabled={loading}
        className="text-xs font-medium transition-colors"
        style={{ color: "var(--accent-blue)", background: "none", border: "none", cursor: loading ? "not-allowed" : "pointer", padding: 0 }}
      >
        {loading ? "Regenerating..." : "Regenerate"}
      </button>
    </div>
  );
}
