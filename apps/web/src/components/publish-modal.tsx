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
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Post now to ${platform.replace("_", " ")}`}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="rounded-lg p-6 w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto"
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
            <label htmlFor="publish-page-select" className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Posting to Page:
            </label>
            {fetchingPages ? (
              <div className="text-xs py-2" style={{ color: "var(--text-tertiary)" }}>Loading pages...</div>
            ) : pages.length === 0 ? (
              <div className="text-xs py-2" style={{ color: "var(--accent-red)" }}>
                No pages found. Go to Settings, then Connections, and select your Facebook pages first.
              </div>
            ) : (
              <>
                <select
                  id="publish-page-select"
                  value={selectedPageId}
                  onChange={e => setSelectedPageId(e.target.value)}
                  className="w-full rounded px-3 py-2 text-sm mb-2"
                  style={{ background: "var(--bg-primary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                >
                  {pages.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <div className="rounded-md px-3 py-2 text-sm flex items-center gap-2" style={{ background: "var(--accent-blue-muted, rgba(59,130,246,0.1))", border: "1px solid rgba(59,130,246,0.2)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#1877f2", flexShrink: 0 }} />
                  <span style={{ color: "var(--text-primary)" }}>
                    This will post to <strong>{pages.find(p => p.id === selectedPageId)?.name ?? "selected page"}</strong>
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {conn && !isFacebook && (
          <div className="rounded-md px-3 py-2 text-sm mb-4 flex items-center gap-2" style={{ background: "var(--accent-blue-muted, rgba(59,130,246,0.1))", border: "1px solid rgba(59,130,246,0.2)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-blue)", flexShrink: 0 }} />
            <span style={{ color: "var(--text-primary)" }}>
              Posting to <strong>{conn.platformAccountName ?? platform.replace("_", " ")}</strong>
            </span>
          </div>
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
          <button onClick={onClose} className="btn-secondary text-sm min-h-[44px]">
            {success ? "Close" : "Cancel"}
          </button>
          {!success && (
            <button
              onClick={handlePublish}
              disabled={loading || !conn || (isFacebook && (!selectedPageId || pages.length === 0))}
              className="btn-primary text-sm min-h-[44px]"
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
