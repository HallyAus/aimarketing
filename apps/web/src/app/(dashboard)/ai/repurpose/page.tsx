"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";

const OUTPUT_FORMATS = [
  { id: "facebook", label: "Facebook Post", platform: "Facebook" },
  { id: "instagram", label: "Instagram Caption", platform: "Instagram" },
  { id: "linkedin", label: "LinkedIn Post", platform: "LinkedIn" },
  { id: "twitter", label: "Twitter/X Post", platform: "Twitter/X" },
  { id: "email", label: "Email Newsletter", platform: "Email" },
  { id: "thread", label: "Twitter Thread", platform: "Twitter/X" },
  { id: "linkedin-article", label: "LinkedIn Article", platform: "LinkedIn" },
  { id: "carousel", label: "Carousel Captions", platform: "Instagram" },
];

interface RepurposeItem {
  content: string;
  title?: string;
}

interface RepurposeResult {
  format: string;
  platform?: string;
  items: RepurposeItem[];
}

export default function ContentRepurposePage() {
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [selectedFormats, setSelectedFormats] = useState<string[]>(["facebook", "twitter", "linkedin"]);
  const [variationsPerFormat, setVariationsPerFormat] = useState(2);
  const [results, setResults] = useState<RepurposeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null);

  function toggleFormat(id: string) {
    setSelectedFormats((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }

  async function handleRepurpose() {
    if (!content.trim() && !url.trim()) return;
    if (selectedFormats.length === 0) return;

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const res = await fetch("/api/ai/repurpose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content || "See URL",
          url: url || undefined,
          formats: selectedFormats,
          variationsPerFormat,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Repurpose failed");
      setResults(data.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
    setLoading(false);
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(key);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  function scheduleAll() {
    alert("Schedule All: This will create draft posts for all generated content. (Coming soon with full scheduling integration)");
  }

  const formatLabel = (id: string) => OUTPUT_FORMATS.find((f) => f.id === id)?.label ?? id;

  return (
    <div>
      <PageHeader
        title="Content Repurposer"
        subtitle="Transform one piece of content into multiple formats for every platform."
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "AI Studio", href: "/ai" },
          { label: "Repurpose" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Input */}
        <div className="lg:col-span-2 space-y-5">
          {/* URL input */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              URL (optional)
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourblog.com/article-to-repurpose"
              className="w-full rounded-md px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
              Paste a URL to auto-extract content, or type/paste content below.
            </p>
          </div>

          {/* Content input */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Source Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder="Paste your blog post, article, or any content here..."
              className="w-full rounded-md px-3 py-2 text-sm"
            />
          </div>

          {/* Format selection */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Output Formats
            </label>
            <div className="flex flex-wrap gap-2">
              {OUTPUT_FORMATS.map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => toggleFormat(fmt.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    selectedFormats.includes(fmt.id)
                      ? "bg-[var(--accent-blue-muted)] text-[var(--accent-blue)] border-[var(--accent-blue)]"
                      : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Variations */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Variations per Format
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setVariationsPerFormat(n)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    variationsPerFormat === n
                      ? "bg-[var(--accent-blue-muted)] text-[var(--accent-blue)] border-[var(--accent-blue)]"
                      : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleRepurpose}
            disabled={loading || (!content.trim() && !url.trim()) || selectedFormats.length === 0}
            className="btn-primary text-sm disabled:opacity-50 min-h-[44px] w-full"
          >
            {loading ? "Repurposing Content..." : "Repurpose Content"}
          </button>

          {error && (
            <div className="alert alert-error">{error}</div>
          )}
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-3">
          {results.length === 0 && !loading && (
            <div
              className="rounded-lg p-8 flex flex-col items-center justify-center min-h-[400px]"
              style={{
                border: "1px solid var(--border-primary)",
                background: "var(--bg-secondary)",
              }}
            >
              <svg className="w-10 h-10 mb-3" style={{ color: "var(--text-tertiary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Repurposed content will appear here organized by format.
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
                AI is repurposing your content into {selectedFormats.length} formats...
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-4">
              {/* Schedule All button */}
              <div className="flex justify-end">
                <button onClick={scheduleAll} className="btn-primary text-sm">
                  Schedule All
                </button>
              </div>

              {results.map((result, rIdx) => (
                <div
                  key={rIdx}
                  className="rounded-lg overflow-hidden"
                  style={{
                    border: "1px solid var(--border-primary)",
                    background: "var(--bg-secondary)",
                  }}
                >
                  {/* Format header */}
                  <div
                    className="px-4 py-3 flex items-center justify-between"
                    style={{
                      borderBottom: "1px solid var(--border-secondary)",
                      background: "var(--bg-tertiary)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="badge badge-info">{formatLabel(result.format)}</span>
                      {result.platform && (
                        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                          {result.platform}
                        </span>
                      )}
                    </div>
                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {result.items.length} variation{result.items.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="divide-y" style={{ borderColor: "var(--border-secondary)" }}>
                    {result.items.map((item, iIdx) => {
                      const key = `${rIdx}-${iIdx}`;
                      return (
                        <div key={iIdx} className="p-4">
                          {item.title && (
                            <h4 className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                              {item.title}
                            </h4>
                          )}
                          <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
                            {item.content}
                          </p>
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => copyToClipboard(item.content, key)}
                              className="btn-ghost text-xs"
                            >
                              {copiedIdx === key ? "Copied!" : "Copy"}
                            </button>
                            <button
                              onClick={() => alert("Schedule post: Coming soon with full scheduling integration")}
                              className="btn-ghost text-xs"
                            >
                              Schedule
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
