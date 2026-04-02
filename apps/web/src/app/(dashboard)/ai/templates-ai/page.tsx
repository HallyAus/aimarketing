"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";

const TEMPLATE_CATEGORIES = [
  { id: "product-launch", label: "Product Launch", icon: "M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z", description: "Announce a new product or feature" },
  { id: "behind-the-scenes", label: "Behind the Scenes", icon: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z", description: "Show your process and team" },
  { id: "tutorial", label: "Tutorial", icon: "M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5", description: "Teach something step by step" },
  { id: "testimonial", label: "Testimonial", icon: "M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z", description: "Share customer success stories" },
  { id: "promotion", label: "Promotion", icon: "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z M6 6h.008v.008H6V6z", description: "Announce deals and offers" },
  { id: "qa", label: "Q&A", icon: "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z", description: "Answer common questions" },
  { id: "poll", label: "Poll", icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z", description: "Engage with interactive polls" },
  { id: "before-after", label: "Before/After", icon: "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5", description: "Show transformations" },
];

const STORY_PLATFORMS = [
  { id: "instagram-stories", label: "Instagram Stories" },
  { id: "facebook-stories", label: "Facebook Stories" },
  { id: "tiktok", label: "TikTok" },
  { id: "reels", label: "Reels" },
];

interface TemplateResult {
  textOverlay: string;
  caption: string;
  hashtags: string[];
  musicSuggestion: string;
  tips: string[];
}

export default function StoryTemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("instagram-stories");
  const [result, setResult] = useState<TemplateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [success, setSuccess] = useState("");

  async function handleGenerate() {
    if (!selectedCategory || !topic.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/ai/story-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory,
          topic,
          platform,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
    setLoading(false);
  }

  function copyText(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  async function useTemplate() {
    if (!result) return;
    setSavingDraft(true);
    setError("");
    try {
      const fullContent = `${result.textOverlay}\n\n${result.caption}\n\n${result.hashtags.map((h) => `#${h}`).join(" ")}`;
      const platformMap: Record<string, string> = {
        "instagram-stories": "INSTAGRAM",
        "facebook-stories": "FACEBOOK",
        tiktok: "TIKTOK",
        reels: "INSTAGRAM",
      };
      const res = await fetch("/api/ai/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posts: [{
            content: fullContent,
            platform: platformMap[platform] ?? "INSTAGRAM",
          }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save draft");
      setSuccess("Draft post created successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft");
    }
    setSavingDraft(false);
  }

  const categoryInfo = TEMPLATE_CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <div>
      <PageHeader
        title="Story & Reel Templates"
        subtitle="Pre-built templates for creating engaging Stories, Reels, and short-form content."
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "AI Studio", href: "/ai" },
          { label: "Templates" },
        ]}
      />

      {/* Template Categories Grid */}
      {!selectedCategory && (
        <div>
          <h3 className="text-sm font-medium mb-4" style={{ color: "var(--text-secondary)" }}>
            Choose a Template Category
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="card card-hover text-left p-5 group"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--accent-blue-muted)" }}
                  >
                    <svg className="w-5 h-5" style={{ color: "var(--accent-blue)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={cat.icon} />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1 group-hover:text-[var(--accent-blue)] transition-colors" style={{ color: "var(--text-primary)" }}>
                      {cat.label}
                    </h4>
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {cat.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Template Form & Results */}
      {selectedCategory && (
        <div>
          {/* Back button */}
          <button
            onClick={() => {
              setSelectedCategory(null);
              setResult(null);
              setError("");
            }}
            className="btn-ghost text-sm mb-4"
          >
            &larr; Back to Templates
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Form */}
            <div className="space-y-5">
              {/* Category info */}
              <div
                className="rounded-lg p-4 flex items-center gap-3"
                style={{
                  background: "var(--accent-blue-muted)",
                  border: "1px solid var(--accent-blue)",
                }}
              >
                <svg className="w-6 h-6" style={{ color: "var(--accent-blue)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={categoryInfo?.icon ?? ""} />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: "var(--accent-blue)" }}>
                    {categoryInfo?.label}
                  </h3>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {categoryInfo?.description}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Product / Topic Details
                </label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={4}
                  placeholder="Describe your product, topic, or what the story is about..."
                  className="w-full rounded-md px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Platform
                </label>
                <div className="flex flex-wrap gap-2">
                  {STORY_PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlatform(p.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        platform === p.id
                          ? "bg-[var(--accent-blue-muted)] text-[var(--accent-blue)] border-[var(--accent-blue)]"
                          : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:bg-[var(--bg-hover)]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !topic.trim()}
                className="btn-primary text-sm disabled:opacity-50 min-h-[44px] w-full"
              >
                {loading ? "Generating Template..." : "Generate Content"}
              </button>

              {error && <div className="alert alert-error">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
            </div>

            {/* Right: Result */}
            <div>
              {!result && !loading && (
                <div
                  className="rounded-lg p-8 flex flex-col items-center justify-center min-h-[400px]"
                  style={{
                    border: "1px solid var(--border-primary)",
                    background: "var(--bg-secondary)",
                  }}
                >
                  <svg className="w-10 h-10 mb-3" style={{ color: "var(--text-tertiary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" />
                  </svg>
                  <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                    Generated template content will appear here.
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
                    Creating {categoryInfo?.label} template content...
                  </p>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  {/* Text Overlay */}
                  <div
                    className="rounded-lg overflow-hidden"
                    style={{
                      border: "1px solid var(--border-primary)",
                      background: "var(--bg-secondary)",
                    }}
                  >
                    <div
                      className="px-4 py-3 flex items-center justify-between"
                      style={{
                        borderBottom: "1px solid var(--border-secondary)",
                        background: "var(--bg-tertiary)",
                      }}
                    >
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Text Overlay</span>
                      <button
                        onClick={() => copyText(result.textOverlay, "overlay")}
                        className="btn-ghost text-xs"
                      >
                        {copiedField === "overlay" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    {/* Visual preview */}
                    <div
                      className="mx-4 my-4 rounded-lg p-6 flex items-center justify-center min-h-[200px] text-center"
                      style={{
                        background: "linear-gradient(135deg, var(--accent-purple), var(--accent-blue))",
                      }}
                    >
                      <p className="text-lg font-bold" style={{ color: "white" }}>
                        {result.textOverlay}
                      </p>
                    </div>
                  </div>

                  {/* Caption */}
                  <div
                    className="rounded-lg overflow-hidden"
                    style={{
                      border: "1px solid var(--border-primary)",
                      background: "var(--bg-secondary)",
                    }}
                  >
                    <div
                      className="px-4 py-3 flex items-center justify-between"
                      style={{
                        borderBottom: "1px solid var(--border-secondary)",
                        background: "var(--bg-tertiary)",
                      }}
                    >
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Caption</span>
                      <button
                        onClick={() => copyText(result.caption, "caption")}
                        className="btn-ghost text-xs"
                      >
                        {copiedField === "caption" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <div className="p-4">
                      <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
                        {result.caption}
                      </p>
                    </div>
                  </div>

                  {/* Hashtags */}
                  <div
                    className="rounded-lg overflow-hidden"
                    style={{
                      border: "1px solid var(--border-primary)",
                      background: "var(--bg-secondary)",
                    }}
                  >
                    <div
                      className="px-4 py-3 flex items-center justify-between"
                      style={{
                        borderBottom: "1px solid var(--border-secondary)",
                        background: "var(--bg-tertiary)",
                      }}
                    >
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Hashtags</span>
                      <button
                        onClick={() => copyText(result.hashtags.map((h) => `#${h}`).join(" "), "hashtags")}
                        className="btn-ghost text-xs"
                      >
                        {copiedField === "hashtags" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <div className="p-4 flex flex-wrap gap-2">
                      {result.hashtags.map((tag, i) => (
                        <span key={i} className="badge badge-info">#{tag}</span>
                      ))}
                    </div>
                  </div>

                  {/* Music Suggestion */}
                  <div
                    className="rounded-lg p-4"
                    style={{
                      border: "1px solid var(--border-primary)",
                      background: "var(--bg-secondary)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4" style={{ color: "var(--accent-purple)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                      </svg>
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Music Suggestion</span>
                    </div>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {result.musicSuggestion}
                    </p>
                  </div>

                  {/* Tips */}
                  <div
                    className="rounded-lg p-4"
                    style={{
                      border: "1px solid var(--border-primary)",
                      background: "var(--bg-secondary)",
                    }}
                  >
                    <h4 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>
                      Production Tips
                    </h4>
                    <ul className="space-y-2">
                      {result.tips.map((tip, i) => (
                        <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--text-secondary)" }}>
                          <span className="text-xs mt-0.5" style={{ color: "var(--accent-emerald)" }}>*</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Use Template button */}
                  <button
                    onClick={useTemplate}
                    disabled={savingDraft}
                    className="btn-primary text-sm w-full min-h-[44px] disabled:opacity-50"
                  >
                    {savingDraft ? "Creating Draft..." : "Use Template - Create Draft Post"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
