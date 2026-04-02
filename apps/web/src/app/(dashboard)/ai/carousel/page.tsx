"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";

interface Slide {
  slideNumber: number;
  title: string;
  body: string;
  cta?: string | null;
  imagePrompt: string;
}

const SLIDE_COLORS = [
  "var(--accent-blue)",
  "var(--accent-purple)",
  "var(--accent-emerald)",
  "var(--accent-amber)",
  "var(--accent-red)",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#6366f1",
  "#14b8a6",
];

export default function CarouselBuilderPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState<"instagram" | "linkedin">("instagram");
  const [numSlides, setNumSlides] = useState(5);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingSlide, setEditingSlide] = useState<number | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [success, setSuccess] = useState("");

  async function handleGenerate() {
    if (!topic.trim()) return;

    setLoading(true);
    setError("");
    setSlides([]);

    try {
      const res = await fetch("/api/ai/carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          platform,
          numSlides,
          content: content || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setSlides(data.slides ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
    setLoading(false);
  }

  function moveSlide(idx: number, direction: "up" | "down") {
    const newSlides = [...slides];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newSlides.length) return;
    [newSlides[idx], newSlides[targetIdx]] = [newSlides[targetIdx]!, newSlides[idx]!];
    // Re-number
    newSlides.forEach((s, i) => (s.slideNumber = i + 1));
    setSlides(newSlides);
  }

  function updateSlide(idx: number, field: keyof Slide, value: string) {
    const newSlides = [...slides];
    const slide = { ...newSlides[idx]! };
    if (field === "slideNumber") {
      slide.slideNumber = parseInt(value) || slide.slideNumber;
    } else {
      (slide as Record<string, unknown>)[field] = value;
    }
    newSlides[idx] = slide;
    setSlides(newSlides);
  }

  async function generateImages() {
    setImageLoading(true);
    setError("");
    try {
      const updatedSlides = [...slides];
      for (let i = 0; i < updatedSlides.length; i++) {
        const slide = updatedSlides[i]!;
        if (!slide.imagePrompt) continue;
        const res = await fetch("/api/ai/image-gen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: slide.imagePrompt, style: "flat-design", size: "instagram-square" }),
        });
        if (res.ok) {
          const blob = await res.blob();
          (slide as unknown as Record<string, unknown>).imageUrl = URL.createObjectURL(blob);
        }
      }
      setSlides(updatedSlides);
      setSuccess("Images generated for all slides");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image generation failed");
    }
    setImageLoading(false);
  }

  async function saveDraft() {
    setSavingDraft(true);
    setError("");
    try {
      const platformMap: Record<string, string> = { instagram: "INSTAGRAM", linkedin: "LINKEDIN" };
      const posts = slides.map((slide) => ({
        content: `[Slide ${slide.slideNumber}] ${slide.title}\n\n${slide.body}${slide.cta ? `\n\nCTA: ${slide.cta}` : ""}`,
        platform: platformMap[platform] ?? "INSTAGRAM",
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
    setSavingDraft(false);
  }

  async function scheduleCarousel() {
    setScheduling(true);
    setError("");
    try {
      const platformMap: Record<string, string> = { instagram: "INSTAGRAM", linkedin: "LINKEDIN" };
      const drafts = slides.map((slide) => ({
        content: `[Slide ${slide.slideNumber}] ${slide.title}\n\n${slide.body}${slide.cta ? `\n\nCTA: ${slide.cta}` : ""}`,
        platform: platformMap[platform] ?? "INSTAGRAM",
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
    setScheduling(false);
  }

  return (
    <div>
      <PageHeader
        title="Carousel Builder"
        subtitle="Create engaging carousel posts with AI-generated slide content."
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "AI Studio", href: "/ai" },
          { label: "Carousel Builder" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input form */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Topic
            </label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. 5 Tips for Better Instagram Engagement"
              className="w-full rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Additional Content (optional)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Paste content to turn into a carousel..."
              className="w-full rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Platform
            </label>
            <div className="flex gap-2">
              {(["instagram", "linkedin"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    platform === p
                      ? "bg-[var(--accent-blue-muted)] text-[var(--accent-blue)] border-[var(--accent-blue)]"
                      : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  {p === "instagram" ? "Instagram" : "LinkedIn"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
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
            <div className="flex justify-between text-xs" style={{ color: "var(--text-tertiary)" }}>
              <span>3</span>
              <span>10</span>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="btn-primary text-sm disabled:opacity-50 min-h-[44px] w-full"
          >
            {loading ? "Generating Carousel..." : "Generate Carousel"}
          </button>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {/* Action buttons */}
          {slides.length > 0 && (
            <div className="space-y-2">
              <button onClick={generateImages} disabled={imageLoading} className="btn-secondary text-sm w-full disabled:opacity-50">
                {imageLoading ? "Generating Images..." : "Generate Images"}
              </button>
              <div className="flex gap-2">
                <button onClick={saveDraft} disabled={savingDraft} className="btn-secondary text-sm flex-1 disabled:opacity-50">
                  {savingDraft ? "Saving..." : "Save as Draft"}
                </button>
                <button onClick={scheduleCarousel} disabled={scheduling} className="btn-primary text-sm flex-1 disabled:opacity-50">
                  {scheduling ? "Scheduling..." : "Schedule"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Slide preview */}
        <div className="lg:col-span-2">
          {slides.length === 0 && !loading && (
            <div
              className="rounded-lg p-8 flex flex-col items-center justify-center min-h-[500px]"
              style={{
                border: "1px solid var(--border-primary)",
                background: "var(--bg-secondary)",
              }}
            >
              <svg className="w-10 h-10 mb-3" style={{ color: "var(--text-tertiary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25a1.5 1.5 0 001.5 1.5z" />
              </svg>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Carousel slides will preview here. Each slide is editable.
              </p>
            </div>
          )}

          {loading && (
            <div
              className="rounded-lg p-8 flex flex-col items-center justify-center min-h-[500px]"
              style={{
                border: "1px solid var(--border-primary)",
                background: "var(--bg-secondary)",
              }}
            >
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-3" style={{ borderColor: "var(--accent-blue)", borderTopColor: "transparent" }} />
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Creating {numSlides} carousel slides...
              </p>
            </div>
          )}

          {slides.length > 0 && (
            <div className="space-y-4">
              {/* Horizontal scroll preview */}
              <div className="flex gap-3 overflow-x-auto pb-4">
                {slides.map((slide, idx) => (
                  <div
                    key={idx}
                    className="flex-shrink-0 w-48 h-48 rounded-lg p-3 flex flex-col justify-between cursor-pointer transition-all hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${SLIDE_COLORS[idx % SLIDE_COLORS.length]}, var(--bg-elevated))`,
                      border: editingSlide === idx ? "2px solid var(--accent-blue)" : "1px solid var(--border-primary)",
                    }}
                    onClick={() => setEditingSlide(editingSlide === idx ? null : idx)}
                  >
                    <div>
                      <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
                        Slide {slide.slideNumber}
                      </span>
                      <h4 className="text-sm font-bold mt-1 line-clamp-2" style={{ color: "white" }}>
                        {slide.title}
                      </h4>
                    </div>
                    <p className="text-xs line-clamp-3" style={{ color: "rgba(255,255,255,0.8)" }}>
                      {slide.body}
                    </p>
                  </div>
                ))}
              </div>

              {/* Detailed slide list */}
              <div className="space-y-3">
                {slides.map((slide, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg overflow-hidden"
                    style={{
                      border: editingSlide === idx
                        ? "2px solid var(--accent-blue)"
                        : "1px solid var(--border-primary)",
                      background: "var(--bg-secondary)",
                    }}
                  >
                    {/* Slide header */}
                    <div
                      className="px-4 py-3 flex items-center justify-between"
                      style={{
                        borderBottom: "1px solid var(--border-secondary)",
                        background: "var(--bg-tertiary)",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{
                            background: SLIDE_COLORS[idx % SLIDE_COLORS.length],
                            color: "white",
                          }}
                        >
                          {slide.slideNumber}
                        </div>
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {idx === 0 ? "Hook Slide" : idx === slides.length - 1 ? "CTA Slide" : `Content Slide`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveSlide(idx, "up")}
                          disabled={idx === 0}
                          className="btn-ghost text-xs px-2 py-1 disabled:opacity-30"
                          title="Move up"
                        >
                          Up
                        </button>
                        <button
                          onClick={() => moveSlide(idx, "down")}
                          disabled={idx === slides.length - 1}
                          className="btn-ghost text-xs px-2 py-1 disabled:opacity-30"
                          title="Move down"
                        >
                          Down
                        </button>
                        <button
                          onClick={() => setEditingSlide(editingSlide === idx ? null : idx)}
                          className="btn-ghost text-xs px-2 py-1"
                        >
                          {editingSlide === idx ? "Done" : "Edit"}
                        </button>
                      </div>
                    </div>

                    {/* Slide content */}
                    <div className="p-4">
                      {editingSlide === idx ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Title</label>
                            <input
                              value={slide.title}
                              onChange={(e) => updateSlide(idx, "title", e.target.value)}
                              className="w-full rounded-md px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Body</label>
                            <textarea
                              value={slide.body}
                              onChange={(e) => updateSlide(idx, "body", e.target.value)}
                              rows={3}
                              className="w-full rounded-md px-3 py-2 text-sm"
                            />
                          </div>
                          {slide.cta && (
                            <div>
                              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>CTA</label>
                              <input
                                value={slide.cta}
                                onChange={(e) => updateSlide(idx, "cta", e.target.value)}
                                className="w-full rounded-md px-3 py-2 text-sm"
                              />
                            </div>
                          )}
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Image Prompt</label>
                            <input
                              value={slide.imagePrompt}
                              onChange={(e) => updateSlide(idx, "imagePrompt", e.target.value)}
                              className="w-full rounded-md px-3 py-2 text-sm"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                            {slide.title}
                          </h4>
                          <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
                            {slide.body}
                          </p>
                          {slide.cta && (
                            <p className="text-sm font-medium" style={{ color: "var(--accent-blue)" }}>
                              CTA: {slide.cta}
                            </p>
                          )}
                          <p className="text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>
                            Image: {slide.imagePrompt}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
