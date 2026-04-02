"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const PLATFORMS = [
  { id: "FACEBOOK", label: "Facebook" },
  { id: "INSTAGRAM", label: "Instagram" },
  { id: "LINKEDIN", label: "LinkedIn" },
  { id: "TWITTER_X", label: "Twitter" },
];

const TONES = ["Professional", "Casual", "Funny", "Inspiring", "Educational"];
const POSTS_PER_PLATFORM_OPTIONS = [3, 5, 10];

const INTERVAL_OPTIONS = [
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 240, label: "4 hours" },
  { value: 360, label: "6 hours" },
  { value: 720, label: "12 hours" },
  { value: 1440, label: "24 hours" },
];

interface GeneratedPost {
  platform: string;
  content: string;
  suggestedTime?: string;
}

interface Campaign {
  id: string;
  name: string;
}

interface Connection {
  id: string;
  platform: string;
  platformAccountName: string | null;
}

type ModalMode = "schedule" | "schedule-all" | "publish-now" | null;

export default function UrlToPostsPage() {
  const [url, setUrl] = useState("");
  const [postsPerPlatform, setPostsPerPlatform] = useState(3);
  const [tone, setTone] = useState("Professional");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "FACEBOOK",
    "INSTAGRAM",
  ]);
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [modalPostIndex, setModalPostIndex] = useState<number | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [batchStartDate, setBatchStartDate] = useState("");
  const [batchInterval, setBatchInterval] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [modalError, setModalError] = useState("");

  // Publish-now state
  const [selectedConnectionId, setSelectedConnectionId] = useState("");

  // Drafts state
  const [draftsSaved, setDraftsSaved] = useState(false);
  const [savingDrafts, setSavingDrafts] = useState(false);

  const fetchCampaignsAndConnections = useCallback(async () => {
    try {
      const [campRes, connRes] = await Promise.all([
        fetch("/api/campaigns"),
        fetch("/api/connections"),
      ]);
      if (campRes.ok) {
        const data = await campRes.json();
        setCampaigns(data.data ?? []);
      }
      if (connRes.ok) {
        const data = await connRes.json();
        setConnections(data.data ?? []);
      }
    } catch {
      // Silent — campaigns/connections will just be empty
    }
  }, []);

  useEffect(() => {
    fetchCampaignsAndConnections();
  }, [fetchCampaignsAndConnections]);

  function togglePlatform(id: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  async function saveDrafts(generatedPosts: GeneratedPost[]) {
    setSavingDrafts(true);
    try {
      const res = await fetch("/api/ai/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posts: generatedPosts.map((p) => ({
            content: p.content,
            platform: p.platform,
            sourceUrl: url,
            tone: tone.toLowerCase(),
          })),
        }),
      });
      if (res.ok) {
        setDraftsSaved(true);
      }
    } catch {
      // Silent fail for draft save — posts are still visible
    }
    setSavingDrafts(false);
  }

  async function generate() {
    if (!url || selectedPlatforms.length === 0) return;
    setLoading(true);
    setError("");
    setPosts([]);
    setSuccessMessage("");
    setDraftsSaved(false);
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
        const generatedPosts = data.posts ?? [];
        setPosts(generatedPosts);
        // Auto-save as drafts
        if (generatedPosts.length > 0) {
          await saveDrafts(generatedPosts);
        }
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

  // --- Modal openers ---

  function openScheduleModal(postIndex: number) {
    setModalMode("schedule");
    setModalPostIndex(postIndex);
    setSelectedCampaignId(campaigns[0]?.id ?? "");
    setScheduleDate("");
    setModalError("");
    setSuccessMessage("");
  }

  function openScheduleAllModal() {
    setModalMode("schedule-all");
    setModalPostIndex(null);
    setSelectedCampaignId(campaigns[0]?.id ?? "");
    setBatchStartDate("");
    setBatchInterval(60);
    setModalError("");
    setSuccessMessage("");
  }

  function openPublishNowModal(postIndex: number) {
    const post = posts[postIndex];
    if (!post) return;
    const platformConnections = connections.filter(
      (c) => c.platform === post.platform,
    );
    setModalMode("publish-now");
    setModalPostIndex(postIndex);
    setSelectedConnectionId(platformConnections[0]?.id ?? "");
    setModalError("");
    setSuccessMessage("");
  }

  function closeModal() {
    setModalMode(null);
    setModalPostIndex(null);
    setModalError("");
  }

  // --- Actions ---

  async function handleSchedulePost() {
    if (modalPostIndex === null) return;
    const post = posts[modalPostIndex];
    if (!post || !selectedCampaignId || !scheduleDate) {
      setModalError("Please select a campaign and schedule date.");
      return;
    }
    setSubmitting(true);
    setModalError("");
    try {
      const res = await fetch("/api/posts/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: post.content,
          platform: post.platform,
          campaignId: selectedCampaignId,
          scheduledAt: new Date(scheduleDate).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error ?? "Failed to schedule post");
      } else {
        setSuccessMessage(
          `Post scheduled for ${new Date(scheduleDate).toLocaleString()}`,
        );
        closeModal();
      }
    } catch {
      setModalError("Network error. Please try again.");
    }
    setSubmitting(false);
  }

  async function handleScheduleAll() {
    if (!selectedCampaignId || !batchStartDate) {
      setModalError("Please select a campaign and start date.");
      return;
    }
    setSubmitting(true);
    setModalError("");
    try {
      const res = await fetch("/api/posts/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posts: posts.map((p) => ({
            content: p.content,
            platform: p.platform,
          })),
          campaignId: selectedCampaignId,
          startAt: new Date(batchStartDate).toISOString(),
          intervalMinutes: batchInterval,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error ?? "Failed to schedule posts");
      } else {
        setSuccessMessage(
          `${data.scheduledCount} post${data.scheduledCount !== 1 ? "s" : ""} scheduled starting ${new Date(batchStartDate).toLocaleString()}`,
        );
        closeModal();
      }
    } catch {
      setModalError("Network error. Please try again.");
    }
    setSubmitting(false);
  }

  async function handlePublishNow() {
    if (modalPostIndex === null) return;
    const post = posts[modalPostIndex];
    if (!post || !selectedConnectionId) {
      setModalError("Please select a platform connection.");
      return;
    }
    setSubmitting(true);
    setModalError("");
    try {
      const res = await fetch("/api/posts/publish-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: post.content,
          platform: post.platform,
          connectionId: selectedConnectionId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error ?? "Failed to publish post");
      } else {
        const urlInfo = data.url ? ` View it at: ${data.url}` : "";
        setSuccessMessage(`Post published successfully!${urlInfo}`);
        closeModal();
      }
    } catch {
      setModalError("Network error. Please try again.");
    }
    setSubmitting(false);
  }

  // Group posts by platform
  const grouped: Record<string, GeneratedPost[]> = {};
  for (const post of posts) {
    const key = post.platform;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(post);
  }

  function getConnectionsForPlatform(platform: string) {
    return connections.filter((c) => c.platform === platform);
  }

  // --- Render ---

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Generate Posts from URL
        </h1>
        <Link
          href="/drafts"
          className="px-3 py-1.5 rounded text-sm font-medium"
          style={{
            border: "1px solid var(--border-primary)",
            color: "var(--text-secondary)",
            background: "var(--bg-secondary)",
          }}
        >
          View Drafts
        </Link>
      </div>
      <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
        Provide a URL and the AI will read its content to generate social media
        posts for your selected platforms.
      </p>

      {successMessage && (
        <div
          className="rounded-md px-4 py-3 text-sm mb-6"
          style={{
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.3)",
            color: "#22c55e",
          }}
        >
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-5">
          {/* URL Input */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
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
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
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
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
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
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
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
                <Spinner />
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
              <Spinner size="lg" />
              <span
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Reading URL and generating posts...
              </span>
            </div>
          )}

          {posts.length > 0 && (
            <div className="space-y-6">
              {/* Draft save confirmation */}
              {draftsSaved && (
                <div
                  className="rounded-md px-4 py-3 text-sm flex items-center justify-between"
                  style={{
                    background: "rgba(16,185,129,0.1)",
                    border: "1px solid rgba(16,185,129,0.3)",
                    color: "var(--accent-emerald, #10b981)",
                  }}
                >
                  <span>Saved as drafts</span>
                  <Link
                    href="/drafts"
                    className="font-medium underline"
                    style={{ color: "var(--accent-emerald, #10b981)" }}
                  >
                    View Drafts
                  </Link>
                </div>
              )}

              {savingDrafts && (
                <div
                  className="rounded-md px-4 py-3 text-sm"
                  style={{
                    background: "rgba(59,130,246,0.1)",
                    border: "1px solid rgba(59,130,246,0.3)",
                    color: "var(--accent-blue)",
                  }}
                >
                  Saving drafts...
                </div>
              )}

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
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {platformPosts.length} post
                      {platformPosts.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {platformPosts.map((post, idx) => {
                      const globalIdx = posts.indexOf(post);
                      const platformConns = getConnectionsForPlatform(
                        post.platform,
                      );
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
                              <span
                                className="text-xs"
                                style={{ color: "var(--text-tertiary)" }}
                              >
                                Suggested time: {post.suggestedTime}
                              </span>
                            )}
                            <div className="flex gap-2 ml-auto">
                              <button
                                onClick={() =>
                                  copyPost(post.content, globalIdx)
                                }
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
                                onClick={() => openScheduleModal(globalIdx)}
                              >
                                Schedule
                              </button>
                              {platformConns.length > 0 && (
                                <button
                                  className="px-3 py-1 rounded text-xs font-medium"
                                  style={{
                                    background: "var(--accent-blue)",
                                    color: "#fff",
                                    border: "1px solid var(--accent-blue)",
                                  }}
                                  onClick={() =>
                                    openPublishNowModal(globalIdx)
                                  }
                                >
                                  Post Now
                                </button>
                              )}
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
                onClick={openScheduleAllModal}
              >
                Schedule All Posts
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- Modal Overlay --- */}
      {modalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="rounded-lg p-6 w-full max-w-md mx-4"
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border-primary)",
            }}
          >
            {/* Schedule Single Post */}
            {modalMode === "schedule" && (
              <>
                <h2
                  className="text-lg font-semibold mb-4"
                  style={{ color: "var(--text-primary)" }}
                >
                  Schedule Post
                </h2>

                {campaigns.length === 0 ? (
                  <p
                    className="text-sm mb-4"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    No campaigns found. Please create a campaign first.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label
                        className="block text-sm font-medium mb-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Campaign
                      </label>
                      <select
                        value={selectedCampaignId}
                        onChange={(e) => setSelectedCampaignId(e.target.value)}
                        className="w-full rounded-md px-3 py-2 text-sm"
                        style={{
                          background: "var(--bg-secondary)",
                          border: "1px solid var(--border-primary)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {campaigns.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        className="block text-sm font-medium mb-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Schedule Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full rounded-md px-3 py-2 text-sm"
                        style={{
                          background: "var(--bg-secondary)",
                          border: "1px solid var(--border-primary)",
                          color: "var(--text-primary)",
                        }}
                      />
                    </div>

                    {modalPostIndex !== null && posts[modalPostIndex] && (
                      <div
                        className="rounded-md p-3 text-xs"
                        style={{
                          background: "var(--bg-secondary)",
                          border: "1px solid var(--border-primary)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        <span
                          className="font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {posts[modalPostIndex].platform}
                        </span>
                        <p className="mt-1 line-clamp-3">
                          {posts[modalPostIndex].content}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {modalError && (
                  <div
                    className="rounded-md px-3 py-2 text-sm mt-4"
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      color: "#ef4444",
                    }}
                  >
                    {modalError}
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 rounded-md text-sm font-medium"
                    style={{
                      border: "1px solid var(--border-primary)",
                      background: "var(--bg-secondary)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSchedulePost}
                    disabled={
                      submitting || !selectedCampaignId || !scheduleDate
                    }
                    className="flex-1 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                    style={{
                      background: "var(--accent-blue)",
                      color: "#fff",
                      border: "1px solid var(--accent-blue)",
                    }}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Spinner />
                        Scheduling...
                      </span>
                    ) : (
                      "Schedule"
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Schedule All Posts */}
            {modalMode === "schedule-all" && (
              <>
                <h2
                  className="text-lg font-semibold mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  Schedule All Posts
                </h2>
                <p
                  className="text-sm mb-4"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {posts.length} post{posts.length !== 1 ? "s" : ""} will be
                  scheduled at regular intervals.
                </p>

                {campaigns.length === 0 ? (
                  <p
                    className="text-sm mb-4"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    No campaigns found. Please create a campaign first.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label
                        className="block text-sm font-medium mb-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Campaign
                      </label>
                      <select
                        value={selectedCampaignId}
                        onChange={(e) => setSelectedCampaignId(e.target.value)}
                        className="w-full rounded-md px-3 py-2 text-sm"
                        style={{
                          background: "var(--bg-secondary)",
                          border: "1px solid var(--border-primary)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {campaigns.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        className="block text-sm font-medium mb-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Start Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={batchStartDate}
                        onChange={(e) => setBatchStartDate(e.target.value)}
                        className="w-full rounded-md px-3 py-2 text-sm"
                        style={{
                          background: "var(--bg-secondary)",
                          border: "1px solid var(--border-primary)",
                          color: "var(--text-primary)",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        className="block text-sm font-medium mb-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Interval Between Posts
                      </label>
                      <select
                        value={batchInterval}
                        onChange={(e) =>
                          setBatchInterval(Number(e.target.value))
                        }
                        className="w-full rounded-md px-3 py-2 text-sm"
                        style={{
                          background: "var(--bg-secondary)",
                          border: "1px solid var(--border-primary)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {INTERVAL_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {modalError && (
                  <div
                    className="rounded-md px-3 py-2 text-sm mt-4"
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      color: "#ef4444",
                    }}
                  >
                    {modalError}
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 rounded-md text-sm font-medium"
                    style={{
                      border: "1px solid var(--border-primary)",
                      background: "var(--bg-secondary)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleScheduleAll}
                    disabled={
                      submitting || !selectedCampaignId || !batchStartDate
                    }
                    className="flex-1 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                    style={{
                      background: "var(--accent-blue)",
                      color: "#fff",
                      border: "1px solid var(--accent-blue)",
                    }}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Spinner />
                        Scheduling...
                      </span>
                    ) : (
                      `Schedule ${posts.length} Posts`
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Publish Now */}
            {modalMode === "publish-now" && (
              <>
                <h2
                  className="text-lg font-semibold mb-4"
                  style={{ color: "var(--text-primary)" }}
                >
                  Post Now
                </h2>

                {modalPostIndex !== null && posts[modalPostIndex] && (
                  <>
                    {(() => {
                      const post = posts[modalPostIndex];
                      const platformConns = getConnectionsForPlatform(
                        post.platform,
                      );

                      if (platformConns.length === 0) {
                        return (
                          <p
                            className="text-sm mb-4"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            No active connection for {post.platform}. Please
                            connect your account first.
                          </p>
                        );
                      }

                      return (
                        <div className="space-y-4">
                          <div>
                            <label
                              className="block text-sm font-medium mb-1"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              Account
                            </label>
                            <select
                              value={selectedConnectionId}
                              onChange={(e) =>
                                setSelectedConnectionId(e.target.value)
                              }
                              className="w-full rounded-md px-3 py-2 text-sm"
                              style={{
                                background: "var(--bg-secondary)",
                                border: "1px solid var(--border-primary)",
                                color: "var(--text-primary)",
                              }}
                            >
                              {platformConns.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.platformAccountName ??
                                    `${post.platform} account`}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div
                            className="rounded-md p-3 text-xs"
                            style={{
                              background: "var(--bg-secondary)",
                              border: "1px solid var(--border-primary)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            <span
                              className="font-semibold"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {post.platform}
                            </span>
                            <p className="mt-1 line-clamp-3">{post.content}</p>
                          </div>

                          <p
                            className="text-xs"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            This will immediately publish the post to{" "}
                            {post.platform}.
                          </p>
                        </div>
                      );
                    })()}
                  </>
                )}

                {modalError && (
                  <div
                    className="rounded-md px-3 py-2 text-sm mt-4"
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      color: "#ef4444",
                    }}
                  >
                    {modalError}
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 rounded-md text-sm font-medium"
                    style={{
                      border: "1px solid var(--border-primary)",
                      background: "var(--bg-secondary)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePublishNow}
                    disabled={submitting || !selectedConnectionId}
                    className="flex-1 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                    style={{
                      background: "var(--accent-blue)",
                      color: "#fff",
                      border: "1px solid var(--accent-blue)",
                    }}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Spinner />
                        Publishing...
                      </span>
                    ) : (
                      "Publish Now"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* Reusable spinner */
function Spinner({ size = "sm" }: { size?: "sm" | "lg" }) {
  const dim = size === "lg" ? "h-8 w-8" : "h-4 w-4";
  return (
    <svg
      className={`animate-spin ${dim}`}
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
  );
}
