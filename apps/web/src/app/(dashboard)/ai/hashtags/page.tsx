"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";

interface HashtagItem {
  tag: string;
  estimatedReach: string;
  competition: string;
}

interface BrandedHashtag {
  tag: string;
  description: string;
}

interface HashtagGroup {
  name: string;
  description: string;
  hashtags: string[];
}

interface HashtagResult {
  trending: HashtagItem[];
  niche: HashtagItem[];
  branded: BrandedHashtag[];
  groups: HashtagGroup[];
}

const PLATFORMS = [
  { id: "instagram" as const, label: "Instagram" },
  { id: "twitter" as const, label: "Twitter / X" },
  { id: "linkedin" as const, label: "LinkedIn" },
  { id: "tiktok" as const, label: "TikTok" },
];

const SAVED_KEY = "adpilot-hashtag-sets";

export default function HashtagsPage() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<string>("instagram");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HashtagResult | null>(null);
  const [error, setError] = useState("");
  const [savedSets, setSavedSets] = useState<
    Array<{ id?: string; name: string; hashtags: string[]; platform: string }>
  >([]);
  const [copied, setCopied] = useState<string | null>(null);

  // Load from DB first, then fallback to localStorage
  useEffect(() => {
    fetch("/api/ai/hashtags/save")
      .then((res) => res.json())
      .then((data) => {
        if (data.sets?.length > 0) {
          setSavedSets(
            data.sets.map((s: { id: string; name: string; hashtags: string[]; category?: string }) => ({
              id: s.id,
              name: s.name,
              hashtags: s.hashtags,
              platform: s.category ?? "instagram",
            }))
          );
        } else {
          // Fallback to localStorage
          try {
            const stored = localStorage.getItem(SAVED_KEY);
            if (stored) setSavedSets(JSON.parse(stored));
          } catch { /* non-critical */ }
        }
      })
      .catch(() => {
        try {
          const stored = localStorage.getItem(SAVED_KEY);
          if (stored) setSavedSets(JSON.parse(stored));
        } catch { /* non-critical */ }
      });
  }, []);

  async function saveSet(name: string, hashtags: string[]) {
    // Save to localStorage as fallback
    const newSets = [...savedSets, { name, hashtags, platform }];
    setSavedSets(newSets);
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(newSets));
    } catch { /* non-critical */ }

    // Also save to DB
    try {
      const pagesRes = await fetch("/api/pages");
      const pagesData = await pagesRes.json();
      const pageId = pagesData.data?.[0]?.id;
      if (pageId) {
        const res = await fetch("/api/ai/hashtags/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageId, name, hashtags, category: platform }),
        });
        const data = await res.json();
        if (res.ok && data.id) {
          // Update the last entry with the DB id
          setSavedSets((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1]!, id: data.id };
            return updated;
          });
        }
      }
    } catch { /* non-critical */ }
  }

  async function removeSet(index: number) {
    const set = savedSets[index];
    const newSets = savedSets.filter((_, i) => i !== index);
    setSavedSets(newSets);
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(newSets));
    } catch { /* non-critical */ }

    // Also delete from DB
    if (set?.id) {
      try {
        await fetch(`/api/ai/hashtags/save?id=${set.id}`, { method: "DELETE" });
      } catch { /* non-critical */ }
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  async function research() {
    if (!topic.trim()) {
      setError("Enter a topic or keyword");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/ai/hashtags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), platform }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch {
      setError("Failed to research hashtags");
    }
    setLoading(false);
  }

  const competitionColor = (c: string) => {
    const lower = c.toLowerCase();
    if (lower === "high") return "var(--accent-red)";
    if (lower === "medium") return "var(--accent-amber)";
    return "var(--accent-emerald)";
  };

  return (
    <div>
      <PageHeader
        title="Hashtag Research"
        subtitle="Enter a topic \u2014 AI finds trending, niche, and branded hashtags with reach estimates"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "AI Studio", href: "/ai" },
          { label: "Hashtags" },
        ]}
      />

      {/* Input */}
      <div className="card mb-6">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-0">
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Topic or Keyword
            </label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. sustainable fashion, SaaS marketing, fitness tips"
              className="w-full rounded-md px-3 py-2 text-sm"
              onKeyDown={(e) => e.key === "Enter" && research()}
            />
          </div>
          <div className="w-48">
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm"
            >
              {PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={research}
            disabled={loading}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {loading ? "Researching..." : "Research Hashtags"}
          </button>
        </div>
        {error && (
          <div className="alert-error mt-3 text-xs rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card">
              <div className="skeleton h-4 w-1/3 rounded mb-3" />
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="skeleton h-6 w-full rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Trending Hashtags */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-tertiary)" }}
              >
                Trending Hashtags
              </h3>
              <button
                onClick={() =>
                  copyToClipboard(
                    result.trending.map((h) => h.tag).join(" "),
                    "trending"
                  )
                }
                className="text-xs"
                style={{ color: "var(--accent-blue)" }}
              >
                {copied === "trending" ? "Copied!" : "Copy All"}
              </button>
            </div>
            <div className="space-y-1.5">
              {result.trending.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-sm"
                  style={{
                    background: "var(--bg-tertiary)",
                  }}
                >
                  <span style={{ color: "var(--accent-blue)" }}>{h.tag}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span style={{ color: "var(--text-tertiary)" }}>
                      {h.estimatedReach}
                    </span>
                    <span
                      style={{ color: competitionColor(h.competition) }}
                    >
                      {h.competition}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Niche Hashtags */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-tertiary)" }}
              >
                Niche Hashtags
              </h3>
              <button
                onClick={() =>
                  copyToClipboard(
                    result.niche.map((h) => h.tag).join(" "),
                    "niche"
                  )
                }
                className="text-xs"
                style={{ color: "var(--accent-blue)" }}
              >
                {copied === "niche" ? "Copied!" : "Copy All"}
              </button>
            </div>
            <div className="space-y-1.5">
              {result.niche.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-sm"
                  style={{
                    background: "var(--bg-tertiary)",
                  }}
                >
                  <span style={{ color: "var(--accent-purple)" }}>{h.tag}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span style={{ color: "var(--text-tertiary)" }}>
                      {h.estimatedReach}
                    </span>
                    <span
                      style={{ color: competitionColor(h.competition) }}
                    >
                      {h.competition}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Branded Hashtags */}
          <div className="card">
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--text-tertiary)" }}
            >
              Branded Hashtag Suggestions
            </h3>
            <div className="space-y-2">
              {result.branded.map((h, i) => (
                <div
                  key={i}
                  className="rounded-md px-3 py-2"
                  style={{
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border-primary)",
                  }}
                >
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--accent-amber)" }}
                  >
                    {h.tag}
                  </span>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {h.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Ready-to-Use Groups */}
          <div className="card">
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--text-tertiary)" }}
            >
              Ready-to-Use Groups
            </h3>
            <div className="space-y-3">
              {result.groups.map((group, i) => (
                <div
                  key={i}
                  className="rounded-lg px-4 py-3"
                  style={{
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border-primary)",
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {group.name}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          copyToClipboard(
                            group.hashtags.join(" "),
                            `group-${i}`
                          )
                        }
                        className="text-xs"
                        style={{ color: "var(--accent-blue)" }}
                      >
                        {copied === `group-${i}` ? "Copied!" : "Copy Set"}
                      </button>
                      <button
                        onClick={() => saveSet(group.name, group.hashtags)}
                        className="text-xs"
                        style={{ color: "var(--accent-emerald)" }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                  <p
                    className="text-xs mb-2"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {group.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {group.hashtags.map((tag, j) => (
                      <span key={j} className="badge badge-info">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Saved Sets */}
      {savedSets.length > 0 && (
        <div className="card mt-6">
          <h3
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--text-tertiary)" }}
          >
            Saved Hashtag Sets
          </h3>
          <div className="space-y-2">
            {savedSets.map((set, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md px-3 py-2"
                style={{
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border-primary)",
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-medium truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {set.name}
                    </span>
                    <span className="badge badge-neutral">{set.platform}</span>
                  </div>
                  <p
                    className="text-xs truncate mt-0.5"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {set.hashtags.join(" ")}
                  </p>
                </div>
                <div className="flex gap-2 ml-3 flex-shrink-0">
                  <button
                    onClick={() =>
                      copyToClipboard(
                        set.hashtags.join(" "),
                        `saved-${i}`
                      )
                    }
                    className="text-xs"
                    style={{ color: "var(--accent-blue)" }}
                  >
                    {copied === `saved-${i}` ? "Copied!" : "Copy"}
                  </button>
                  <button
                    onClick={() => removeSet(i)}
                    className="text-xs"
                    style={{ color: "var(--accent-red)" }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
