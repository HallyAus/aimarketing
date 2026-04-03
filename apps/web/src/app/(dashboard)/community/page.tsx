"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/page-header";

/* ── Types ──────────────────────────────────────────────────── */

interface Topic {
  id: string;
  topic: string;
}

interface FeedItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceType: "reddit" | "web" | "blog";
  url: string;
  engagement: number;
  comments: number;
  timeAgo: string;
  engagementSuggestion: string;
  relevanceScore: number;
}

/* ── Page ───────────────────────────────────────────────────── */

export default function CommunityFeedPage() {
  // Topics
  const [topics, setTopics] = useState<Topic[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [topicLoading, setTopicLoading] = useState(false);

  // Feed
  const [items, setItems] = useState<FeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState("");

  // Expanded suggestions
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Load topics on mount
  useEffect(() => {
    fetchTopics();
  }, []);

  async function fetchTopics() {
    try {
      const res = await fetch("/api/community/topics");
      if (res.ok) {
        const data = await res.json();
        setTopics(data.topics ?? []);
      }
    } catch { /* ignore */ }
  }

  async function addTopic() {
    if (!newTopic.trim()) return;
    setTopicLoading(true);
    try {
      const res = await fetch("/api/community/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: newTopic.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setTopics((prev) => [...prev, data.topic]);
        setNewTopic("");
      } else {
        const data = await res.json();
        setFeedError(data.error || "Failed to add topic");
        setTimeout(() => setFeedError(""), 3000);
      }
    } catch {
      setFeedError("Failed to add topic");
    }
    setTopicLoading(false);
  }

  async function removeTopic(id: string) {
    setTopics((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch("/api/community/topics", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch { /* ignore — already removed from UI */ }
  }

  const loadFeed = useCallback(async () => {
    if (topics.length === 0) return;
    setFeedLoading(true);
    setFeedError("");
    try {
      const res = await fetch("/api/community/feed");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      } else {
        setFeedError("Failed to load feed");
      }
    } catch {
      setFeedError("Failed to load feed");
    }
    setFeedLoading(false);
  }, [topics.length]);

  // Auto-load feed when topics change
  useEffect(() => {
    if (topics.length > 0) loadFeed();
  }, [topics.length, loadFeed]);

  function toggleExpand(id: string) {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const sourceIcon = (type: string) => {
    if (type === "reddit") return "R";
    if (type === "blog") return "B";
    return "W";
  };

  const sourceColor = (type: string) => {
    if (type === "reddit") return "#ff4500";
    if (type === "blog") return "#4facfe";
    return "#6b7280";
  };

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <div>
      <PageHeader
        title="Community Feed"
        subtitle="Discover relevant content in your niche — get AI suggestions for genuine engagement"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Community Feed" },
        ]}
        action={
          topics.length > 0 ? (
            <button onClick={loadFeed} disabled={feedLoading} className="btn-secondary text-sm">
              {feedLoading ? "Refreshing..." : "Refresh Feed"}
            </button>
          ) : undefined
        }
      />

      {feedError && (
        <div className="alert alert-error mb-4">{feedError}</div>
      )}

      {/* ── Topics Management ──────────────────────────────── */}
      <div className="card mb-6">
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          Your Topics
        </h3>
        <p className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>
          Add topics to curate your community feed. We'll find relevant posts from Reddit and the web.
        </p>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTopic()}
            placeholder="e.g. 3D printing, resin printing, Bambu Lab..."
            className="flex-1"
          />
          <button
            onClick={addTopic}
            disabled={topicLoading || !newTopic.trim()}
            className="btn-primary text-sm whitespace-nowrap"
          >
            {topicLoading ? "Adding..." : "Add Topic"}
          </button>
        </div>

        {topics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {topics.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: "var(--accent-blue-muted)",
                  color: "var(--accent-blue)",
                  border: "1px solid var(--accent-blue)",
                }}
              >
                {t.topic}
                <button
                  onClick={() => removeTopic(t.id)}
                  className="hover:opacity-70"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent-blue)", padding: 0, lineHeight: 1 }}
                  aria-label={`Remove ${t.topic}`}
                >
                  x
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Feed Loading ───────────────────────────────────── */}
      {feedLoading && (
        <div className="card flex flex-col items-center justify-center py-16">
          <div
            className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4"
            style={{ borderColor: "var(--accent-blue)", borderTopColor: "transparent" }}
          />
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Fetching and curating your feed...
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
            Searching Reddit, finding articles, AI ranking by relevance
          </p>
        </div>
      )}

      {/* ── Feed Items ─────────────────────────────────────── */}
      {!feedLoading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => {
            const isExpanded = expandedItems.has(item.id);
            return (
              <div key={item.id} className="card">
                {/* Header row */}
                <div className="flex items-start gap-3">
                  {/* Source badge */}
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: sourceColor(item.sourceType), color: "#fff" }}
                  >
                    {sourceIcon(item.sourceType)}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:underline"
                      style={{ color: "var(--text-primary)", textDecoration: "none" }}
                    >
                      {item.title}
                    </a>

                    {/* Meta row */}
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                        {item.source}
                      </span>
                      {item.timeAgo && (
                        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                          {item.timeAgo}
                        </span>
                      )}
                      {item.engagement > 0 && (
                        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                          {item.engagement} upvotes
                        </span>
                      )}
                      {item.comments > 0 && (
                        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                          {item.comments} comments
                        </span>
                      )}
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{
                          background: item.relevanceScore >= 80 ? "var(--accent-emerald-muted)" : item.relevanceScore >= 60 ? "var(--accent-amber-muted)" : "var(--bg-tertiary)",
                          color: item.relevanceScore >= 80 ? "var(--accent-emerald)" : item.relevanceScore >= 60 ? "var(--accent-amber)" : "var(--text-tertiary)",
                        }}
                      >
                        {item.relevanceScore}% match
                      </span>
                    </div>

                    {/* Summary (truncated) */}
                    {item.summary && item.summary !== "Discussion thread" && (
                      <p
                        className="text-xs mt-2 leading-relaxed"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {item.summary.length > 200 && !isExpanded
                          ? item.summary.substring(0, 200) + "..."
                          : item.summary}
                      </p>
                    )}
                  </div>
                </div>

                {/* Engagement suggestion */}
                {item.engagementSuggestion && (
                  <div className="mt-3">
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="text-xs font-medium flex items-center gap-1"
                      style={{ color: "var(--accent-blue)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      <svg
                        width="12" height="12" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                      {isExpanded ? "Hide suggestion" : "How to engage"}
                    </button>

                    {isExpanded && (
                      <div
                        className="mt-2 rounded-lg p-3 text-xs leading-relaxed"
                        style={{
                          background: "var(--accent-blue-muted)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--accent-blue)",
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <span style={{ color: "var(--accent-blue)" }}>AI:</span>
                          <span>{item.engagementSuggestion}</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => navigator.clipboard.writeText(item.engagementSuggestion)}
                            className="text-[10px] font-medium px-2 py-1 rounded"
                            style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border-primary)" }}
                          >
                            Copy
                          </button>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-medium px-2 py-1 rounded no-underline"
                            style={{ background: "var(--accent-blue)", color: "#fff" }}
                          >
                            Open & Engage
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Empty States ───────────────────────────────────── */}
      {!feedLoading && topics.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-12">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-tertiary)", marginBottom: 12 }}>
            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Add your first topic to get started
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
            e.g. "3D printing", "resin printing", "FDM printers"
          </p>
        </div>
      )}

      {!feedLoading && topics.length > 0 && items.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-12">
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            No items found. Try different topics or refresh the feed.
          </p>
        </div>
      )}
    </div>
  );
}
