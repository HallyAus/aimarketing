"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { ClientAccountBanner, useActiveAccount } from "@/components/client-account-banner";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STYLE_PRESETS = [
  { id: "text-overlay", label: "Text Overlay", description: "Bold text on a gradient background — perfect for announcements, quotes, and CTAs", icon: "type" },
  { id: "flat-design", label: "Flat Design", description: "Clean, minimal graphics with geometric shapes — ideal for infographics and tips", icon: "layout" },
  { id: "photo-realistic", label: "Photo Style", description: "Dark cinematic gradient with subtle lighting — great for professional/corporate content", icon: "camera" },
  { id: "illustration", label: "Illustration", description: "Colorful gradient with decorative elements — perfect for creative/playful brands", icon: "palette" },
  { id: "3d-render", label: "3D Style", description: "Deep space-inspired gradients with 3D elements — eye-catching for tech content", icon: "box" },
  { id: "watercolor", label: "Watercolor", description: "Soft pastel gradients — beautiful for lifestyle, wellness, and artistic brands", icon: "droplet" },
];

const SIZE_PRESETS = [
  { id: "instagram-square", label: "Instagram Square", size: "1080 x 1080" },
  { id: "instagram-story", label: "Instagram Story", size: "1080 x 1920" },
  { id: "facebook-post", label: "Facebook Post", size: "1200 x 630" },
  { id: "twitter-post", label: "Twitter / X Post", size: "1600 x 900" },
  { id: "linkedin-post", label: "LinkedIn Post", size: "1200 x 627" },
  { id: "tiktok-cover", label: "TikTok Cover", size: "1080 x 1920" },
  { id: "youtube-thumbnail", label: "YouTube Thumbnail", size: "1280 x 720" },
];

const COUNT_OPTIONS = [1, 3, 5];

const PLATFORMS = [
  { id: "FACEBOOK", label: "Facebook" },
  { id: "INSTAGRAM", label: "Instagram" },
  { id: "LINKEDIN", label: "LinkedIn" },
  { id: "TWITTER_X", label: "Twitter / X" },
];

