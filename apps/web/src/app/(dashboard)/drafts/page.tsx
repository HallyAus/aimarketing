"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { PlatformBadge } from "@/components/platform-badge";
import { getPlatformLabel } from "@/lib/platform-colors";

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
        <PageHeader
          title="Drafts"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Drafts" },
          ]}
        />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card space-y-3">
              <div className="flex gap-2">
                <div className="skeleton h-5 w-20 rounded-full" />
                <div className="skeleton h-5 w-32 rounded" />
              </div>
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-3/4 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Drafts"
        subtitle={`${drafts.length} draft${drafts.length !== 1 ? "s" : ""} saved`}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Drafts" },
        ]}
        action={
          <div className="flex gap-2">
            <Link href="/ai/url-to-posts" className="btn-secondary text-sm">
              Generate More
            </Link>
          </div>
        }
      />
      {drafts.length > 0 && (
        <div className="flex items-center justify-end gap-2 mb-6">
          <button
            onClick={() => { setModalType("scheduleAll"); setScheduleDate(""); setSelectedCampaign(""); }}
            className="btn-primary text-sm"
          >
            Schedule All
          </button>
          <button
            onClick={deleteAll}
            className="btn-danger text-sm"
          >
            Delete All
          </button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success mb-4">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="alert alert-error mb-4">
          {error}
        </div>
      )}

      {drafts.length === 0 && !error && (
        <EmptyState
          title="No drafts yet"
          description="Generate posts to save them as drafts automatically."
          action={
            <Link href="/ai/url-to-posts" className="btn-primary text-sm">
              Generate Posts from URL
            </Link>
          }
        />
      )}

      {drafts.length > 0 && (
        <div className="space-y-3">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="card"
              style={{ opacity: deletingIds.has(draft.id) ? 0.5 : 1 }}
            >
              {/* Header: platform badge + date + source */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <PlatformBadge platform={draft.platform} />
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
                    <button onClick={() => saveEdit(draft.id)} className="btn-primary text-xs">Save</button>
                    <button onClick={cancelEdit} className="btn-secondary text-xs">Cancel</button>
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
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => startEdit(draft)} className="btn-secondary text-xs">
                    Edit
                  </button>
                  <button
                    onClick={() => { setActiveDraft(draft); setModalType("schedule"); setScheduleDate(""); setSelectedCampaign(""); }}
                    className="btn-secondary text-xs"
                    style={{ borderColor: "var(--accent-blue)", color: "var(--accent-blue)" }}
                  >
                    Schedule
                  </button>
                  <button
                    onClick={() => { setActiveDraft(draft); setModalType("postNow"); }}
                    className="btn-primary text-xs"
                  >
                    Post Now
                  </button>
                  <button
                    onClick={() => deleteDraft(draft.id)}
                    disabled={deletingIds.has(draft.id)}
                    className="btn-danger text-xs ml-auto"
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
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div onClick={e => e.stopPropagation()} className="modal-panel">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Schedule Post</h2>
            <p className="text-xs mb-3 truncate" style={{ color: "var(--text-tertiary)" }}>{activeDraft.content.substring(0, 80)}...</p>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Campaign</label>
            <select value={selectedCampaign} onChange={e => setSelectedCampaign(e.target.value)} className="w-full mb-3">
              <option value="">Select campaign</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Schedule Date & Time</label>
            <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-full mb-4" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModalType(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleSchedule} disabled={actionLoading || !selectedCampaign || !scheduleDate} className="btn-primary">{actionLoading ? "Scheduling..." : "Schedule"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Post Now Modal */}
      {modalType === "postNow" && activeDraft && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div onClick={e => e.stopPropagation()} className="modal-panel">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Post Now</h2>
            <p className="text-xs mb-3 truncate" style={{ color: "var(--text-tertiary)" }}>{activeDraft.content.substring(0, 80)}...</p>
            {connections.filter(c => c.platform === activeDraft.platform).length === 0 ? (
              <p className="text-sm mb-4" style={{ color: "var(--accent-red)" }}>No connected {getPlatformLabel(activeDraft.platform)} account. Connect one in Settings first.</p>
            ) : (
              <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>This will post immediately to your {getPlatformLabel(activeDraft.platform)} account.</p>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModalType(null)} className="btn-secondary">Cancel</button>
              <button onClick={handlePostNow} disabled={actionLoading || connections.filter(c => c.platform === activeDraft.platform).length === 0} className="btn-primary">{actionLoading ? "Posting..." : "Post Now"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule All Modal */}
      {modalType === "scheduleAll" && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div onClick={e => e.stopPropagation()} className="modal-panel">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Schedule All {drafts.length} Drafts</h2>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Campaign</label>
            <select value={selectedCampaign} onChange={e => setSelectedCampaign(e.target.value)} className="w-full mb-3">
              <option value="">Select campaign</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Start Date & Time</label>
            <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-full mb-3" />
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Post every</label>
            <select value={scheduleInterval} onChange={e => setScheduleInterval(e.target.value)} className="w-full mb-4">
              <option value="120">2 hours</option>
              <option value="240">4 hours</option>
              <option value="360">6 hours</option>
              <option value="480">8 hours</option>
              <option value="720">12 hours</option>
              <option value="1440">24 hours</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModalType(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleScheduleAll} disabled={actionLoading || !selectedCampaign || !scheduleDate} className="btn-primary">{actionLoading ? "Scheduling..." : `Schedule All ${drafts.length}`}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
