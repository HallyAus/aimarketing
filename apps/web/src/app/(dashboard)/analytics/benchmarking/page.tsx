"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";

interface CompetitorEntry {
  url: string;
  analysis: CompetitorAnalysis | null;
  loading: boolean;
  error: string;
}

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

interface BenchmarkSummary {
  summary: string;
  recommendations: string[];
}

export default function BenchmarkingPage() {
  const [competitors, setCompetitors] = useState<CompetitorEntry[]>([
    { url: "", analysis: null, loading: false, error: "" },
  ]);
  const [aiSummary, setAiSummary] = useState<BenchmarkSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  function addCompetitor() {
    setCompetitors((prev) => [
      ...prev,
      { url: "", analysis: null, loading: false, error: "" },
    ]);
  }

  function updateUrl(index: number, url: string) {
    setCompetitors((prev) =>
      prev.map((c, i) => (i === index ? { ...c, url } : c))
    );
  }

  function removeCompetitor(index: number) {
    setCompetitors((prev) => prev.filter((_, i) => i !== index));
  }

  async function analyzeCompetitor(index: number) {
    const entry = competitors[index];
    if (!entry || !entry.url.trim()) return;

    setCompetitors((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, loading: true, error: "" } : c
      )
    );

    try {
      const res = await fetch("/api/analytics/benchmarking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: entry!.url }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Analysis failed");
      }

      const { analysis } = await res.json();
      setCompetitors((prev) =>
        prev.map((c, i) =>
          i === index ? { ...c, analysis, loading: false } : c
        )
      );
    } catch (err) {
      setCompetitors((prev) =>
        prev.map((c, i) =>
          i === index
            ? { ...c, loading: false, error: err instanceof Error ? err.message : "Failed" }
            : c
        )
      );
    }
  }

  async function analyzeAll() {
    const promises = competitors.map((c, i) => {
      if (c.url.trim() && !c.analysis) return analyzeCompetitor(i);
      return Promise.resolve();
    });
    await Promise.all(promises);
  }

  async function generateSummary() {
    const analyzed = competitors.filter((c) => c.analysis);
    if (analyzed.length === 0) return;

    setSummaryLoading(true);
    try {
      const res = await fetch("/api/analytics/benchmarking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          compareSummary: true,
          competitors: analyzed.map((c) => ({
            url: c.url,
            analysis: c.analysis,
          })),
        }),
      });

      if (!res.ok) throw new Error("Failed to generate summary");
      const data = await res.json();
      setAiSummary(data.summary);
    } catch {
      // fail silently
    } finally {
      setSummaryLoading(false);
    }
  }

  const analyzedCount = competitors.filter((c) => c.analysis).length;

  return (
    <div className="w-full">
      <PageHeader
        title="Competitor Benchmarking"
        subtitle="Compare your social media performance against competitors"
        breadcrumbs={[
          { label: "Analytics", href: "/analytics" },
          { label: "Benchmarking" },
        ]}
        action={
          <div className="flex gap-2">
            <button onClick={addCompetitor} className="btn-secondary">
              + Add Competitor
            </button>
            <button
              onClick={analyzeAll}
              className="btn-primary"
              disabled={competitors.every((c) => !c.url.trim() || c.loading)}
            >
              Analyze All
            </button>
          </div>
        }
      />

      {/* Competitor inputs */}
      <div className="space-y-3 mb-8">
        {competitors.map((entry, index) => (
          <div key={index} className="card flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1 w-full">
              <input
                type="text"
                placeholder="Enter competitor URL or social handle..."
                value={entry.url}
                onChange={(e) => updateUrl(index, e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => analyzeCompetitor(index)}
                disabled={entry.loading || !entry.url.trim()}
                className="btn-primary"
              >
                {entry.loading ? "Analyzing..." : "Analyze"}
              </button>
              {competitors.length > 1 && (
                <button
                  onClick={() => removeCompetitor(index)}
                  className="btn-danger"
                >
                  Remove
                </button>
              )}
            </div>
            {entry.error && (
              <p className="text-sm w-full" style={{ color: "var(--accent-red)" }}>
                {entry.error}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      {analyzedCount > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Side-by-Side Comparison
            </h2>
            <button
              onClick={generateSummary}
              disabled={summaryLoading || analyzedCount < 1}
              className="btn-primary"
            >
              {summaryLoading ? "Generating..." : "Generate AI Summary"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ color: "var(--text-primary)" }}>
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border-secondary)" }}>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: "var(--text-tertiary)" }}>
                    Metric
                  </th>
                  {competitors
                    .filter((c) => c.analysis)
                    .map((c, i) => (
                      <th key={i} className="text-left py-3 px-4 font-semibold">
                        {c.url}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Content Themes", key: "contentThemes" },
                  { label: "Posting Frequency", key: "postingFrequency" },
                  { label: "Tone", key: "toneAnalysis" },
                  { label: "Top Content Types", key: "topContentTypes" },
                  { label: "Strengths", key: "strengths" },
                  { label: "Weaknesses", key: "weaknesses" },
                ].map((row) => (
                  <tr key={row.key} className="table-row">
                    <td className="py-3 px-4 font-medium" style={{ color: "var(--text-secondary)" }}>
                      {row.label}
                    </td>
                    {competitors
                      .filter((c) => c.analysis)
                      .map((c, i) => {
                        const val = c.analysis![row.key as keyof CompetitorAnalysis];
                        return (
                          <td key={i} className="py-3 px-4">
                            {Array.isArray(val) ? (
                              <div className="flex flex-wrap gap-1">
                                {val.map((v, vi) => (
                                  <span key={vi} className="badge badge-info">
                                    {v}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span>{val as string}</span>
                            )}
                          </td>
                        );
                      })}
                  </tr>
                ))}
                <tr className="table-row">
                  <td className="py-3 px-4 font-medium" style={{ color: "var(--text-secondary)" }}>
                    Recommendations
                  </td>
                  {competitors
                    .filter((c) => c.analysis)
                    .map((c, i) => (
                      <td key={i} className="py-3 px-4">
                        <ul className="list-disc list-inside space-y-1" style={{ color: "var(--text-secondary)" }}>
                          {c.analysis!.recommendations.map((r, ri) => (
                            <li key={ri}>{r}</li>
                          ))}
                        </ul>
                      </td>
                    ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Summary */}
      {aiSummary && (
        <div className="card" style={{ borderColor: "var(--accent-blue)", borderWidth: "1px" }}>
          <h3 className="text-lg font-semibold mb-3" style={{ color: "var(--accent-blue)" }}>
            AI Competitive Analysis Summary
          </h3>
          <p className="mb-4 text-sm" style={{ color: "var(--text-secondary)" }}>
            {aiSummary.summary}
          </p>
          <h4 className="font-medium mb-2" style={{ color: "var(--text-primary)" }}>
            Key Recommendations
          </h4>
          <ul className="space-y-2">
            {aiSummary.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <span style={{ color: "var(--accent-emerald)" }}>&#10003;</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analyzedCount === 0 && (
        <div className="card text-center py-12">
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Enter competitor URLs or social handles above and click Analyze to get started.
          </p>
        </div>
      )}
    </div>
  );
}