const STYLE_ICONS: Record<string, string> = {
  type: "T",
  layout: "▦",
  camera: "◎",
  palette: "◐",
  box: "⬡",
  droplet: "◉",
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GeneratedImage {
  id: string;
  base64: string;
  style: string;
  variation: number;
}

interface Campaign {
  id: string;
  name: string;
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function ImageGenPage() {
  const activeAccount = useActiveAccount();

  // Input state
  const [urlInput, setUrlInput] = useState("");
  const [prompt, setPrompt] = useState("");
  const [fetchingUrl, setFetchingUrl] = useState(false);

  // Style / size / count
  const [style, setStyle] = useState("text-overlay");
  const [size, setSize] = useState("instagram-square");
  const [count, setCount] = useState(3);

  // Text overlay options
  const [headline, setHeadline] = useState("");
  const [subtext, setSubtext] = useState("");
  const [textPosition, setTextPosition] = useState<"top" | "center" | "bottom">("center");
  const [textColor, setTextColor] = useState<"white" | "black" | "brand">("white");
  const [includeBrand, setIncludeBrand] = useState(false);
  const [brandName, setBrandName] = useState("");

  // Generation state
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState("");

  // Scheduling state
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [caption, setCaption] = useState("");
  const [schedulePlatform, setSchedulePlatform] = useState("FACEBOOK");
  const [scheduling, setScheduling] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // Fetch campaigns on mount
  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch("/api/campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.data ?? []);
      }
    } catch {
      // Silent
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Auto-set platform from active account
  useEffect(() => {
    if (activeAccount?.platform) {
      setSchedulePlatform(activeAccount.platform);
    }
  }, [activeAccount]);

  /* ---------------------------------------------------------------- */
  /*  URL extraction                                                   */
  /* ---------------------------------------------------------------- */

  async function extractFromUrl() {
    if (!urlInput.trim()) return;
    setFetchingUrl(true);
    setError("");
    try {
      const res = await fetch("/api/ai/url-to-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: urlInput.trim(),
          platformIds: ["FACEBOOK"],
          postsPerPlatform: 1,
          tone: "professional",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const firstPost = data.posts?.[0];
        if (firstPost?.content) {
          // Use the first line or first ~80 chars as headline
          const content = firstPost.content as string;
          const firstLine = content.split("\n")[0] ?? content;
          const trimmed = firstLine.length > 80 ? firstLine.substring(0, 77) + "..." : firstLine;
          setHeadline(trimmed);
          setPrompt(content);
        }
      } else {
        setError("Could not extract content from URL. Try entering text manually.");
      }
    } catch {
      setError("Failed to fetch URL content.");
    }
    setFetchingUrl(false);
  }

  /* ---------------------------------------------------------------- */
  /*  Image generation                                                 */
  /* ---------------------------------------------------------------- */

  async function generateImages() {
    const displayText = headline.trim() || prompt.trim();
    if (!displayText) {
      setError("Enter a headline or text prompt");
      return;
    }
    setLoading(true);
    setError("");
    setImages([]);
    setSelectedImages(new Set());
    setScheduleSuccess("");
    setScheduleError("");

    try {
      const res = await fetch("/api/ai/image-gen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: displayText,
          style,
          size,
          count,
          headline: headline.trim() || undefined,
          subtext: subtext.trim() || undefined,
          textPosition,
          textColor,
          brandName: includeBrand && brandName.trim() ? brandName.trim() : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const generated: GeneratedImage[] = data.images ?? [];
        setImages(generated);
        // Auto-select all
        setSelectedImages(new Set(generated.map((img) => img.id)));
      } else {
        const data = await res.json().catch(() => ({}));
        setError((data as Record<string, string>).error ?? "Failed to generate images");
      }
    } catch {
      setError("Failed to generate images. Please try again.");
    }
    setLoading(false);
  }

  /* ---------------------------------------------------------------- */
  /*  Image selection                                                  */
  /* ---------------------------------------------------------------- */

  function toggleImage(id: string) {
    setSelectedImages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(images.map((img) => img.id)));
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Download helper                                                  */
  /* ---------------------------------------------------------------- */

  function downloadImage(img: GeneratedImage) {
    const a = document.createElement("a");
    a.href = img.base64;
    a.download = `adpilot-${img.style}-v${img.variation}.png`;
    a.click();
  }

  /* ---------------------------------------------------------------- */
  /*  Batch scheduling                                                 */
  /* ---------------------------------------------------------------- */

  async function scheduleSelected() {
    const selected = images.filter((img) => selectedImages.has(img.id));
    if (selected.length === 0) return;

    setScheduling(true);
    setScheduleError("");
    setScheduleSuccess("");

    try {
      // Build drafts: each selected image becomes a post
      const drafts = selected.map((img) => ({
        content: caption.trim() || headline.trim() || prompt.trim() || "Image post",
        platform: schedulePlatform,
        mediaUrls: [img.base64],
        pageId: activeAccount?.id ?? undefined,
        pageName: activeAccount?.name ?? undefined,
      }));

      const res = await fetch("/api/posts/auto-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drafts,
          campaignId: campaigns[0]?.id || undefined,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as Record<string, string>).error ?? "Failed to schedule");
      }

      const data = await res.json();
      const scheduledTimes = (data.scheduled as Array<{ scheduledAt: string }>) ?? [];
      if (scheduledTimes.length > 0) {
        const timeList = scheduledTimes
          .map((s) => new Date(s.scheduledAt).toLocaleString())
          .join(", ");
        setScheduleSuccess(
          `${scheduledTimes.length} post${scheduledTimes.length > 1 ? "s" : ""} scheduled: ${timeList}`,
        );
      } else {
        setScheduleSuccess("Posts scheduled successfully!");
      }
    } catch (e) {
      setScheduleError(e instanceof Error ? e.message : "Failed to schedule posts");
    }
    setScheduling(false);
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  const hasContent = headline.trim() || prompt.trim();

  return (
    <div>
      <PageHeader
        title="AI Image Generator"
        subtitle="Create multiple styled images from a URL or text prompt, then schedule them as posts"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "AI Studio", href: "/ai" },
          { label: "Image Generator" },
        ]}
      />

      <ClientAccountBanner account={activeAccount} />

      <div className="space-y-6">
        {/* ============================================================ */}
        {/*  INPUT SECTION                                                */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: Input + text overlay */}
          <div className="space-y-4">
            {/* URL input */}
            <div className="card">
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                Content Source
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Paste a URL to extract content for images
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/your-page"
                    className="flex-1 rounded-md px-3 py-2 text-sm"
                    style={{
                      background: "var(--bg-tertiary)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-primary)",
                    }}
                  />
                  <button
                    onClick={extractFromUrl}
                    disabled={fetchingUrl || !urlInput.trim()}
                    className="btn-secondary text-xs whitespace-nowrap disabled:opacity-50"
                  >
                    {fetchingUrl ? "Extracting..." : "Extract"}
                  </button>
                </div>
              </div>

              <div className="mb-2">
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Or describe what you want
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    if (!headline) setHeadline(e.target.value.split("\n")[0]?.substring(0, 80) ?? "");
                  }}
                  rows={3}
                  placeholder="e.g. Flash Sale - 50% Off Everything This Weekend"
                  className="w-full rounded-md px-3 py-2 text-sm"
                  style={{
                    background: "var(--bg-tertiary)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-primary)",
                  }}
                />
              </div>
            </div>

            {/* Text Overlay Options */}
            <div className="card">
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                Text Overlay Options
              </h3>

              <div className="mb-3">
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Headline Text
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Main headline for the image"
                  className="w-full rounded-md px-3 py-2 text-sm"
                  style={{
                    background: "var(--bg-tertiary)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-primary)",
                  }}
                />
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Subtext (optional)
                </label>
                <input
                  type="text"
                  value={subtext}
                  onChange={(e) => setSubtext(e.target.value)}
                  placeholder="e.g. Shop now at printforge.com.au"
                  className="w-full rounded-md px-3 py-2 text-sm"
                  style={{
                    background: "var(--bg-tertiary)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-primary)",
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Text Position
                  </label>
                  <div className="flex gap-1">
                    {(["top", "center", "bottom"] as const).map((pos) => (
                      <button
                        key={pos}
                        onClick={() => setTextPosition(pos)}
                        className="flex-1 px-2 py-1.5 rounded text-xs font-medium capitalize"
                        style={{
                          background: textPosition === pos ? "var(--accent-blue-muted)" : "var(--bg-tertiary)",
                          color: textPosition === pos ? "var(--accent-blue)" : "var(--text-secondary)",
                          border: `1px solid ${textPosition === pos ? "var(--accent-blue)" : "var(--border-primary)"}`,
                        }}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Text Color
                  </label>
                  <div className="flex gap-1">
                    {(["white", "black", "brand"] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => setTextColor(c)}
                        className="flex-1 px-2 py-1.5 rounded text-xs font-medium capitalize"
                        style={{
                          background: textColor === c ? "var(--accent-blue-muted)" : "var(--bg-tertiary)",
                          color: textColor === c ? "var(--accent-blue)" : "var(--text-secondary)",
                          border: `1px solid ${textColor === c ? "var(--accent-blue)" : "var(--border-primary)"}`,
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="include-brand"
                  checked={includeBrand}
                  onChange={(e) => setIncludeBrand(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="include-brand" className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Include brand name
                </label>
                {includeBrand && (
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Brand name"
                    className="flex-1 rounded-md px-2 py-1 text-xs"
                    style={{
                      background: "var(--bg-tertiary)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-primary)",
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right column: Style + Size + Count + Generate */}
          <div className="space-y-4">
            {/* Style Selection */}
            <div className="card">
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                Style
              </h3>
              <div className="space-y-2">
                {STYLE_PRESETS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className="w-full flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-all"
                    style={{
                      background: style === s.id ? "var(--accent-blue-muted)" : "var(--bg-tertiary)",
                      border: `1px solid ${style === s.id ? "var(--accent-blue)" : "var(--border-primary)"}`,
                    }}
                  >
                    <span
                      className="text-lg mt-0.5 flex-shrink-0 w-6 text-center"
                      style={{ color: style === s.id ? "var(--accent-blue)" : "var(--text-tertiary)" }}
                    >
                      {STYLE_ICONS[s.icon] ?? "●"}
                    </span>
                    <div className="min-w-0">
                      <div
                        className="text-sm font-medium"
                        style={{ color: style === s.id ? "var(--accent-blue)" : "var(--text-primary)" }}
                      >
                        {s.label}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                        {s.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Size + Count */}
            <div className="card">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    Platform Size
                  </label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full rounded-md px-3 py-2 text-sm"
                    style={{
                      background: "var(--bg-tertiary)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-primary)",
                    }}
                  >
                    {SIZE_PRESETS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label} ({s.size})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    Number of Images
                  </label>
                  <select
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-full rounded-md px-3 py-2 text-sm"
                    style={{
                      background: "var(--bg-tertiary)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-primary)",
                    }}
                  >
                    {COUNT_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n} image{n > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateImages}
              disabled={loading || !hasContent}
              className="btn-primary text-sm w-full disabled:opacity-50"
            >
              {loading ? "Generating..." : `Generate ${count} Image${count > 1 ? "s" : ""}`}
            </button>

            {error && (
              <div className="alert-error text-xs rounded-lg px-3 py-2">{error}</div>
            )}

            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Images are generated server-side with Sharp. Each variation uses a different color palette.
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/*  LOADING STATE                                                */}
        {/* ============================================================ */}
        {loading && (
          <div className="card flex flex-col items-center justify-center py-12">
            <div
              className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3"
              style={{ borderColor: "var(--accent-blue)", borderTopColor: "transparent" }}
            />
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Generating {count} image{count > 1 ? "s" : ""}...
            </p>
          </div>
        )}

        {/* ============================================================ */}
        {/*  GENERATED IMAGES GRID                                        */}
        {/* ============================================================ */}
        {!loading && images.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              Generated Images
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="card p-0 overflow-hidden"
                  style={{
                    border: selectedImages.has(img.id)
                      ? "2px solid var(--accent-blue)"
                      : "2px solid var(--border-primary)",
                  }}
                >
                  {/* Checkbox overlay */}
                  <div className="relative">
                    <img
                      src={img.base64}
                      alt={`${img.style} variation ${img.variation}`}
                      className="w-full object-contain"
                      style={{ maxHeight: 300 }}
                    />
                    <label
                      className="absolute top-2 left-2 flex items-center gap-1.5 rounded px-2 py-1 cursor-pointer"
                      style={{ background: "rgba(0,0,0,0.6)" }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedImages.has(img.id)}
                        onChange={() => toggleImage(img.id)}
                        className="rounded"
                      />
                      <span className="text-xs text-white">Select</span>
                    </label>
                  </div>

                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                        {STYLE_PRESETS.find((s) => s.id === img.style)?.label ?? img.style} — v{img.variation}
                      </span>
                    </div>
                    <button
                      onClick={() => downloadImage(img)}
                      className="btn-secondary text-xs w-full"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/*  BATCH SCHEDULING SECTION                                     */}
        {/* ============================================================ */}
        {!loading && images.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              Schedule as Posts
            </h3>

            {/* Select all toggle */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={toggleSelectAll}
                className="text-xs font-medium px-2 py-1 rounded"
                style={{
                  background: "var(--accent-blue-muted)",
                  color: "var(--accent-blue)",
                  border: "1px solid var(--accent-blue)",
                }}
              >
                {selectedImages.size === images.length ? "Deselect All" : "Select All"}
              </button>
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {selectedImages.size} of {images.length} selected
              </span>
            </div>

            {/* Caption */}
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Caption (applied to all selected posts)
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                placeholder="Write a caption for these posts..."
                className="w-full rounded-md px-3 py-2 text-sm"
                style={{
                  background: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-primary)",
                }}
              />
            </div>

            {/* Platform selector */}
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Platform
              </label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSchedulePlatform(p.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      background: schedulePlatform === p.id ? "var(--accent-blue-muted)" : "var(--bg-tertiary)",
                      color: schedulePlatform === p.id ? "var(--accent-blue)" : "var(--text-secondary)",
                      border: `1px solid ${schedulePlatform === p.id ? "var(--accent-blue)" : "var(--border-primary)"}`,
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule button */}
            <button
              onClick={scheduleSelected}
              disabled={scheduling || selectedImages.size === 0}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {scheduling
                ? "Scheduling..."
                : `Schedule ${selectedImages.size} Selected Post${selectedImages.size !== 1 ? "s" : ""}`}
            </button>

            {scheduleSuccess && (
              <div
                className="mt-3 text-xs rounded-lg px-3 py-2"
                style={{
                  background: "var(--accent-green-muted, rgba(67, 233, 123, 0.1))",
                  color: "var(--accent-green, #43e97b)",
                  border: "1px solid var(--accent-green, #43e97b)",
                }}
              >
                {scheduleSuccess}
              </div>
            )}

            {scheduleError && (
              <div className="alert-error mt-3 text-xs rounded-lg px-3 py-2">
                {scheduleError}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/*  EMPTY STATE                                                  */}
        {/* ============================================================ */}
        {!loading && images.length === 0 && (
          <div
            className="card flex flex-col items-center justify-center"
            style={{ minHeight: 200 }}
          >
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Generated images will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
