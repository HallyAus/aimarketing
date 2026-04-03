"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";

interface CompetitorAnalysis {
  contentThemes: string[];
  postingFrequency: string;
  toneAnalysis: string;
  topContentTypes: string[];
  engagementStrategies: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

interface CounterPost {
  platform: string;
  content: string;
  strategy: string;
}

export default function CompetitorSpyPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [counterLoading, setCounterLoading] = useState(false);
  const [analysis, setAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [counterPosts, setCounterPosts] = useState<CounterPost[]>([]);
  const [error, setError] = useState("");

  async function analyze() {
    if (!url.trim()) {
      setError("Enter a URL or social media handle");
      return;
    }
    setLoading(true);
    setError("");
    setAnalysis(null);
    setCounterPosts([]);

    try {
      const res = await fetch("/api/ai/competitor-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setAnalysis(data.analysis);
      }
    } catch {
      setError("Failed to analyze competitor");
    }
    setLoading(false);
  }

  async function generateCounterContent() {
    setCounterLoading(true);
    try {
      const res = await fetch("/api/ai/competitor-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), generateCounter: true }),
      });
      const data = await res.json();
      if (data.analysis?.counterPosts) {
        setCounterPosts(data.analysis.counterPosts);
      }
    } catch {
      setError("Failed to generate counter content");
    }
    setCounterLoading(false);
  }

  return (
    <div>
      <PageHeader
        title="Competitor Content Spy"
        subtitle="Enter a competitor URL \u2014 AI analyzes their content strategy and suggests improvements"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "AI Studio", href: "/ai" },
          { label: "Competitor Spy" },
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
              Competitor URL or Social Handle
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. https://competitor.com or @competitor"
              className="w-full rounded-md px-3 py-2 text-sm"
              onKeyDown={(e) => e.key === "Enter" && analyze()}
            />
          </div>
          <button
            onClick={analyze}
            disabled={loading}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze Competitor"}
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
              <div className="skeleton h-3 w-full rounded mb-2" />
              <div className="skeleton h-3 w-3/4 rounded mb-2" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Content Themes */}
            <div className="card">
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: "var(--text-tertiary)" }}
              >
                Content Themes
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {analysis.contentThemes.map((theme, i) => (
                  <span key={i} className="badge badge-info">
                    {theme}
                  </span>
                ))}
              </div>
            </div>

            {/* Posting Frequency */}
            <div className="card">
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: "var(--text-tertiary)" }}
              >
                Posting Frequency
              </h3>
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                {analysis.postingFrequency}
              </p>
            </div>

            {/* Tone Analysis */}
            <div className="card">
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: "var(--text-tertiary)" }}
              >
                Tone Analysis
              </h3>
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                {analysis.toneAnalysis}
              </p>
            </div>

            {/* Top Content Types */}
            <div className="card">
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: "var(--text-tertiary)" }}
              >
                Top Content Types
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {analysis.topContentTypes.map((type, i) => (
                  <span key={i} className="badge badge-purple">
                    {type}
                  </span>
                ))}
              </div>
            </div>

            {/* Engagement Strategies */}
            <div className="card">
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: "var(--text-tertiary)" }}
              >
                Engagement Strategies
              </h3>
              <ul className="space-y-1.5">
                {analysis.engagementStrategies.map((s, i) => (
                  <li
                    key={i}
                    className="text-xs flex items-start gap-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <span
                      className="mt-0.5 flex-shrink-0"
                      style={{ color: "var(--accent-blue)" }}
                    >
                      *
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="card">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3
                    className="text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: "var(--accent-emerald)" }}
                  >
                    Strengths
                  </h3>
                  <ul className="space-y-1">
                    {analysis.strengths.map((s, i) => (
                      <li
                        key={i}
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        + {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3
                    className="text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: "var(--accent-red)" }}
                  >
                    Weaknesses
                  </h3>
                  <ul className="space-y-1">
                    {analysis.weaknesses.map((w, i) => (
                      <li
                        key={i}
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        - {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="card">
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--text-tertiary)" }}
            >
              Recommendations
            </h3>
            <div className="space-y-2">
              {analysis.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: "var(--accent-blue-muted)",
                      color: "var(--accent-blue)",
                    }}
                  >
                    {i + 1}
                  </span>
                  {rec}
                </div>
              ))}
            </div>
          </div>

          {/* Generate Counter Content */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Counter-Content
              </h3>
              <button
                onClick={generateCounterContent}
                disabled={counterLoading}
                className="btn-primary text-xs disabled:opacity-50"
              >
                {counterLoading ? "Generating..." : "Generate Counter-Content"}
              </button>
            </div>

            {counterPosts.length > 0 && (
              <div className="space-y-3">
                {counterPosts.map((post, i) => (
                  <div
                    key={i}
                    className="rounded-lg px-4 py-3"
                    style={{
                      background: "var(--bg-tertiary)",
                      border: "1px solid var(--border-primary)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="badge badge-purple">
                        {post.platform}
                      </span>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(post.content)
                        }
                        className="text-xs"
                        style={{ color: "var(--accent-blue)" }}
                      >
                        Copy
                      </button>
                    </div>
                    <p
                      className="text-sm mb-2 whitespace-pre-wrap"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {post.content}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      Strategy: {post.strategy}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {counterPosts.length === 0 && !counterLoading && (
              <p
                className="text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                Click the button to generate posts that compete with this
                brand&apos;s content strategy.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
