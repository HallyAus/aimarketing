"use client";

import { useState } from "react";

const PLATFORMS = [
  { id: "FACEBOOK", label: "Facebook" },
  { id: "INSTAGRAM", label: "Instagram" },
  { id: "LINKEDIN", label: "LinkedIn" },
  { id: "TWITTER_X", label: "Twitter" },
];

const TONES = ["Professional", "Casual", "Funny", "Inspiring", "Educational"];
const POSTS_PER_PLATFORM_OPTIONS = [3, 5, 10];

interface GeneratedPost {
  platform: string;
  content: string;
  suggestedTime?: string;
}

export default function UrlToPostsPage() {
  const [url, setUrl] = useState("");
  const [postsPerPlatform, setPostsPerPlatform] = useState(3);
  const [tone, setTone] = useState("Professional");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["FACEBOOK", "INSTAGRAM"]);
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  function togglePlatform(id: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function generate() {
    if (!url || selectedPlatforms.length === 0) return;
    setLoading(true);
    setError("");
    setPosts([]);
    try {
      const res = await fetch("/api/ai/url-to-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          platformIds: selectedPlatforms,
          postsPerPlatform,
          tone: tone.toLowerCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate posts");
      } else {
        setPosts(data.posts ?? []);
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  async function copyPost(content: string, index: number) {
    await navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  // Group posts by platform
  const grouped: Record<string, GeneratedPost[]> = {};
  for (const post of posts) {
    const key = post.platform;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(post);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
        Generate Posts from URL
      </h1>
      <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
        Provide a URL and the AI will read its content to generate social media posts for your selected platforms.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-5">
          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/blog-post"
              required
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Posts per platform */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Posts per platform
            </label>
            <select
              value={postsPerPlatform}
              onChange={(e) => setPostsPerPlatform(Number(e.target.value))}
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-primary)",
              }}
            >
              {POSTS_PER_PLATFORM_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} posts
                </option>
              ))}
            </select>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-primary)",
              }}
            >
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Platform checkboxes */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Platforms
            </label>
            <div className="flex flex-wrap gap-3">
              {PLATFORMS.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm"
                  style={{
                    border: selectedPlatforms.includes(p.id)
                      ? "1px solid var(--accent-blue)"
                      : "1px solid var(--border-primary)",
                    background: selectedPlatforms.includes(p.id)
                      ? "rgba(59,130,246,0.1)"
                      : "var(--bg-secondary)",
                    color: selectedPlatforms.includes(p.id)
                      ? "var(--accent-blue)"
                      : "var(--text-secondary)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(p.id)}
                    onChange={() => togglePlatform(p.id)}
                    className="accent-blue-500"
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={loading || !url || selectedPlatforms.length === 0}
            className="btn-primary text-sm disabled:opacity-50 min-h-[44px] w-full"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ color: "inherit" }}
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    opacity="0.25"
                  />
                  <path
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    opacity="0.75"
                  />
                </svg>
                Generating...
              </span>
            ) : (
              "Generate Posts"
            )}
          </button>

          {error && (
            <div
              className="rounded-md px-4 py-3 text-sm"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#ef4444",
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        <div>
          {posts.length === 0 && !loading && (
            <div
              className="rounded-lg p-8 flex items-center justify-center min-h-[300px] text-sm"
              style={{
                border: "1px solid var(--border-primary)",
                background: "var(--bg-secondary)",
                color: "var(--text-tertiary)",
              }}
            >
              Generated posts will appear here...
            </div>
          )}

          {loading && (
            <div
              className="rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px] gap-3"
              style={{
                border: "1px solid var(--border-primary)",
                background: "var(--bg-secondary)",
              }}
            >
              <svg
                className="animate-spin h-8 w-8"
                viewBox="0 0 24 24"
                fill="none"
                style={{ color: "var(--accent-blue)" }}
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  opacity="0.25"
                />
                <path
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  opacity="0.75"
                />
              </svg>
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Reading URL and generating posts...
              </span>
            </div>
          )}

          {posts.length > 0 && (
            <div className="space-y-6">
              {Object.entries(grouped).map(([platform, platformPosts]) => (
                <div key={platform}>
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="inline-block text-xs font-semibold px-2 py-1 rounded"
                      style={{
                        background: "var(--accent-blue)",
                        color: "#fff",
                      }}
                    >
                      {platform}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {platformPosts.length} post{platformPosts.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {platformPosts.map((post, idx) => {
                      const globalIdx = posts.indexOf(post);
                      return (
                        <div
                          key={idx}
                          className="rounded-lg p-4 text-sm"
                          style={{
                            border: "1px solid var(--border-primary)",
                            background: "var(--bg-secondary)",
                          }}
                        >
                          <p
                            className="whitespace-pre-wrap mb-3"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {post.content}
                          </p>
                          <div className="flex items-center justify-between">
                            {post.suggestedTime && (
                              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                                Suggested time: {post.suggestedTime}
                              </span>
                            )}
                            <div className="flex gap-2 ml-auto">
                              <button
                                onClick={() => copyPost(post.content, globalIdx)}
                                className="px-3 py-1 rounded text-xs font-medium"
                                style={{
                                  border: "1px solid var(--border-primary)",
                                  background: "var(--bg-primary)",
                                  color:
                                    copiedIndex === globalIdx
                                      ? "var(--accent-green, #22c55e)"
                                      : "var(--text-secondary)",
                                }}
                              >
                                {copiedIndex === globalIdx ? "Copied!" : "Copy"}
                              </button>
                              <button
                                className="px-3 py-1 rounded text-xs font-medium"
                                style={{
                                  border: "1px solid var(--accent-blue)",
                                  background: "transparent",
                                  color: "var(--accent-blue)",
                                }}
                                onClick={() =>
                                  alert("Scheduling will be available in a future update.")
                                }
                              >
                                Schedule
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Schedule All */}
              <button
                className="btn-primary text-sm min-h-[44px] w-full"
                onClick={() =>
                  alert("Schedule All will be available in a future update.")
                }
              >
                Schedule All Posts
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
