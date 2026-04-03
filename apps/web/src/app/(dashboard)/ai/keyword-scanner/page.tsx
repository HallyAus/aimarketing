"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";

interface KeywordData {
  yourKeywords: string[];
  competitorKeywords: string[];
  gaps: Array<{ keyword: string; difficulty: string; recommendation: string }>;
  overlap: string[];
  recommendations: Array<{ title: string; description: string; targetKeyword: string }>;
}

export default function KeywordScannerPage() {
  const router = useRouter();
  const [yourUrl, setYourUrl] = useState("");
  const [competitorUrls, setCompetitorUrls] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<KeywordData | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"yours" | "competitors" | "gaps" | "recommendations">("gaps");

  function addCompetitorUrl() {
    if (competitorUrls.length < 3) setCompetitorUrls([...competitorUrls, ""]);
  }

  function removeCompetitorUrl(idx: number) {
    setCompetitorUrls(competitorUrls.filter((_, i) => i !== idx));
  }

  function updateCompetitorUrl(idx: number, val: string) {
    const copy = [...competitorUrls];
    copy[idx] = val;
    setCompetitorUrls(copy);
  }

  async function scan() {
    if (!yourUrl) return;
    const validCompetitorUrls = competitorUrls.filter((u) => u.trim());
    if (!validCompetitorUrls.length) return;
    setLoading(true);
    setData(null);
    setError("");
    try {
      const res = await fetch("/api/ai/keyword-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yourUrl, competitorUrls: validCompetitorUrls }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Scan failed");
      setData(result);
      setActiveTab("gaps");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error scanning");
    }
    setLoading(false);
  }

  function generateForGap(keyword: string) {
    router.push(`/ai?topic=${encodeURIComponent(keyword)}`);
  }

  const tabs = [
    { id: "yours" as const, label: "Your Keywords" },
    { id: "competitors" as const, label: "Competitor Keywords" },
    { id: "gaps" as const, label: "Gaps" },
    { id: "recommendations" as const, label: "Recommendations" },
  ];

  return (
    <div>
      <PageHeader
        title="Keyword Scanner"
        subtitle="Enter your URL and competitor URLs \— AI finds keyword gaps and content opportunities"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "AI Studio", href: "/ai" },
          { label: "Keyword Scanner" },
        ]}
      />

      {/* Input */}
      <div className="rounded-lg p-5 mb-6" style={{ border: "1px solid var(--border-primary)", background: "var(--bg-secondary)" }}>
        <div className="space-y-4">
          <div>
            <label htmlFor="ks-your-url" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Your Website URL</label>
            <input
              id="ks-your-url"
              value={yourUrl}
              onChange={(e) => setYourUrl(e.target.value)}
              placeholder="https://yourwebsite.com"
              className="w-full rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Competitor URLs (up to 3)</label>
            {competitorUrls.map((u, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  value={u}
                  onChange={(e) => updateCompetitorUrl(i, e.target.value)}
                  placeholder={`https://competitor${i + 1}.com`}
                  className="flex-1 rounded-md px-3 py-2 text-sm"
                />
                {competitorUrls.length > 1 && (
                  <button onClick={() => removeCompetitorUrl(i)} className="text-sm px-2 min-h-[44px]" style={{ color: "var(--accent-red)" }}>Remove</button>
                )}
              </div>
            ))}
            {competitorUrls.length < 3 && (
              <button onClick={addCompetitorUrl} className="text-sm" style={{ color: "var(--accent-blue)" }}>+ Add competitor URL</button>
            )}
          </div>
          <button
            onClick={scan}
            disabled={loading || !yourUrl || !competitorUrls.some((u) => u.trim())}
            className="btn-primary text-sm disabled:opacity-50 min-h-[44px]"
          >
            {loading ? "Scanning..." : "Scan Keywords"}
          </button>
          {error && <p className="text-sm" style={{ color: "var(--accent-red)" }}>{error}</p>}
        </div>
      </div>

      {/* Results */}
      {data && (
        <div>
          <div className="tab-bar mb-4 overflow-x-auto" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`tab-item ${activeTab === tab.id ? "tab-item-active" : ""}`}
              >
                {tab.label}
                {tab.id === "gaps" && ` (${data.gaps.length})`}
              </button>
            ))}
          </div>

          <div className="rounded-lg p-4" style={{ border: "1px solid var(--border-primary)", background: "var(--bg-secondary)" }}>
            {activeTab === "yours" && (
              <div className="flex flex-wrap gap-2">
                {data.yourKeywords.map((kw, i) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-full" style={{ background: "var(--bg-tertiary)", color: "var(--accent-emerald)" }}>{kw}</span>
                ))}
                {!data.yourKeywords.length && <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No keywords found.</p>}
              </div>
            )}

            {activeTab === "competitors" && (
              <div className="flex flex-wrap gap-2">
                {data.competitorKeywords.map((kw, i) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-full" style={{ background: "var(--bg-tertiary)", color: "var(--accent-blue)" }}>{kw}</span>
                ))}
                {!data.competitorKeywords.length && <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No keywords found.</p>}
              </div>
            )}

            {activeTab === "gaps" && (
              <div className="space-y-3">
                {data.gaps.map((gap, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--bg-tertiary)" }}>
                    <div className="flex-1">
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{gap.keyword}</span>
                      <div className="flex gap-3 mt-1">
                        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Difficulty: {gap.difficulty}</span>
                        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{gap.recommendation}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => generateForGap(gap.keyword)}
                      className="btn-secondary text-xs ml-3 whitespace-nowrap"
                    >
                      Generate Content
                    </button>
                  </div>
                ))}
                {!data.gaps.length && <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No keyword gaps found.</p>}
              </div>
            )}

            {activeTab === "recommendations" && (
              <div className="space-y-3">
                {data.recommendations.map((rec, i) => (
                  <div key={i} className="p-3 rounded-lg" style={{ background: "var(--bg-tertiary)" }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{rec.title}</h4>
                        <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{rec.description}</p>
                        <span className="text-xs mt-1 inline-block" style={{ color: "var(--accent-blue)" }}>Target: {rec.targetKeyword}</span>
                      </div>
                      <button
                        onClick={() => generateForGap(rec.targetKeyword)}
                        className="btn-secondary text-xs ml-3 whitespace-nowrap"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                ))}
                {!data.recommendations.length && <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No recommendations.</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
