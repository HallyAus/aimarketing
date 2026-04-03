"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";

interface RenderedSlide {
  slideNumber: number;
  base64: string;
  html: string;
}

export default function CarouselBuilderPage() {
  // Inputs
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState<"instagram" | "linkedin">("instagram");
  const [numSlides, setNumSlides] = useState(5);
  const [tone, setTone] = useState("");

  // Output
  const [slides, setSlides] = useState<RenderedSlide[]>([]);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ── Generate ──────────────────────────────────────────────── */

  async function handleGenerate() {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setSlides([]);
    setCaption("");

    try {
      const res = await fetch("/api/ai/carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          platform,
          numSlides,
          tone: tone.trim() || undefined,
          content: content.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setSlides(data.slides ?? []);
      setCaption(data.caption ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
    setLoading(false);
  }

  /* ── Download helpers ──────────────────────────────────────── */

  function downloadJpeg(slide: RenderedSlide) {
    const a = document.createElement("a");
    a.href = slide.base64;
    a.download = `carousel-slide-${String(slide.slideNumber).padStart(2, "0")}.jpg`;
    a.click();
  }

  function downloadHtml(slide: RenderedSlide) {
    const blob = new Blob([slide.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `carousel-slide-${String(slide.slideNumber).padStart(2, "0")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadAll() {
    slides.forEach((s) => downloadJpeg(s));
  }

  /* ── Save as drafts ────────────────────────────────────────── */

  async function saveDraft() {
    setError("");
    try {
      const platformMap: Record<string, string> = { instagram: "INSTAGRAM", linkedin: "LINKEDIN" };
      const posts = slides.map((slide) => ({
        content: caption || `Carousel slide ${slide.slideNumber}`,
        platform: platformMap[platform] ?? "INSTAGRAM",
        mediaUrls: [slide.base64],
      }));
      const res = await fetch("/api/ai/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save drafts");
      setSuccess(`${data.count} slides saved as drafts`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save drafts");
    }
  }

  /* ── Schedule ──────────────────────────────────────────────── */

  async function scheduleCarousel() {
    setError("");
    try {
      const platformMap: Record<string, string> = { instagram: "INSTAGRAM", linkedin: "LINKEDIN" };
      const drafts = slides.map((slide) => ({
        content: caption || `Carousel slide ${slide.slideNumber}`,
        platform: platformMap[platform] ?? "INSTAGRAM",
        mediaUrls: [slide.base64],
      }));
      const res = await fetch("/api/posts/auto-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drafts }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scheduling failed");
      setSuccess(`${data.scheduled.length} slides scheduled`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scheduling failed");
    }
  }

  /* ── Render ────────────────────────────────────────────────── */

  return (
    <div>
      <PageHeader
        title="Carousel Builder"
        subtitle="AI generates fully-designed carousel slides rendered as publication-ready images."
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "AI Studio", href: "/ai" },
          { label: "Carousel Builder" },
        ]}
      />

      <div className="space-y-6">
        {/* ── INPUT CARD ─────────────────────────────────────── */}
        <div className="card">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left col */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Topic
                </label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. 5 Tips for Better Instagram Engagement"
                  className="w-full"
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Tone (optional)
                </label>
                <input
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  placeholder="e.g. educational, bold, casual, professional"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Additional Content (optional)
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                  placeholder="Paste content to turn into a carousel..."
                  className="w-full"
                />
              </div>
            </div>

            {/* Right col */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Platform
                </label>
                <div className="flex gap-2">
                  {(["instagram", "linkedin"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatform(p)}
                      className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors flex-1"
                      style={{
                        background: platform === p ? "var(--accent-blue-muted)" : "var(--bg-tertiary)",
                        color: platform === p ? "var(--accent-blue)" : "var(--text-secondary)",
                        border: `1px solid ${platform === p ? "var(--accent-blue)" : "var(--border-primary)"}`,
                      }}
                    >
                      {p === "instagram" ? "Instagram" : "LinkedIn"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Number of Slides: {numSlides}
                </label>
                <input
                  type="range"
                  min={3}
                  max={10}
                  value={numSlides}
                  onChange={(e) => setNumSlides(parseInt(e.target.value))}
                  className="w-full"
                  style={{ accentColor: "var(--accent-blue)" }}
                />
                <div className="flex justify-between text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                  <span>3</span>
                  <span>10</span>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !topic.trim()}
                className="btn-primary text-sm disabled:opacity-50 w-full py-3"
              >
                {loading ? `Rendering ${numSlides} slides...` : `Generate ${numSlides}-Slide Carousel`}
              </button>
            </div>
          </div>
        </div>

        {/* ── ERROR / SUCCESS ─────────────────────────────────── */}
        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={() => setError("")} className="ml-auto text-xs underline">Dismiss</button>
          </div>
        )}
        {success && <div className="alert alert-success">{success}</div>}

        {/* ── LOADING ─────────────────────────────────────────── */}
        {loading && (
          <div className="card flex flex-col items-center justify-center py-16">
            <div
              className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin mb-4"
              style={{ borderColor: "var(--accent-blue)", borderTopColor: "transparent" }}
            />
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Designing {numSlides} carousel slides...
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
              Claude generates HTML, Puppeteer renders each to 1080×1080 JPEG
            </p>
          </div>
        )}

        {/* ── RESULTS ─────────────────────────────────────────── */}
        {!loading && slides.length > 0 && (
          <div className="space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {slides.length} Slides Generated
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadAll}
                  className="btn-secondary text-xs"
                >
                  Download All JPEGs
                </button>
                <button
                  onClick={saveDraft}
                  className="btn-secondary text-xs"
                >
                  Save as Drafts
                </button>
                <button
                  onClick={scheduleCarousel}
                  className="btn-primary text-xs"
                >
                  Auto-Schedule
                </button>
              </div>
            </div>

            {/* Caption */}
            {caption && (
              <div
                className="rounded-lg p-4"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
              >
                <p className="text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>
                  Social Caption
                </p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{caption}</p>
              </div>
            )}

            {/* Slide image grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {slides.map((slide) => (
                <div
                  key={slide.slideNumber}
                  className="rounded-lg overflow-hidden"
                  style={{
                    border: "1px solid var(--border-primary)",
                    background: "var(--bg-secondary)",
                  }}
                >
                  {/* Rendered image */}
                  <div className="relative">
                    <img
                      src={slide.base64}
                      alt={`Slide ${slide.slideNumber}`}
                      className="w-full block"
                      style={{ aspectRatio: "1 / 1", objectFit: "cover" }}
                    />
                    {/* Slide number overlay badge */}
                    <div
                      className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-mono font-bold"
                      style={{
                        background: "rgba(0,0,0,0.6)",
                        color: "rgba(255,255,255,0.9)",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      {String(slide.slideNumber).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-2 flex gap-1.5">
                    <button
                      onClick={() => downloadJpeg(slide)}
                      className="btn-secondary text-xs flex-1 py-1.5"
                    >
                      JPEG
                    </button>
                    <button
                      onClick={() => downloadHtml(slide)}
                      className="btn-ghost text-xs flex-1 py-1.5"
                      style={{ color: "var(--accent-blue)" }}
                    >
                      HTML
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── EMPTY STATE ─────────────────────────────────────── */}
        {!loading && slides.length === 0 && (
          <div className="card flex flex-col items-center justify-center py-12">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-tertiary)", marginBottom: 12 }}>
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Enter a topic and generate your carousel
            </p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Each slide is rendered as a 1080×1080 image — ready to post
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
