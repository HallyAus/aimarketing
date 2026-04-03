"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";

const PLATFORMS = ["FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN", "TWITTER_X", "YOUTUBE", "PINTEREST"];
const TONES = ["professional", "casual", "humorous", "urgent", "inspirational", "educational"];

export default function CompetitorMatchPage() {
  const [competitorContent, setCompetitorContent] = useState("");
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState("INSTAGRAM");
  const [tone, setTone] = useState("");
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<{
    targetAudience: string;
    sentiment: string;
    keyMessages: string[];
    cta: string;
    hooks: string[];
  } | null>(null);
  const [yourVersion, setYourVersion] = useState<{
    content: string;
    hashtags: string[];
    suggestedTime: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function analyze() {
    if (!competitorContent && !url) return;
    setLoading(true);
    setAnalysis(null);
    setYourVersion(null);
    setError("");
    try {
      const res = await fetch("/api/ai/competitor-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitorContent,
          url: url || undefined,
          platform,
          tone: tone || undefined,
          includeHashtags,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to analyze");
      setAnalysis(data.analysis);
      setYourVersion(data.yourVersion);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error analyzing content");
    }
    setLoading(false);
  }

  async function saveAsDraft() {
    if (!yourVersion) return;
    setSaving(true);
    try {
      const res = await fetch("/api/ai/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: yourVersion.content, platform }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setFeedback("Saved as draft!");
    } catch {
      setFeedback("Error saving draft");
    }
    setSaving(false);
    setTimeout(() => setFeedback(""), 3000);
  }

  async function schedulePost() {
    if (!yourVersion) return;
    setScheduling(true);
    try {
      const res = await fetch("/api/posts/auto-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drafts: [{ content: yourVersion.content, platform }] }),
      });
      if (!res.ok) throw new Error("Failed to schedule");
      const data = await res.json();
      const time = data.scheduled?.[0]?.scheduledAt;
      setFeedback(time ? `Scheduled for ${new Date(time).toLocaleString()}` : "Scheduled!");
    } catch {
      setFeedback("Error scheduling");
    }
    setScheduling(false);
    setTimeout(() => setFeedback(""), 4000);
  }

  return (
    <div>
      <PageHeader
        title="Competitor Match"
        subtitle="Paste a competitor's post — AI creates your version targeting the same audience"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "AI Studio", href: "/ai" },
          { label: "Competitor Match" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <div>
            <label htmlFor="cm-url" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Post URL (optional)</label>
            <input
              id="cm-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="cm-content" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Competitor Post Text</label>
            <textarea
              id="cm-content"
              value={competitorContent}
              onChange={(e) => setCompetitorContent(e.target.value)}
              rows={6}
              placeholder="Paste the competitor's post content here..."
              className="w-full rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cm-platform" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Platform</label>
              <select id="cm-platform" value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm">
                {PLATFORMS.map((p) => <option key={p} value={p}>{p.replaceAll("_", " ")}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="cm-tone" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Tone Override (optional)</label>
              <select id="cm-tone" value={tone} onChange={(e) => setTone(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm">
                <option value="">Auto-detect</option>
                {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm min-h-[44px]" style={{ color: "var(--text-secondary)" }}>
            <input type="checkbox" checked={includeHashtags} onChange={(e) => setIncludeHashtags(e.target.checked)} className="w-4 h-4" />
            Include hashtags in your version
          </label>
          <button
            onClick={analyze}
            disabled={loading || (!competitorContent && !url)}
            className="btn-primary text-sm disabled:opacity-50 min-h-[44px] w-full"
          >
            {loading ? "Analyzing..." : "Analyze & Generate"}
          </button>
          {error && <p className="text-sm" style={{ color: "var(--accent-red)" }}>{error}</p>}
        </div>

        {/* Results */}
        <div className="space-y-4">
          {analysis && (
            <div className="rounded-lg p-4" style={{ border: "1px solid var(--border-primary)", background: "var(--bg-secondary)" }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Competitor Analysis</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium" style={{ color: "var(--text-secondary)" }}>Target Audience:</span> <span style={{ color: "var(--text-primary)" }}>{analysis.targetAudience}</span></div>
                <div><span className="font-medium" style={{ color: "var(--text-secondary)" }}>Sentiment:</span> <span style={{ color: "var(--text-primary)" }}>{analysis.sentiment}</span></div>
                <div><span className="font-medium" style={{ color: "var(--text-secondary)" }}>CTA Strategy:</span> <span style={{ color: "var(--text-primary)" }}>{analysis.cta}</span></div>
                <div>
                  <span className="font-medium" style={{ color: "var(--text-secondary)" }}>Key Messages:</span>
                  <ul className="list-disc ml-5 mt-1" style={{ color: "var(--text-primary)" }}>
                    {analysis.keyMessages.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                </div>
                <div>
                  <span className="font-medium" style={{ color: "var(--text-secondary)" }}>Engagement Hooks:</span>
                  <ul className="list-disc ml-5 mt-1" style={{ color: "var(--text-primary)" }}>
                    {analysis.hooks.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {yourVersion && (
            <div className="rounded-lg p-4" style={{ border: "1px solid var(--accent-blue)", background: "var(--bg-secondary)" }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--accent-blue)" }}>Your Version</h3>
              <div className="whitespace-pre-wrap text-sm mb-3" style={{ color: "var(--text-primary)" }}>
                {yourVersion.content}
              </div>
              {yourVersion.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {yourVersion.hashtags.map((h, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg-tertiary)", color: "var(--accent-blue)" }}>{h}</span>
                  ))}
                </div>
              )}
              {yourVersion.suggestedTime && (
                <p className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>Suggested posting time: {yourVersion.suggestedTime}</p>
              )}
              <div className="flex flex-wrap gap-2 items-center">
                <button onClick={() => navigator.clipboard.writeText(yourVersion.content)} className="text-sm" style={{ color: "var(--accent-blue)" }}>Copy</button>
                <button onClick={saveAsDraft} disabled={saving} className="btn-secondary text-xs">{saving ? "Saving..." : "Save as Draft"}</button>
                <button onClick={schedulePost} disabled={scheduling} className="btn-secondary text-xs">{scheduling ? "Scheduling..." : "Schedule"}</button>
                {feedback && <span className="text-xs font-medium" style={{ color: "var(--accent-emerald)" }}>{feedback}</span>}
              </div>
            </div>
          )}

          {!analysis && !loading && (
            <div className="rounded-lg p-8 text-center" style={{ border: "1px solid var(--border-primary)", background: "var(--bg-secondary)" }}>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Paste a competitor post or enter a URL to analyze their strategy and generate your original version.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
