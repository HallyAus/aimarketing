"use client";

import { useState, useEffect } from "react";

interface FacebookPage {
  id: string;
  name: string;
  pictureUrl?: string;
}

interface Connection {
  id: string;
  platform: string;
  platformAccountName?: string | null;
}

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  platform: string;
  connections: Connection[];
  onSuccess?: () => void;
}

export function PublishModal({ isOpen, onClose, content, platform, connections, onSuccess }: PublishModalProps) {
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingPages, setFetchingPages] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isFacebook = platform === "FACEBOOK" || platform === "INSTAGRAM";
  const conn = connections.find(c => c.platform === platform);

  useEffect(() => {
    if (isOpen && isFacebook) {
      setFetchingPages(true);
      fetch("/api/platforms/facebook/pages")
        .then(r => r.json())
        .then(d => {
          const p = d.pages ?? [];
          setPages(p);
          if (p.length > 0) setSelectedPageId(p[0].id);
        })
        .catch(() => {})
        .finally(() => setFetchingPages(false));
    }
  }, [isOpen, isFacebook]);

  async function handlePublish() {
    if (!conn) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/posts/publish-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          platform,
          connectionId: conn.id,
          ...(isFacebook && selectedPageId ? { pageId: selectedPageId } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to publish");
      setSuccess(`Posted successfully!${data.url ? ` View: ${data.url}` : ""}`);
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to publish");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="rounded-lg p-6 w-full max-w-md"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          Post Now to {platform.replace("_", " ")}
        </h3>

        <p className="text-xs mb-4 line-clamp-3" style={{ color: "var(--text-tertiary)" }}>
          {content.substring(0, 120)}...
        </p>

        {!conn && (
          <div className="rounded-md px-4 py-3 text-sm mb-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
            No connected {platform.replace("_", " ")} account. Connect one in Settings → Connections first.
          </div>
        )}

        {conn && isFacebook && (
          <div className="mb-4">
            <label className="block text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
              Select Page to post to
            </label>
            {fetchingPages ? (
              <div className="text-xs py-2" style={{ color: "var(--text-tertiary)" }}>Loading pages...</div>
            ) : pages.length === 0 ? (
              <div className="text-xs py-2" style={{ color: "#ef4444" }}>
                No pages found. Go to Settings → Connections → select your Facebook pages first.
              </div>
            ) : (
              <select
                value={selectedPageId}
                onChange={e => setSelectedPageId(e.target.value)}
                className="w-full rounded px-3 py-2 text-sm"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
              >
                {pages.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {conn && !isFacebook && (
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            Posting to your connected {platform.replace("_", " ")} account{conn.platformAccountName ? ` (${conn.platformAccountName})` : ""}.
          </p>
        )}

        {error && (
          <div className="rounded-md px-4 py-3 text-sm mb-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md px-4 py-3 text-sm mb-4" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981" }}>
            {success}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary text-sm">
            {success ? "Close" : "Cancel"}
          </button>
          {!success && (
            <button
              onClick={handlePublish}
              disabled={loading || !conn || (isFacebook && (!selectedPageId || pages.length === 0))}
              className="btn-primary text-sm"
              style={{ opacity: loading || !conn || (isFacebook && (!selectedPageId || pages.length === 0)) ? 0.5 : 1 }}
            >
              {loading ? "Publishing..." : "Publish Now"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
