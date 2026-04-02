"use client";

import { useState } from "react";
import { ImageUpload } from "@/components/image-upload";
import { SubmitButton } from "@/components/submit-button";
import { PLATFORM_MEDIA_SPECS } from "@/lib/platform-media-specs";

interface PostFormProps {
  campaignId: string;
  platforms: string[];
  templates: { id: string; name: string; content: string; mediaUrls: string[] }[];
}

export function PostForm({ campaignId, platforms, templates }: PostFormProps) {
  const [selectedPlatform, setSelectedPlatform] = useState(platforms[0] ?? "");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [content, setContent] = useState("");

  const hasMediaSpec = !!PLATFORM_MEDIA_SPECS[selectedPlatform];

  function handleUpload(url: string) {
    setMediaUrls((prev) => [...prev, url]);
  }

  function handleRemove(url: string) {
    setMediaUrls((prev) => prev.filter((u) => u !== url));
  }

  function applyTemplate(template: { content: string; mediaUrls: string[] }) {
    setContent(template.content);
    if (template.mediaUrls.length > 0) {
      setMediaUrls(template.mediaUrls);
    }
  }

  async function handleSubmit(formData: FormData) {
    await fetch(`/api/campaigns/${campaignId}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: formData.get("platform"),
        content: formData.get("content"),
        scheduledAt: formData.get("scheduledAt") || undefined,
        mediaUrls,
      }),
    });

    window.location.href = `/campaigns/${campaignId}`;
  }

  return (
    <>
      {templates.length > 0 && (
        <div className="mb-6">
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--text-secondary)" }}
          >
            Start from template (optional)
          </label>
          <div className="flex gap-2 flex-wrap">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t)}
                className="text-xs px-3 py-1 rounded card-hover"
                style={{
                  border: "1px solid var(--border-primary)",
                  color: "var(--text-secondary)",
                  background: "var(--bg-secondary)",
                }}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: "var(--text-secondary)" }}
          >
            Platform
          </label>
          <select
            name="platform"
            required
            className="w-full rounded-md px-3 py-2 text-sm"
            value={selectedPlatform}
            onChange={(e) => {
              setSelectedPlatform(e.target.value);
              setMediaUrls([]);
            }}
          >
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: "var(--text-secondary)" }}
          >
            Content
          </label>
          <textarea
            name="content"
            required
            rows={6}
            className="w-full rounded-md px-3 py-2 text-sm"
            placeholder="Write your post content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* Image upload section */}
        {hasMediaSpec && (
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Media
            </label>
            <ImageUpload
              platform={selectedPlatform}
              onUpload={handleUpload}
              onRemove={handleRemove}
              maxFiles={selectedPlatform === "INSTAGRAM" ? 10 : 4}
            />
          </div>
        )}

        {/* Hidden inputs for mediaUrls so they travel with formData context */}
        {mediaUrls.map((url, i) => (
          <input key={i} type="hidden" name="mediaUrls" value={url} />
        ))}

        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: "var(--text-secondary)" }}
          >
            Schedule (optional)
          </label>
          <input
            name="scheduledAt"
            type="datetime-local"
            className="w-full rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-3">
          <SubmitButton loadingText="Creating...">Create Post</SubmitButton>
        </div>
      </form>
    </>
  );
}
