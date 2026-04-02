"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";

interface SentimentResult {
  positive: number;
  neutral: number;
  negative: number;
  trend: { date: string; positive: number; neutral: number; negative: number }[];
  recommendations: string[];
  postBreakdown: { id: string; content: string; sentiment: string; score: number }[];
}

const SENTIMENT_COLORS = {
  positive: "var(--accent-emerald)",
  neutral: "var(--accent-amber)",
  negative: "var(--accent-red)",
};

function PieChart({ positive, neutral, negative }: { positive: number; neutral: number; negative: number }) {
  const total = positive + neutral + negative;
  if (total === 0) return null;

  const pPct = (positive / total) * 100;
  const nPct = (neutral / total) * 100;
  // negative is the remainder

  // Using conic-gradient for a simple pie chart
  const gradient = `conic-gradient(
    ${SENTIMENT_COLORS.positive} 0% ${pPct}%,
    ${SENTIMENT_COLORS.neutral} ${pPct}% ${pPct + nPct}%,
    ${SENTIMENT_COLORS.negative} ${pPct + nPct}% 100%
  )`;

  return (
    <div className="flex items-center gap-6">
      <div
        className="w-32 h-32 rounded-full flex-shrink-0"
        style={{ background: gradient }}
      />
      <div className="space-y-2">
        {[
          { label: "Positive", value: positive, color: SENTIMENT_COLORS.positive, pct: pPct },
          { label: "Neutral", value: neutral, color: SENTIMENT_COLORS.neutral, pct: nPct },
          { label: "Negative", value: negative, color: SENTIMENT_COLORS.negative, pct: 100 - pPct - nPct },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {item.label}: {item.value} ({item.pct.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendBars({ trend }: { trend: SentimentResult["trend"] }) {
  if (trend.length === 0) return null;

  return (
    <div className="space-y-2">
      {trend.map((t) => {
        const total = t.positive + t.neutral + t.negative;
        if (total === 0) return null;
        return (
          <div key={t.date} className="flex items-center gap-3">
            <span className="text-xs w-20 flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>
              {t.date}
            </span>
            <div className="flex-1 flex h-5 rounded-md overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
              <div
                className="h-full transition-all"
                style={{
                  width: `${(t.positive / total) * 100}%`,
                  background: SENTIMENT_COLORS.positive,
                }}
              />
              <div
                className="h-full transition-all"
                style={{
                  width: `${(t.neutral / total) * 100}%`,
                  background: SENTIMENT_COLORS.neutral,
                }}
              />
              <div
                className="h-full transition-all"
                style={{
                  width: `${(t.negative / total) * 100}%`,
                  background: SENTIMENT_COLORS.negative,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SentimentPage() {
  const [data, setData] = useState<SentimentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSentiment();
  }, []);

  async function fetchSentiment() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/analytics/sentiment");
      if (!res.ok) throw new Error("Failed to analyze sentiment");
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <PageHeader
        title="Sentiment Analysis"
        subtitle="AI-powered analysis of your post content sentiment over time"
        breadcrumbs={[
          { label: "Analytics", href: "/analytics" },
          { label: "Sentiment" },
        ]}
        action={
          <button onClick={fetchSentiment} className="btn-secondary" disabled={loading}>
            {loading ? "Analyzing..." : "Re-analyze"}
          </button>
        }
      />

      {error && <div className="alert alert-error mb-6">{error}</div>}

      {loading && (
        <div className="grid gap-6">
          <div className="card h-48 skeleton" />
          <div className="card h-64 skeleton" />
        </div>
      )}

      {data && !loading && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Pie Chart */}
            <div className="card">
              <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Overall Sentiment Distribution
              </h3>
              <PieChart
                positive={data.positive}
                neutral={data.neutral}
                negative={data.negative}
              />
            </div>

            {/* Summary metrics */}
            <div className="card">
              <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Sentiment Metrics
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Positive", value: data.positive, color: "emerald" },
                  { label: "Neutral", value: data.neutral, color: "amber" },
                  { label: "Negative", value: data.negative, color: "red" },
                ].map((m) => (
                  <div key={m.label} className="metric-card text-center">
                    <div className="text-2xl font-bold" style={{ color: `var(--accent-${m.color})` }}>
                      {m.value}
                    </div>
                    <div className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                      {m.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trend over time */}
          {data.trend.length > 0 && (
            <div className="card mb-6">
              <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Sentiment Trend Over Time
              </h3>
              <TrendBars trend={data.trend} />
            </div>
          )}

          {/* AI Recommendations */}
          {data.recommendations.length > 0 && (
            <div className="card mb-6" style={{ borderColor: "var(--accent-blue)", borderWidth: "1px" }}>
              <h3 className="font-semibold mb-3" style={{ color: "var(--accent-blue)" }}>
                AI Recommendations to Improve Sentiment
              </h3>
              <ul className="space-y-2">
                {data.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--accent-emerald)" }}>&#10003;</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Post breakdown */}
          {data.postBreakdown.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Post Sentiment Breakdown
              </h3>
              <div className="space-y-2">
                {data.postBreakdown.map((post) => (
                  <div key={post.id} className="table-row flex items-center gap-3 py-2 px-3 rounded-lg">
                    <span
                      className={`badge ${
                        post.sentiment === "positive"
                          ? "badge-success"
                          : post.sentiment === "negative"
                          ? "badge-error"
                          : "badge-warning"
                      }`}
                    >
                      {post.sentiment}
                    </span>
                    <p className="text-sm flex-1 truncate" style={{ color: "var(--text-secondary)" }}>
                      {post.content.slice(0, 120)}
                      {post.content.length > 120 ? "..." : ""}
                    </p>
                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {post.score}/100
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
