"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Draft {
  id: string;
  platform: string;
  content: string;
  sourceUrl: string | null;
  tone: string | null;
  createdAt: string;
}

interface Campaign {
  id: string;
  name: string;
}

interface Connection {
  id: string;
  platform: string;
  platformUserName: string | null;
}

type ModalType = "schedule" | "postNow" | "scheduleAll" | null;

const PLATFORM_COLORS: Record<string, string> = {
  FACEBOOK: "#1877f2",
  INSTAGRAM: "#e4405f",
  LINKEDIN: "#0a66c2",
  TWITTER_X: "#1da1f2",
  TIKTOK: "#000000",
  YOUTUBE: "#ff0000",
  PINTEREST: "#e60023",
  GOOGLE_ADS: "#4285f4",
  SNAPCHAT: "#fffc00",
};

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [successMessage, setSuccessMessage] = useState("");
  const [modalType, setModalType] = useState<ModalType>(null);
  const [activeDraft, setActiveDraft] = useState<Draft | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleInterval, setScheduleInterval] = useState("360");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDrafts = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/drafts");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to load drafts");
      }
      const data = await res.json();
      setDrafts(data.drafts ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load drafts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrafts();
    fetch("/api/campaigns").then(r => r.json()).then(d => setCampaigns(d.data ?? d ?? [])).catch(() => {});
    fetch("/api/connections").then(r => r.json()).then(d => setConnections(d.data ?? d.connections ?? [])).catch(() => {});
  }, [fetchDrafts]);

  async function handleSchedule() {
    if (!activeDraft || !selectedCampaign || !scheduleDate) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/posts/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: activeDraft.content,
          platform: activeDraft.platform,
          campaignId: selectedCampaign,
          scheduledAt: new Date(scheduleDate).toISOString(),
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      await fetch(`/api/ai/drafts?id=${activeDraft.id}`, { method: "DELETE" });
      setDrafts(prev => prev.filter(d => d.id !== activeDraft.id));
      setModalType(null);
      setActiveDraft(null);
      setSuccessMessage("Post scheduled!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to schedule");
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePostNow() {
    if (!activeDraft) return;
    const conn = connections.find(c => c.platform === activeDraft.platform);
    if (!conn) { setError("No connected account for " + activeDraft.platform); setModalType(null); return; }
    setActionLoading(true);
    try {
      const res = await fetch("/api/posts/publish-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: activeDraft.content,
          platform: activeDraft.platform,
          connectionId: conn.id,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      await fetch(`/api/ai/drafts?id=${activeDraft.id}`, { method: "DELETE" });
      setDrafts(prev => prev.filter(d => d.id !== activeDraft.id));
      setModalType(null);
      setActiveDraft(null);
      setSuccessMessage("Posted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to post");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleScheduleAll() {
    if (!selectedCampaign || !scheduleDate || drafts.length === 0) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/posts/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posts: drafts.map(d => ({ content: d.content, platform: d.platform })),
          campaignId: selectedCampaign,
          startAt: new Date(scheduleDate).toISOString(),
          intervalMinutes: parseInt(scheduleInterval),
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      await Promise.all(drafts.map(d => fetch(`/api/ai/drafts?id=${d.id}`, { method: "DELETE" })));
      setDrafts([]);
      setModalType(null);
      setSuccessMessage(`All ${drafts.length} posts scheduled!`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to schedule all");
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteDraft(id: string) {
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/ai/drafts?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDrafts((prev) => prev.filter((d) => d.id !== id));
        setSuccessMessage("Draft deleted");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch {
      // Silent
    }
    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function deleteAll() {
    if (!confirm(`Delete all ${drafts.length} drafts? This cannot be undone.`)) return;
    const ids = drafts.map((d) => d.id);
    setDeletingIds(new Set(ids));
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/ai/drafts?id=${encodeURIComponent(id)}`, {
            method: "DELETE",
          }),
        ),
      );
      setDrafts([]);
      setSuccessMessage("All drafts deleted");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      // Refresh to get accurate state
      await fetchDrafts();
    }
    setDeletingIds(new Set());
  }

  function startEdit(draft: Draft) {
    setEditingId(draft.id);
    setEditContent(draft.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditContent("");
  }

  async function saveEdit(id: string) {
    // Update locally for now (no PATCH endpoint yet — update via delete + re-create pattern)
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, content: editContent } : d)),
    );
    setEditingId(null);
    setEditContent("");
    setSuccessMessage("Draft updated");
    setTimeout(() => setSuccessMessage(""), 3000);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
          Drafts
        </h1>
        <div
          className="rounded-lg p-8 flex items-center justify-center"
          style={{
            border: "1px solid var(--border-primary)",
            background: "var(--bg-secondary)",
            color: "var(--text-secondary)",
          }}
        >
          Loading drafts...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Drafts
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {drafts.length} draft{drafts.length !== 1 ? "s" : ""} saved
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/ai/url-to-posts"
            className="px-3 py-1.5 rounded text-sm font-medium"
            style={{
              border: "1px solid var(--border-primary)",
              color: "var(--text-secondary)",
              background: "var(--bg-secondary)",
            }}
          >
            Generate More
          </Link>
          {drafts.length > 0 && (
            <>
              <button
                onClick={() => { setModalType("scheduleAll"); setScheduleDate(""); setSelectedCampaign(""); }}
                className="px-3 py-1.5 rounded text-sm font-medium"
                style={{
                  background: "var(--accent-blue)",
                  color: "#fff",
                  border: "1px solid var(--accent-blue)",
                }}
              >
                Schedule All
              </button>
              <button
                onClick={deleteAll}
                className="px-3 py-1.5 rounded text-sm font-medium"
                style={{
                  border: "1px solid rgba(239,68,68,0.5)",
                  color: "#ef4444",
                  background: "rgba(239,68,68,0.05)",
                }}
              >
                Delete All
              </button>
            </>
          )}
        </div>
      </div>

      {successMessage && (
        <div
          className="rounded-md px-4 py-3 text-sm mb-4"
          style={{
            background: "rgba(16,185,129,0.1)",
            border: "1px solid rgba(16,185,129,0.3)",
            color: "var(--accent-emerald, #10b981)",
          }}
        >
          {successMessage}
        </div>
      )}

      {error && (
        <div
          className="rounded-md px-4 py-3 text-sm mb-4"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#ef4444",
          }}
        >
          {error}
        </div>
      )}

      {drafts.length === 0 && !error && (
        <div
          className="rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px] gap-3"
          style={{
            border: "1px solid var(--border-primary)",
            background: "var(--bg-secondary)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            No drafts yet. Generate posts to save them as drafts automatically.
          </p>
          <Link
            href="/ai/url-to-posts"
            className="px-4 py-2 rounded text-sm font-medium"
            style={{
              background: "var(--accent-blue)",
              color: "#fff",
            }}
          >
            Generate Posts from URL
          </Link>
        </div>
      )}

      {drafts.length > 0 && (
        <div className="space-y-3">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="rounded-lg p-4"
              style={{
                border: "1px solid var(--border-primary)",
                background: "var(--bg-secondary)",
                opacity: deletingIds.has(draft.id) ? 0.5 : 1,
              }}
            >
              {/* Header: platform badge + date + source */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span
                  className="inline-block text-xs font-semibold px-2 py-0.5 rounded"
                  style={{
                    background: PLATFORM_COLORS[draft.platform] ?? "var(--accent-blue)",
                    color: draft.platform === "SNAPCHAT" ? "#000" : "#fff",
                  }}
                >
                  {draft.platform.replace("_", " ")}
                </span>
                {draft.tone && (
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      background: "var(--bg-primary)",
                      border: "1px solid var(--border-primary)",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {draft.tone}
                  </span>
                )}
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {formatDate(draft.createdAt)}
                </span>
                {draft.sourceUrl && (
                  <a
                    href={draft.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline ml-auto"
                    style={{ color: "var(--accent-blue)" }}
                  >
                    Source
                  </a>
                )}
              </div>

              {/* Content */}
              {editingId === draft.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={5}
                    className="w-full rounded-md px-3 py-2 text-sm"
                    style={{
                      background: "var(--bg-primary)",
                      border: "1px solid var(--accent-blue)",
                      color: "var(--text-primary)",
                      resize: "vertical",
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(draft.id)}
                      className="px-3 py-1 rounded text-xs font-medium"
                      style={{
                        background: "var(--accent-blue)",
                        color: "#fff",
                        border: "1px solid var(--accent-blue)",
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1 rounded text-xs font-medium"
                      style={{
                        border: "1px solid var(--border-primary)",
                        background: "var(--bg-primary)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p
                  className="whitespace-pre-wrap text-sm mb-3"
                  style={{ color: "var(--text-primary)" }}
                >
                  {draft.content}
                </p>
              )}

              {/* Actions */}
              {editingId !== draft.id && (
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(draft)}
                    className="px-3 py-1 rounded text-xs font-medium"
                    style={{
                      border: "1px solid var(--border-primary)",
                      background: "var(--bg-primary)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => { setActiveDraft(draft); setModalType("schedule"); setScheduleDate(""); setSelectedCampaign(""); }}
                    className="px-3 py-1 rounded text-xs font-medium"
                    style={{
                      border: "1px solid var(--accent-blue)",
                      background: "transparent",
                      color: "var(--accent-blue)",
                    }}
                  >
                    Schedule
                  </button>
                  <button
                    onClick={() => { setActiveDraft(draft); setModalType("postNow"); }}
                    className="px-3 py-1 rounded text-xs font-medium"
                    style={{
                      background: "var(--accent-blue)",
                      color: "#fff",
                      border: "1px solid var(--accent-blue)",
                    }}
                  >
                    Post Now
                  </button>
                  <button
                    onClick={() => deleteDraft(draft.id)}
                    disabled={deletingIds.has(draft.id)}
                    className="px-3 py-1 rounded text-xs font-medium ml-auto"
                    style={{
                      border: "1px solid rgba(239,68,68,0.5)",
                      color: "#ef4444",
                      background: "transparent",
                    }}
                  >
                    {deletingIds.has(draft.id) ? "Deleting..." : "Delete"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Schedule Modal */}
      {modalType === "schedule" && activeDraft && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setModalType(null)}>
          <div onClick={e => e.stopPropagation()} className="rounded-lg p-6 w-full max-w-md" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Schedule Post</h3>
            <p className="text-xs mb-3 truncate" style={{ color: "var(--text-tertiary)" }}>{activeDraft.content.substring(0, 80)}...</p>
            <label className="block text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Campaign</label>
            <select value={selectedCampaign} onChange={e => setSelectedCampaign(e.target.value)} className="w-full rounded px-3 py-2 text-sm mb-3" style={{ background: "var(--bg-primary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}>
              <option value="">Select campaign</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <label className="block text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Schedule Date & Time</label>
            <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-full rounded px-3 py-2 text-sm mb-4" style={{ background: "var(--bg-primary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModalType(null)} className="px-4 py-2 rounded text-sm" style={{ border: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}>Cancel</button>
              <button onClick={handleSchedule} disabled={actionLoading || !selectedCampaign || !scheduleDate} className="px-4 py-2 rounded text-sm font-medium" style={{ background: "var(--accent-blue)", color: "#fff", opacity: actionLoading || !selectedCampaign || !scheduleDate ? 0.5 : 1 }}>{actionLoading ? "Scheduling..." : "Schedule"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Post Now Modal */}
      {modalType === "postNow" && activeDraft && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setModalType(null)}>
          <div onClick={e => e.stopPropagation()} className="rounded-lg p-6 w-full max-w-md" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Post Now</h3>
            <p className="text-xs mb-3 truncate" style={{ color: "var(--text-tertiary)" }}>{activeDraft.content.substring(0, 80)}...</p>
            {connections.filter(c => c.platform === activeDraft.platform).length === 0 ? (
              <p className="text-sm mb-4" style={{ color: "#ef4444" }}>No connected {activeDraft.platform.replace("_", " ")} account. Connect one in Settings first.</p>
            ) : (
              <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>This will post immediately to your {activeDraft.platform.replace("_", " ")} account.</p>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModalType(null)} className="px-4 py-2 rounded text-sm" style={{ border: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}>Cancel</button>
              <button onClick={handlePostNow} disabled={actionLoading || connections.filter(c => c.platform === activeDraft.platform).length === 0} className="px-4 py-2 rounded text-sm font-medium" style={{ background: "var(--accent-blue)", color: "#fff", opacity: actionLoading || connections.filter(c => c.platform === activeDraft.platform).length === 0 ? 0.5 : 1 }}>{actionLoading ? "Posting..." : "Post Now"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule All Modal */}
      {modalType === "scheduleAll" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setModalType(null)}>
          <div onClick={e => e.stopPropagation()} className="rounded-lg p-6 w-full max-w-md" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Schedule All {drafts.length} Drafts</h3>
            <label className="block text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Campaign</label>
            <select value={selectedCampaign} onChange={e => setSelectedCampaign(e.target.value)} className="w-full rounded px-3 py-2 text-sm mb-3" style={{ background: "var(--bg-primary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}>
              <option value="">Select campaign</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <label className="block text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Start Date & Time</label>
            <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-full rounded px-3 py-2 text-sm mb-3" style={{ background: "var(--bg-primary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }} />
            <label className="block text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Post every</label>
            <select value={scheduleInterval} onChange={e => setScheduleInterval(e.target.value)} className="w-full rounded px-3 py-2 text-sm mb-4" style={{ background: "var(--bg-primary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}>
              <option value="120">2 hours</option>
              <option value="240">4 hours</option>
              <option value="360">6 hours</option>
              <option value="480">8 hours</option>
              <option value="720">12 hours</option>
              <option value="1440">24 hours</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModalType(null)} className="px-4 py-2 rounded text-sm" style={{ border: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}>Cancel</button>
              <button onClick={handleScheduleAll} disabled={actionLoading || !selectedCampaign || !scheduleDate} className="px-4 py-2 rounded text-sm font-medium" style={{ background: "var(--accent-blue)", color: "#fff", opacity: actionLoading || !selectedCampaign || !scheduleDate ? 0.5 : 1 }}>{actionLoading ? "Scheduling..." : `Schedule All ${drafts.length}`}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
