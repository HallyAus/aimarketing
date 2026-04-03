"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { ClientAccountBanner, useActiveAccount } from "@/components/client-account-banner";

/* ── Constants ──────────────────────────────────────────────── */

const SIZE_OPTIONS = [
  { id: "instagram-square", label: "Instagram Square", size: "1080x1080" },
  { id: "instagram-story", label: "Instagram Story", size: "1080x1920" },
  { id: "facebook-post", label: "Facebook Post", size: "1200x630" },
  { id: "twitter-post", label: "Twitter / X Post", size: "1600x900" },
  { id: "linkedin-post", label: "LinkedIn Post", size: "1200x627" },
  { id: "tiktok-cover", label: "TikTok Cover", size: "1080x1920" },
  { id: "youtube-thumbnail", label: "YouTube Thumbnail", size: "1280x720" },
];

const SCHEDULE_PLATFORMS = [
  { id: "FACEBOOK", label: "Facebook" },
  { id: "INSTAGRAM", label: "Instagram" },
  { id: "LINKEDIN", label: "LinkedIn" },
  { id: "TWITTER_X", label: "Twitter / X" },
];

/* ── Types ──────────────────────────────────────────────────── */

interface GeneratedImage {
  id: string;
  base64: string;
  html?: string;
  type?: string;
  expiresAt?: string;
  createdAt?: string;
  width?: number;
  height?: number;
}

/* ── Page ───────────────────────────────────────────────────── */

