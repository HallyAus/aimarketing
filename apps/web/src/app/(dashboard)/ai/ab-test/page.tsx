"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";

const PLATFORMS = [
  { id: "FACEBOOK", label: "Facebook" },
  { id: "INSTAGRAM", label: "Instagram" },
  { id: "LINKEDIN", label: "LinkedIn" },
  { id: "TWITTER_X", label: "Twitter/X" },
  { id: "TIKTOK", label: "TikTok" },
];

interface Variant {
  content: string;
  strategy: string;
  changes: string[];
}

export default function ABTestPage() {
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState("INSTAGRAM");
  const [numVariants, setNumVariants] = useState(3);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<Set<number>>(new Set());

  async function handleGenerate() {
    if (!content.trim()) return;

    setLoading(true);
    setError("");
    setVariants([]);
    setSelectedVariants(new Set());

    try {
      const res = await fetch("/api/ai/ab-variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, platform, numVariants }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setVariants(data.variants ?? []);
      // Select all by default
      setSelectedVariants(new Set(data.variants?.map((_: Variant, i: number) => i) ?? []));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
    setLoading(false);
  }

  function toggleVariant(idx: number) {
    setSelectedVariants((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function copyToClipboard(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  function launchABTest() {
    const selected = variants.filter((_, i) => selectedVariants.has(i));
    alert(
      `Launching A/B Test with ${selected.length} variants.\n\nVariants will be scheduled at different times to measure performance.\n\n(Full analytics tracking coming soon)`
    );
  }

  const platformLabel = PLATFORMS.find((p) => p.id === platform)?.label ?? platform;

  return (
    <div>
      <PageHeader
        title="A/B Post Variants"
        subtitle="Generate and test multiple variations of your post to find what performs best."
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "AI Studio", href: "/ai" },
          { label: "A/B Test" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input form */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Original Post Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="Paste your original post content here..."
              className="w-full rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm"
            >
              {PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Number of Variants
            </label>
            <div className="flex gap-2">
              {[2, 3, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNumVariants(n)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    numVariants === n
                      ? "bg-[var(--accent-blue-muted)] text-[var(--accent-blue)] border-[var(--accent-blue)]"
                      : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  {n} Variants
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !content.trim()}
            className="btn-primary text-sm disabled:opacity-50 min-h-[44px] w-full"
          >
            {loading ? "Generating Variants..." : "Generate A/B Variants"}
          </button>

          {error && <div className="alert alert-error">{error}</div>}
        </div>

        {/* Right: Variants comparison */}
        <div className="lg:col-span-2">
          {variants.length === 0 && !loading && (
            <div
              className="rounded-lg p-8 flex flex-col items-center justify-center min-h-[400px]"
              style={{
                border: "1px solid var(--border-primary)",
                background: "var(--bg-secondary)",
              }}
            >
              <svg className="w-10 h-10 mb-3" style={{ color: "var(--text-tertiary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                A/B test variants will appear here in a side-by-side view.
              </p>
            </div>
          )}

          {loading && (
            <div
              className="rounded-lg p-8 flex flex-col items-center justify-center min-h-[400px]"
              style={{
                border: "1px solid var(--border-primary)",
                background: "var(--bg-secondary)",
              }}
            >
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-3" style={{ borderColor: "var(--accent-blue)", borderTopColor: "transparent" }} />
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Generating {numVariants} variants for {platformLabel}...
              </p>
            </div>
          )}

          {variants.length > 0 && (
            <div className="space-y-4">
              {/* Launch button */}
              <div className="flex items-center justify-between">
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {selectedVariants.size} of {variants.length} variants selected
                </p>
                <button
                  onClick={launchABTest}
                  disabled={selectedVariants.size < 2}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  Launch A/B Test
                </button>
              </div>

              {/* Original post */}
              <div
                className="rounded-lg p-4"
                style={{
                  border: "1px solid var(--border-primary)",
                  background: "var(--bg-secondary)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge badge-neutral">Original</span>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{platformLabel}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
                  {content}
                </p>
              </div>

              {/* Variant cards */}
              <div className={`grid gap-4 ${variants.length <= 3 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-" + Math.min(variants.length, 3) : "grid-cols-1 md:grid-cols-2"}`}>
                {variants.map((variant, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg overflow-hidden transition-colors"
                    style={{
                      border: selectedVariants.has(idx)
                        ? "2px solid var(--accent-blue)"
                        : "1px solid var(--border-primary)",
                      background: "var(--bg-secondary)",
                    }}
                  >
                    {/* Variant header */}
                    <div
                      className="px-4 py-3 flex items-center justify-between"
                      style={{
                        borderBottom: "1px solid var(--border-secondary)",
                        background: "var(--bg-tertiary)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedVariants.has(idx)}
                            onChange={() => toggleVariant(idx)}
                            className="rounded"
                          />
                          <span className="badge badge-purple">Variant {String.fromCharCode(65 + idx)}</span>
                        </label>
                      </div>
                      <span className="text-xs font-medium" style={{ color: "var(--accent-blue)" }}>
                        {variant.strategy}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <p className="text-sm whitespace-pre-wrap mb-3" style={{ color: "var(--text-secondary)" }}>
                        {variant.content}
                      </p>

                      {/* Changes list */}
                      {variant.changes.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Changes:</p>
                          <ul className="space-y-0.5">
                            {variant.changes.map((change, cIdx) => (
                              <li key={cIdx} className="text-xs flex items-start gap-1.5" style={{ color: "var(--text-tertiary)" }}>
                                <span style={{ color: "var(--accent-emerald)" }}>+</span>
                                {change}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(variant.content, idx)}
                          className="btn-ghost text-xs"
                        >
                          {copiedIdx === idx ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Performance tracking placeholder */}
              <div
                className="rounded-lg p-4"
                style={{
                  border: "1px dashed var(--border-primary)",
                  background: "var(--bg-tertiary)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4" style={{ color: "var(--accent-amber)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    Performance Tracking
                  </span>
                </div>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  After launching the A/B test, performance metrics (engagement, clicks, reach) will be tracked here automatically. Analytics integration coming soon.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
