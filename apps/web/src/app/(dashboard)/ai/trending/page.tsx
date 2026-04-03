"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { CacheStatus } from "@/components/cache-status";

interface TrendingTopic {
  title: string;
  description: string;
  relevance: string;
  suggestedAngle: string;
  hashtags: string[];
}

interface TrendingResult {
  topics: TrendingTopic[];
  _cached?: boolean;
  _generatedAt?: string;
  _rateLimited?: boolean;
}

export default function TrendingTopicsPage() {
  const router = useRouter();
  const [niche, setNiche] = useState("");
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [result, setResult] = useState<TrendingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchTrends(regenerate = false) {
    if (!niche.trim()) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/trending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: niche.trim(), ...(regenerate && { regenerate: true }) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch trends");
      }
      const data: TrendingResult = await res.json();
      setResult(data);
      setTopics(data.topics || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  function createPostFromTopic(topic: TrendingTopic) {
    // Navigate to AI studio with the topic pre-filled
    const params = new URLSearchParams({
      topic: `${topic.title}: ${topic.suggestedAngle}`,
      hashtags: topic.hashtags.join(","),
    });
    router.push(`/ai?${params.toString()}`);
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Trending Topics"
        subtitle="Enter your industry — AI shows what topics are trending right now"
        breadcrumbs={[
          { label: "AI Studio", href: "/ai" },
          { label: "Trending Topics" },
        ]}
      />

      <CacheStatus
        cached={result?._cached}
        generatedAt={result?._generatedAt}
        rateLimited={result?._rateLimited}
        onRegenerate={() => fetchTrends(true)}
        loading={loading}
      />

      {/* Input */}
      <div className="card mb-8">
        <label className="section-label block mb-2">Your Industry / Niche</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchTrends()}
            placeholder="e.g., SaaS, fitness, e-commerce, real estate..."
            className="flex-1"
          />
          <button
            onClick={() => fetchTrends()}
            disabled={loading || !niche.trim()}
            className="btn-primary"
          >
            {loading ? "Finding Trends..." : "Find Trends"}
          </button>
          {topics.length > 0 && (
            <button onClick={() => fetchTrends(true)} className="btn-secondary" disabled={loading}>
              Refresh
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error mb-6">{error}</div>}

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card h-32 skeleton" />
          ))}
        </div>
      )}

      {/* Topics */}
      {!loading && topics.length > 0 && (
        <div className="space-y-4">
          {topics.map((topic, i) => (
            <div key={i} className="card card-hover">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{ background: "var(--accent-amber-muted)", color: "var(--accent-amber)" }}
                    >
                      #{i + 1} TRENDING
                    </span>
                    <span className="badge badge-info">{topic.relevance}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                    {topic.title}
                  </h3>
                  <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                    {topic.description}
                  </p>
                  <div className="mb-3">
                    <p className="text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>
                      Suggested Angle
                    </p>
                    <p className="text-sm" style={{ color: "var(--accent-blue)" }}>
                      {topic.suggestedAngle}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {topic.hashtags.map((tag) => (
                      <span key={tag} className="badge badge-neutral">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => createPostFromTopic(topic)}
                  className="btn-primary flex-shrink-0"
                >
                  Create Post
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && topics.length === 0 && !error && (
        <div className="card text-center py-16">
          <div
            className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: "var(--accent-amber-muted)", color: "var(--accent-amber)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <h3 className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>
            Discover Trending Topics
          </h3>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Enter your industry or niche above and we'll find the latest trending topics for content creation.
          </p>
        </div>
      )}
    </div>
  );
}
