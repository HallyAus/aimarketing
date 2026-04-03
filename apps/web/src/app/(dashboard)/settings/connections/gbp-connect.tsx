"use client";

import { useState } from "react";

const GBP_POST_TYPES = [
  { value: "UPDATE", label: "Update", description: "Share news, tips, or announcements" },
  { value: "EVENT", label: "Event", description: "Promote upcoming events with dates and details" },
  { value: "OFFER", label: "Offer", description: "Share deals, discounts, and promotions" },
];

export function GbpConnect() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [postType, setPostType] = useState("UPDATE");
  const [postContent, setPostContent] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/platforms/google-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect" }),
      });
      const data = await res.json();
      setSuccess(data.message);
      setConnected(true);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!postContent) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/platforms/google-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-post", postType, content: postContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create post");
      setSuccess(data.message);
      setPostContent("");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-[var(--accent-blue-muted)] flex items-center justify-center">
          <svg className="w-5 h-5 text-[var(--accent-blue)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Google Business Profile</h3>
          <p className="text-xs text-[var(--text-tertiary)]">Publish updates, events, and offers to your GBP listing</p>
        </div>
        <span className={`badge ml-auto text-[10px] ${connected ? "badge-success" : "badge-neutral"}`}>
          {connected ? "Connected" : "Not Connected"}
        </span>
      </div>

      {success && <div className="alert alert-success mb-4 text-xs">{success}</div>}
      {error && <div className="alert alert-error mb-4 text-xs">{error}</div>}

      {!connected ? (
        <button onClick={handleConnect} disabled={loading} className="btn-primary text-sm w-full">
          {loading ? "Connecting..." : "Connect Google Business Profile"}
        </button>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-2">Post Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {GBP_POST_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => setPostType(type.value)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    postType === type.value
                      ? "bg-[var(--accent-blue-muted)] border-[var(--accent-blue)]"
                      : "border-[var(--border-primary)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  <span className="text-xs font-medium text-[var(--text-primary)]">{type.label}</span>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{type.description}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Content</label>
            <textarea
              value={postContent}
              onChange={e => setPostContent(e.target.value)}
              placeholder="Write your GBP post..."
              rows={3}
              className="w-full"
            />
          </div>
          <button onClick={handleCreatePost} disabled={loading || !postContent} className="btn-primary text-sm">
            {loading ? "Publishing..." : `Publish ${GBP_POST_TYPES.find(t => t.value === postType)?.label}`}
          </button>
        </div>
      )}
    </div>
  );
}
