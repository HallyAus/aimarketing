"use client";

import { useEffect, useState } from "react";

interface FacebookPage {
  id: string;
  name: string;
  pictureUrl: string | null;
  accessToken: string;
}

interface SavedPage {
  id: string;
  name: string;
}

export function FacebookPages({
  savedPageIds,
}: {
  savedPageIds: string[];
}) {
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(savedPageIds));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPages() {
      try {
        const res = await fetch("/api/platforms/facebook/pages");
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to load pages");
        }
        const data = await res.json();
        if (!cancelled) {
          setPages(data.pages ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load pages");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPages();
    return () => { cancelled = true; };
  }, []);

  function togglePage(pageId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
    setSuccessMsg(null);
  }

  async function saveSelected() {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const selectedPages = pages
        .filter((p) => selected.has(p.id))
        .map((p) => ({
          id: p.id,
          name: p.name,
          accessToken: p.accessToken,
        }));

      const res = await fetch("/api/platforms/facebook/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedPages }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }

      setSuccessMsg(`Saved ${selectedPages.length} page${selectedPages.length === 1 ? "" : "s"}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div
        className="mt-3 rounded-md p-3 text-sm"
        style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}
      >
        Loading Facebook Pages...
      </div>
    );
  }

  if (error && pages.length === 0) {
    return (
      <div
        className="mt-3 rounded-md p-3 text-sm"
        style={{
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.3)",
          color: "var(--accent-red)",
        }}
      >
        {error}
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div
        className="mt-3 rounded-md p-3 text-sm"
        style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}
      >
        No Facebook Pages found. Make sure your account manages at least one page.
      </div>
    );
  }

  return (
    <div className="mt-3">
      <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
        Select pages to manage:
      </p>

      <div className="space-y-2">
        {pages.map((page) => (
          <label
            key={page.id}
            className="flex items-center gap-3 rounded-md p-2 cursor-pointer transition-colors"
            style={{
              background: selected.has(page.id) ? "rgba(59,130,246,0.08)" : "var(--bg-secondary)",
              border: selected.has(page.id)
                ? "1px solid var(--accent-blue)"
                : "1px solid var(--border-primary)",
            }}
          >
            <input
              type="checkbox"
              checked={selected.has(page.id)}
              onChange={() => togglePage(page.id)}
              className="rounded"
              style={{ accentColor: "var(--accent-blue)" }}
            />
            {page.pictureUrl && (
              <img
                src={page.pictureUrl}
                alt=""
                className="w-8 h-8 rounded-full object-cover"
                style={{ border: "1px solid var(--border-primary)" }}
              />
            )}
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {page.name}
            </span>
          </label>
        ))}
      </div>

      {error && (
        <div
          className="mt-2 rounded-md p-2 text-xs"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "var(--accent-red)",
          }}
        >
          {error}
        </div>
      )}

      {successMsg && (
        <div
          className="mt-2 rounded-md p-2 text-xs"
          style={{
            background: "rgba(16,185,129,0.1)",
            border: "1px solid rgba(16,185,129,0.3)",
            color: "var(--accent-emerald)",
          }}
        >
          {successMsg}
        </div>
      )}

      <button
        onClick={saveSelected}
        disabled={saving}
        className="mt-3 rounded px-3 py-1.5 text-xs font-medium transition-opacity"
        style={{
          background: "var(--accent-blue)",
          color: "white",
          opacity: saving ? 0.6 : 1,
        }}
      >
        {saving ? "Saving..." : "Save Selected Pages"}
      </button>
    </div>
  );
}
