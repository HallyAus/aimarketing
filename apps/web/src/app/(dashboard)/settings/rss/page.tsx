"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { useActiveAccount } from "@/components/client-account-banner";

interface RssFeed {
  id: string;
  pageId: string;
  url: string;
  name: string | null;
  isActive: boolean;
  autoPost: boolean;
  tone: string | null;
  lastCheckedAt: string | null;
  page: { id: string; name: string; platform: string };
}

export default function RssSettingsPage() {
  const activeAccount = useActiveAccount();
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newName, setNewName] = useState("");
  const [newTone, setNewTone] = useState("professional");
  const [newAutoPost, setNewAutoPost] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchFeeds = useCallback(async () => {
    try {
      const pageId = activeAccount?.id;
      const qs = pageId ? `?pageId=${encodeURIComponent(pageId)}` : "";
      const res = await fetch(`/api/rss${qs}`);
      if (!res.ok) throw new Error("Failed to load feeds");
      const data = await res.json();
      setFeeds(data.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feeds");
    } finally {
      setLoading(false);
    }
  }, [activeAccount?.id]);

  useEffect(() => { fetchFeeds(); }, [fetchFeeds]);

  const addFeed = async () => {
    if (!newUrl || !activeAccount?.id) return;
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch("/api/rss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: activeAccount.id, url: newUrl, name: newName || null, autoPost: newAutoPost, tone: newTone }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to add feed");
      }
      setSuccess("RSS feed added successfully");
      setShowAdd(false);
      setNewUrl("");
      setNewName("");
      setNewTone("professional");
      setNewAutoPost(false);
      fetchFeeds();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add feed");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleFeed = async (feedId: string, field: "isActive" | "autoPost", value: boolean) => {
    try {
      const res = await fetch("/api/rss", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedId, [field]: value }),
      });
      if (!res.ok) throw new Error("Failed to update feed");
      fetchFeeds();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const deleteFeed = async (feedId: string) => {
    try {
      const res = await fetch(`/api/rss?feedId=${feedId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete feed");
      setSuccess("Feed deleted");
      fetchFeeds();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const checkNow = async (feedId: string) => {
    setSuccess(`Checking feed... (placeholder: would fetch and parse RSS items)`);
    await toggleFeed(feedId, "isActive", true);
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="RSS Feeds" subtitle="Add blog RSS feeds — AdPilot auto-generates social posts from new articles" />
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary text-sm">
          Add RSS Feed
        </button>
      </div>

      {success && <div className="alert alert-success mb-4">{success}</div>}
      {error && <div className="alert alert-error mb-4">{error}</div>}

      {showAdd && (
        <div className="card mb-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Add New RSS Feed</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Feed URL *</label>
              <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://blog.example.com/feed.xml" className="w-full" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Name</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="My Blog Feed" className="w-full" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Tone for Auto-Generated Posts</label>
              <select value={newTone} onChange={e => setNewTone(e.target.value)} className="w-full">
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="witty">Witty</option>
                <option value="informative">Informative</option>
                <option value="inspiring">Inspiring</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={newAutoPost} onChange={e => setNewAutoPost(e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-sm text-[var(--text-secondary)]">Auto-post new items</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={addFeed} disabled={actionLoading || !newUrl} className="btn-primary text-sm">
              {actionLoading ? "Adding..." : "Add Feed"}
            </button>
            <button onClick={() => setShowAdd(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-lg" />)}
        </div>
      ) : feeds.length === 0 ? (
        <EmptyState title="No RSS feeds" description="Add an RSS feed to auto-generate social posts from blog content." />
      ) : (
        <div className="space-y-3">
          {feeds.map(feed => (
            <div key={feed.id} className="card card-hover">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {feed.name || feed.url}
                    </h4>
                    <span className={`badge text-[10px] ${feed.isActive ? "badge-success" : "badge-neutral"}`}>
                      {feed.isActive ? "Active" : "Paused"}
                    </span>
                    {feed.autoPost && <span className="badge badge-info text-[10px]">Auto-post</span>}
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] truncate">{feed.url}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-tertiary)]">
                    <span>{feed.page.name} ({feed.page.platform})</span>
                    {feed.tone && <span>Tone: {feed.tone}</span>}
                    {feed.lastCheckedAt && <span>Last checked: {new Date(feed.lastCheckedAt).toLocaleString()}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => checkNow(feed.id)} className="btn-secondary text-xs">Check Now</button>
                  <button
                    onClick={() => toggleFeed(feed.id, "isActive", !feed.isActive)}
                    className="btn-ghost text-xs"
                  >
                    {feed.isActive ? "Pause" : "Resume"}
                  </button>
                  <button
                    onClick={() => toggleFeed(feed.id, "autoPost", !feed.autoPost)}
                    className="btn-ghost text-xs"
                  >
                    {feed.autoPost ? "Disable Auto" : "Enable Auto"}
                  </button>
                  <button onClick={() => deleteFeed(feed.id)} className="btn-danger text-xs">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