export default function ImageGenPage() {
  const activeAccount = useActiveAccount();

  // Input
  const [urlInput, setUrlInput] = useState("");
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState("instagram-square");
  const [count, setCount] = useState(3);
  const [brandName, setBrandName] = useState("");

  // Generation
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [extractedContent, setExtractedContent] = useState("");
  const [error, setError] = useState("");

  // Edit/regenerate
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editHtml, setEditHtml] = useState("");
  const [regenLoading, setRegenLoading] = useState(false);

  // Selection & scheduling
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [caption, setCaption] = useState("");
  const [schedulePlatform, setSchedulePlatform] = useState("FACEBOOK");
  const [scheduling, setScheduling] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState("");

  useEffect(() => {
    if (activeAccount?.platform) setSchedulePlatform(activeAccount.platform);
  }, [activeAccount]);

  // Load cached images on mount
  useEffect(() => {
    fetch("/api/ai/image-gen")
      .then((r) => r.json())
      .then((data) => {
        if (data.images?.length > 0) setImages(data.images);
      })
      .catch(() => {});
  }, []);

  /* ── Generate ────────────────────────────────────────────── */

  async function generate() {
    if (!urlInput.trim() && !prompt.trim()) {
      setError("Enter a URL or describe what you want");
      return;
    }
    setLoading(true);
    setError("");
    setImages([]);
    setSelectedImages(new Set());
    setScheduleSuccess("");
    setExtractedContent("");

    try {
      const res = await fetch("/api/ai/image-gen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: urlInput.trim() || undefined,
          prompt: prompt.trim() || undefined,
          platform,
          count,
          brandName: brandName.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as Record<string, string>).error ?? "Generation failed");
      }

      const data = await res.json();
      const generated: GeneratedImage[] = data.images ?? [];
      setImages(generated);
      setSelectedImages(new Set(generated.map((img) => img.id)));
      if (data.caption) setCaption(data.caption);
      if (data.extractedContent) setExtractedContent(data.extractedContent);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate images");
    }
    setLoading(false);
  }

  /* ── Edit & Regenerate single card ───────────────────────── */

  function startEdit(img: GeneratedImage) {
    setEditingId(img.id);
    setEditHtml(img.html ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditHtml("");
  }

  async function regenerateCard() {
    if (!editHtml) return;
    setRegenLoading(true);
    try {
      const res = await fetch("/api/ai/image-gen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerateHtml: editHtml, platform }),
      });
      if (!res.ok) throw new Error("Regeneration failed");
      const data = await res.json();
      const newImg = data.images?.[0] as GeneratedImage | undefined;
      if (newImg) {
        setImages((prev) =>
          prev.map((img) => (img.id === editingId ? { ...newImg, id: editingId! } : img)),
        );
      }
      setEditingId(null);
      setEditHtml("");
    } catch {
      setError("Failed to regenerate card");
    }
    setRegenLoading(false);
  }

  /* ── Delete cached image ──────────────────────────────────── */

  async function deleteImage(id: string) {
    setImages((prev) => prev.filter((img) => img.id !== id));
    setSelectedImages((prev) => { const s = new Set(prev); s.delete(id); return s; });
    fetch("/api/ai/image-gen", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }

  /* ── Selection ───────────────────────────────────────────── */

  function toggleImage(id: string) {
    setSelectedImages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /* ── Download ────────────────────────────────────────────── */

  function downloadImage(img: GeneratedImage) {
    // Convert base64 to blob for mobile compatibility
    const byteString = atob(img.base64.split(",")[1] ?? "");
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    const blob = new Blob([ab], { type: "image/jpeg" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marketing-${img.type || img.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function downloadHtml(img: GeneratedImage) {
    if (!img.html) return;
    const blob = new Blob([img.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marketing-${img.type || img.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function downloadAll() {
    images.forEach((img) => {
      if (selectedImages.has(img.id)) downloadImage(img);
    });
  }

  function downloadAllHtml() {
    images.forEach((img) => {
      if (selectedImages.has(img.id) && img.html) downloadHtml(img);
    });
  }

  /* ── Schedule ────────────────────────────────────────────── */

  async function scheduleSelected() {
    const selected = images.filter((img) => selectedImages.has(img.id));
    if (selected.length === 0) return;
    setScheduling(true);
    setScheduleSuccess("");
    setError("");

    try {
      const drafts = selected.map((img) => ({
        content: caption.trim() || "Marketing image post",
        platform: schedulePlatform,
        mediaUrls: [img.base64],
        pageId: activeAccount?.id ?? undefined,
        pageName: activeAccount?.name ?? undefined,
      }));

      const res = await fetch("/api/posts/auto-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drafts }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as Record<string, string>).error ?? "Failed to schedule");
      }

      const data = await res.json();
      const count = (data.scheduled as unknown[])?.length ?? 0;
      setScheduleSuccess(`${count} post${count !== 1 ? "s" : ""} scheduled!`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to schedule");
    }
    setScheduling(false);
  }

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <div>
      <PageHeader
        title="AI Image Generator"
        subtitle="Paste a URL or describe your content — AI creates marketing-ready images"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "AI Studio", href: "/ai" },
          { label: "Image Generator" },
        ]}
      />
      <ClientAccountBanner account={activeAccount} />

      <div className="space-y-6">
        {/* ── INPUT ────────────────────────────────────────── */}
        <div className="card">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Paste a URL to extract content
                </label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://yoursite.com/product-page"
                  className="w-full"
                  onKeyDown={(e) => e.key === "Enter" && generate()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Or describe what you want
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  placeholder="e.g. Flash sale on all 3D printers — 30% off this weekend only"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Brand name (optional)
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. PrintForge"
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Platform / Size
                </label>
                <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full">
                  {SIZE_OPTIONS.map((s) => (
                    <option key={s.id} value={s.id}>{s.label} ({s.size})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Number of images
                </label>
                <div className="flex gap-2">
                  {[3, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setCount(n)}
                      className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        background: count === n ? "var(--accent-blue-muted)" : "var(--bg-tertiary)",
                        color: count === n ? "var(--accent-blue)" : "var(--text-secondary)",
                        border: `1px solid ${count === n ? "var(--accent-blue)" : "var(--border-primary)"}`,
                      }}
                    >
                      {n} images
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generate}
                disabled={loading || (!urlInput.trim() && !prompt.trim())}
                className="btn-primary w-full text-sm py-3 disabled:opacity-50"
              >
                {loading ? "Generating..." : `Generate ${count} Marketing Images`}
              </button>
            </div>
          </div>
        </div>

        {/* ── LOADING ──────────────────────────────────────── */}
        {loading && (
          <div className="card flex flex-col items-center justify-center py-16">
            <div
              className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4"
              style={{ borderColor: "var(--accent-blue)", borderTopColor: "transparent" }}
            />
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              AI is designing {count} marketing images...
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
              Analyzing content, choosing templates, rendering PNGs
            </p>
          </div>
        )}

        {/* ── ERROR ────────────────────────────────────────── */}
        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={() => setError("")} className="ml-auto text-xs underline">Dismiss</button>
          </div>
        )}

        {/* ── EXTRACTED CONTENT PREVIEW ────────────────────── */}
        {extractedContent && !loading && (
          <details className="card">
            <summary className="text-xs font-medium cursor-pointer" style={{ color: "var(--text-tertiary)" }}>
              Extracted content from URL
            </summary>
            <pre className="mt-2 text-xs whitespace-pre-wrap overflow-auto max-h-40" style={{ color: "var(--text-secondary)" }}>
              {extractedContent}
            </pre>
          </details>
        )}

        {/* ── RESULTS GRID ─────────────────────────────────── */}
        {!loading && images.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Generated Images
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (selectedImages.size === images.length) setSelectedImages(new Set());
                    else setSelectedImages(new Set(images.map((img) => img.id)));
                  }}
                  className="text-xs font-medium px-2.5 py-1 rounded"
                  style={{ background: "var(--accent-blue-muted)", color: "var(--accent-blue)", border: "1px solid var(--accent-blue)" }}
                >
                  {selectedImages.size === images.length ? "Deselect All" : "Select All"}
                </button>
                <button onClick={downloadAll} disabled={selectedImages.size === 0} className="btn-secondary text-xs disabled:opacity-50">
                  PNG ({selectedImages.size})
                </button>
                <button onClick={downloadAllHtml} disabled={selectedImages.size === 0} className="btn-ghost text-xs disabled:opacity-50" style={{ color: "var(--accent-blue)" }}>
                  HTML ({selectedImages.size})
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="rounded-lg overflow-hidden"
                  style={{
                    border: selectedImages.has(img.id)
                      ? "2px solid var(--accent-blue)"
                      : "2px solid var(--border-primary)",
                    background: "var(--bg-secondary)",
                  }}
                >
                  {/* Image */}
                  <div
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleImage(img.id)}
                  >
                    <img src={img.base64} alt={img.type || "Marketing image"} className="w-full" />
                  </div>

                  {/* Card info */}
                  <div className="p-3 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {img.type && (
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded"
                          style={{ background: "var(--accent-blue-muted)", color: "var(--accent-blue)" }}
                        >
                          {img.type}
                        </span>
                      )}
                      {img.expiresAt && (() => {
                        const days = Math.max(0, Math.ceil((new Date(img.expiresAt).getTime() - Date.now()) / 86400000));
                        return (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{
                              background: days <= 2 ? "var(--accent-red-muted)" : "var(--bg-tertiary)",
                              color: days <= 2 ? "var(--accent-red)" : "var(--text-tertiary)",
                            }}
                          >
                            {days === 0 ? "Expires today" : `${days}d left`}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => downloadImage(img)} className="btn-secondary text-xs flex-1">
                        PNG
                      </button>
                      {img.html && (
                        <button onClick={() => downloadHtml(img)} className="btn-secondary text-xs flex-1">
                          HTML
                        </button>
                      )}
                      <button onClick={() => startEdit(img)} className="btn-ghost text-xs flex-1" style={{ color: "var(--accent-blue)" }}>
                        Edit
                      </button>
                      <button onClick={() => deleteImage(img.id)} className="btn-ghost text-xs" style={{ color: "var(--accent-red)" }}>
                        x
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── EDIT PANEL (HTML editor) ──────────────────── */}
        {editingId && editHtml && (
          <div className="card" style={{ borderColor: "var(--accent-blue)" }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--accent-blue)" }}>
              Edit HTML & Re-render
            </h3>
            <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
              Edit the HTML directly — change text, colors, layout — then re-render to update the image.
            </p>
            <textarea
              value={editHtml}
              onChange={(e) => setEditHtml(e.target.value)}
              rows={12}
              className="w-full font-mono text-xs"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border-primary)", borderRadius: 6, padding: 12 }}
            />
            <div className="flex gap-2 mt-3">
              <button onClick={regenerateCard} disabled={regenLoading} className="btn-primary text-sm">
                {regenLoading ? "Re-rendering..." : "Re-render"}
              </button>
              <button onClick={cancelEdit} className="btn-secondary text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* ── SCHEDULE ─────────────────────────────────────── */}
        {!loading && images.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              Schedule as Posts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Caption</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  placeholder="Write a caption for these posts..."
                  className="w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Platform</label>
                <div className="flex flex-wrap gap-2">
                  {SCHEDULE_PLATFORMS.map((p) => (
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
                <p className="text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>
                  {selectedImages.size} of {images.length} images selected
                </p>
              </div>
            </div>
            <button
              onClick={scheduleSelected}
              disabled={scheduling || selectedImages.size === 0}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {scheduling ? "Scheduling..." : `Schedule ${selectedImages.size} Post${selectedImages.size !== 1 ? "s" : ""}`}
            </button>
            {scheduleSuccess && (
              <div className="alert alert-success mt-3 text-sm">{scheduleSuccess}</div>
            )}
          </div>
        )}

        {/* ── EMPTY STATE ──────────────────────────────────── */}
        {!loading && images.length === 0 && (
          <div className="card flex flex-col items-center justify-center py-12">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-tertiary)", marginBottom: 12 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Paste a URL or describe your content to generate marketing images
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
