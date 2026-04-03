"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";

const STYLE_PRESETS = [
  { id: "photo-realistic", label: "Photo-realistic" },
  { id: "illustration", label: "Illustration" },
  { id: "flat-design", label: "Flat Design" },
  { id: "3d-render", label: "3D Render" },
  { id: "watercolor", label: "Watercolor" },
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

export default function ImageGenPage() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("flat-design");
  const [size, setSize] = useState("instagram-square");
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function generateImage() {
    if (!prompt.trim()) {
      setError("Enter a text prompt");
      return;
    }
    setLoading(true);
    setError("");
    setImageUrl("");

    try {
      const res = await fetch("/api/ai/image-gen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), style, size }),
      });
      if (res.ok) {
        const blob = await res.blob();
        setImageUrl(URL.createObjectURL(blob));
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to generate image");
      }
    } catch {
      setError("Failed to generate image");
    }
    setLoading(false);
  }

  return (
    <div>
      <PageHeader
        title="AI Image Generator"
        subtitle="Describe what you want \u2014 AI creates social media images in multiple styles"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "AI Studio", href: "/ai" },
          { label: "Image Generator" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div className="card">
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              Image Settings
            </h3>

            {/* Prompt */}
            <div className="mb-4">
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Text Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="Describe what you want on the image, e.g. 'Flash Sale - 50% Off Everything This Weekend'"
                className="w-full rounded-md px-3 py-2 text-sm"
              />
            </div>

            {/* Style Presets */}
            <div className="mb-4">
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Style
              </label>
              <div className="flex flex-wrap gap-2">
                {STYLE_PRESETS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      style === s.id ? "" : ""
                    }`}
                    style={{
                      background:
                        style === s.id
                          ? "var(--accent-blue-muted)"
                          : "var(--bg-tertiary)",
                      color:
                        style === s.id
                          ? "var(--accent-blue)"
                          : "var(--text-secondary)",
                      border: `1px solid ${
                        style === s.id
                          ? "var(--accent-blue)"
                          : "var(--border-primary)"
                      }`,
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Presets */}
            <div className="mb-4">
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Platform Size
              </label>
              <div className="space-y-1">
                {SIZE_PRESETS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSize(s.id)}
                    className="w-full flex items-center justify-between rounded-md px-3 py-2 text-sm transition-all"
                    style={{
                      background:
                        size === s.id
                          ? "var(--accent-blue-muted)"
                          : "var(--bg-tertiary)",
                      color:
                        size === s.id
                          ? "var(--accent-blue)"
                          : "var(--text-secondary)",
                      border: `1px solid ${
                        size === s.id
                          ? "var(--accent-blue)"
                          : "transparent"
                      }`,
                    }}
                  >
                    <span>{s.label}</span>
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {s.size}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generateImage}
              disabled={loading || !prompt.trim()}
              className="btn-primary text-sm w-full disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Image"}
            </button>

            {error && (
              <div className="alert-error mt-3 text-xs rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <p
              className="text-xs mt-3"
              style={{ color: "var(--text-tertiary)" }}
            >
              Currently generates styled text images with Sharp. DALL-E and
              Stability AI integration coming soon.
            </p>
          </div>
        </div>

        {/* Preview */}
        <div>
          <div
            className="card flex flex-col items-center justify-center"
            style={{ minHeight: 400 }}
          >
            {loading && (
              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3"
                  style={{ borderColor: "var(--accent-blue)", borderTopColor: "transparent" }}
                />
                <p
                  className="text-sm"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Generating your image...
                </p>
              </div>
            )}

            {!loading && imageUrl && (
              <div className="w-full">
                <div className="rounded-lg overflow-hidden mb-4">
                  <img
                    src={imageUrl}
                    alt="AI Generated"
                    className="max-w-full max-h-[500px] object-contain mx-auto"
                  />
                </div>
                <div className="flex gap-2 justify-center">
                  <a
                    href={imageUrl}
                    download="adpilot-ai-image.png"
                    className="btn-primary text-xs"
                  >
                    Download
                  </a>
                  <button
                    onClick={() => {
                      // Store the image URL in sessionStorage for the post composer to pick up
                      try {
                        sessionStorage.setItem("adpilot-pending-image", imageUrl);
                      } catch { /* non-critical */ }
                      router.push("/ai/url-to-posts");
                    }}
                    className="btn-secondary text-xs"
                  >
                    Use in Post
                  </button>
                </div>
              </div>
            )}

            {!loading && !imageUrl && (
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Image preview will appear here
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
