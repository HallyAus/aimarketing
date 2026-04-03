"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { PlatformBadge } from "@/components/platform-badge";
import { getPlatformLabel } from "@/lib/platform-colors";
import { ClientAccountBanner, useActiveAccount, type ClientActiveAccount } from "@/components/client-account-banner";

interface Draft {
  id: string;
  platform: string;
  content: string;
  mediaUrls: string[];
  sourceUrl: string | null;
  tone: string | null;
  pageId: string | null;
  pageName: string | null;
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

type ModalType = "schedule" | "postNow" | "scheduleAll" | "scheduleAt" | null;

export default function DraftsPage() {
  const activeAccount = useActiveAccount();
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
  const [autoScheduleLoading, setAutoScheduleLoading] = useState<string | null>(null);
  const [sentimentScores, setSentimentScores] = useState<Record<string, { sentiment: string; score: number; suggestions: string[]; improvedVersion: string }>>({});
  const [sentimentLoading, setSentimentLoading] = useState<Set<string>>(new Set());
  const [batchSentimentLoading, setBatchSentimentLoading] = useState(false);

  async function checkDraftSentiment(draftId: string, content: string) {
    setSentimentLoading((prev) => new Set(prev).add(draftId));
    try {
      const res = await fetch("/api/ai/sentiment-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) return;
      const result = await res.json();
      setSentimentScores((prev) => ({ ...prev, [draftId]: result }));
    } catch { /* ignore */ } finally {
      setSentimentLoading((prev) => { const s = new Set(prev); s.delete(draftId); return s; });
    }
  }

  async function checkAllSentiment() {
    setBatchSentimentLoading(true);
    for (const draft of drafts) {
      if (!sentimentScores[draft.id]) {
        await checkDraftSentiment(draft.id, draft.content);
      }
    }
    setBatchSentimentLoading(false);
  }

  const fetchDrafts = useCallback(async () => {
    try {
      const pageId = activeAccount?.id;
      const qs = pageId ? `?pageId=${encodeURIComponent(pageId)}` : "";
      const res = await fetch(`/api/ai/drafts${qs}`);
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
  }, [activeAccount?.id]);

  useEffect(() => {
    fetchDrafts();
    fetch("/api/campaigns").then(r => r.json()).then(d => setCampaigns(d.data ?? d ?? [])).catch(() => {});
    fetch("/api/connections").then(r => r.json()).then(d => setConnections(d.data ?? d.connections ?? [])).catch(() => {});
  }, [fetchDrafts]);

  // Note: account changes are handled via useActiveAccount hook, which updates
  // activeAccount?.id, causing fetchDrafts to be recreated and the useEffect above to re-run.

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
          pageId: activeDraft.pageId ?? activeAccount?.id ?? undefined,
          pageName: activeDraft.pageName ?? activeAccount?.name ?? undefined,
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
          pageId: activeDraft.pageId ?? activeAccount?.id ?? undefined,
          pageName: activeDraft.pageName ?? activeAccount?.name ?? undefined,
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
          posts: drafts.map(d => ({
            content: d.content,
            platform: d.platform,
            pageId: d.pageId ?? activeAccount?.id ?? undefined,
            pageName: d.pageName ?? activeAccount?.name ?? undefined,
          })),
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

  function formatScheduleTime(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function handleAutoScheduleSingle(draft: Draft) {
    setAutoScheduleLoading(draft.id);
    setError("");
    try {
      const res = await fetch("/api/posts/auto-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drafts: [{ content: draft.content, platform: draft.platform, pageId: draft.pageId ?? activeAccount?.id ?? undefined, pageName: draft.pageName ?? activeAccount?.name ?? undefined }],
          campaignId: campaigns[0]?.id || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed to auto-schedule"); }
      const data = await res.json();
      await fetch(`/api/ai/drafts?id=${draft.id}`, { method: "DELETE" });
      setDrafts(prev => prev.filter(d => d.id !== draft.id));
      const time = data.scheduled?.[0]?.scheduledAt;
      setSuccessMessage(time ? `Scheduled for ${formatScheduleTime(time)}` : "Post scheduled!");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to auto-schedule");
    } finally {
      setAutoScheduleLoading(null);
    }
  }

  async function handleAutoScheduleAll() {
    if (drafts.length === 0) return;
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch("/api/posts/auto-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drafts: drafts.map(d => ({
            content: d.content,
            platform: d.platform,
            pageId: d.pageId ?? activeAccount?.id ?? undefined,
            pageName: d.pageName ?? activeAccount?.name ?? undefined,
          })),
          campaignId: campaigns[0]?.id || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      const data = await res.json();
      const items: Array<{ scheduledAt: string }> = data.scheduled ?? [];

      await Promise.all(drafts.map(d => fetch(`/api/ai/drafts?id=${d.id}`, { method: "DELETE" })));
      setDrafts([]);

      if (items.length > 0) {
        const first = formatScheduleTime(items[0]!.scheduledAt);
        const last = formatScheduleTime(items[items.length - 1]!.scheduledAt);
        setSuccessMessage(
          items.length === 1
            ? `1 post scheduled: ${first}`
            : `${items.length} posts scheduled: first at ${first}, last at ${last} (every 6h)`
        );
      } else {
        setSuccessMessage("Posts scheduled!");
      }
      setTimeout(() => setSuccessMessage(""), 6000);
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
    setError("");
    try {
      // Persist edit via delete + re-create (drafts API doesn't have PATCH)
      const draft = drafts.find((d) => d.id === id);
      if (!draft) return;

      // Try PATCH on posts API first (works if this draft has a post record)
      const patchRes = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });

      if (patchRes.ok) {
        setDrafts((prev) =>
          prev.map((d) => (d.id === id ? { ...d, content: editContent } : d)),
        );
      } else {
        // Fallback: delete old draft and re-create with updated content
        await fetch(`/api/ai/drafts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        const createRes = await fetch("/api/ai/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: editContent,
            platform: draft.platform,
            tone: draft.tone,
            sourceUrl: draft.sourceUrl,
            pageId: draft.pageId,
            pageName: draft.pageName,
          }),
        });
        if (createRes.ok) {
          const data = await createRes.json();
          setDrafts((prev) =>
            prev.map((d) => (d.id === id ? { ...d, id: data.id ?? id, content: editContent } : d)),
          );
        } else {
          // At minimum update locally
          setDrafts((prev) =>
            prev.map((d) => (d.id === id ? { ...d, content: editContent } : d)),
          );
        }
      }
    } catch {
      // Update locally even if network fails
      setDrafts((prev) =>
        prev.map((d) => (d.id === id ? { ...d, content: editContent } : d)),
      );
    }
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
        subtitle={activeAccount ? `Posts generated by AI waiting for your review — edit, schedule, or publish — ${activeAccount.name} (${drafts.length} draft${drafts.length !== 1 ? "s" : ""})` : `Posts generated by AI waiting for your review — edit, schedule, or publish (${drafts.length} draft${drafts.length !== 1 ? "s" : ""})`}
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
      <ClientAccountBanner account={activeAccount} onClear={() => { setLoading(true); fetchDrafts(); }} />
      {drafts.length > 0 && (
        <div className="flex items-center justify-end gap-2 mb-6 flex-wrap">
          <button
            onClick={checkAllSentiment}
            disabled={batchSentimentLoading}
            className="btn-secondary text-sm"
          >
            {batchSentimentLoading ? "Checking..." : "Check Sentiment"}
          </button>
          <button
            onClick={handleAutoScheduleAll}
            disabled={actionLoading}
            className="btn-primary text-sm"
          >
            {actionLoading ? "Scheduling..." : "Schedule All"}
          </button>
          <button
            onClick={() => { setModalType("scheduleAll"); setScheduleDate(""); setSelectedCampaign(""); }}
            className="text-sm"
            style={{ color: "var(--text-tertiary)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: "0.375rem 0.5rem" }}
          >
            Schedule All at...
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
        <div className="alert alert-success mb-4" role="status" aria-live="polite">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="alert alert-error mb-4" role="alert" aria-live="assertive">
          {error}
        </div>
      )}

      {drafts.length === 0 && !error && (
        <EmptyState
          title="No drafts yet"
          description="No drafts yet. Use AI Studio or URL to Posts to generate content — it's saved here automatically for you to review before scheduling."
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
                {draft.pageName && (
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    &rarr; {draft.pageName}
                  </span>
                )}
                {sentimentScores[draft.id] && (() => {
                  const sc = sentimentScores[draft.id]!;
                  return (
                    <span
                      className="text-xs px-2 py-0.5 rounded font-medium"
                      style={{
                        background: sc.sentiment === "positive" ? "var(--accent-emerald)" : sc.sentiment === "negative" ? "var(--accent-red)" : "var(--accent-amber)",
                        color: "#fff",
                      }}
                    >
                      {sc.score}/100
                    </span>
                  );
                })()}
                {!sentimentScores[draft.id] && (
                  <button
                    onClick={() => checkDraftSentiment(draft.id, draft.content)}
                    disabled={sentimentLoading.has(draft.id)}
                    className="text-xs"
                    style={{ color: "var(--accent-blue)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    {sentimentLoading.has(draft.id) ? "..." : "Score"}
                  </button>
                )}
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
                  <label htmlFor={`edit-${draft.id}`} className="sr-only">Edit draft content</label>
                  <textarea
                    id={`edit-${draft.id}`}
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
                <>
                  {/* Draft images */}
                  {draft.mediaUrls?.length > 0 && (
                    <div className="flex gap-2 mb-3 overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" as const }}>
                      {draft.mediaUrls.slice(0, 4).map((url, i) => (
                        <img key={i} src={url} alt={`Media ${i + 1}`} className="rounded-lg flex-shrink-0" style={{ height: 100, maxWidth: 160, objectFit: "cover" }} />
                      ))}
                    </div>
                  )}
                  <p
                    className="whitespace-pre-wrap text-sm mb-3"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {draft.content}
                  </p>
                </>
              )}

              {/* Actions */}
              {editingId !== draft.id && (
                <div className="flex gap-2 flex-wrap items-center">
                  <button onClick={() => startEdit(draft)} className="btn-secondary text-xs">
                    Edit
                  </button>
                  <button
                    onClick={() => handleAutoScheduleSingle(draft)}
                    disabled={autoScheduleLoading === draft.id}
                    className="btn-primary text-xs"
                    style={{ background: "var(--accent-blue)", borderColor: "var(--accent-blue)" }}
                  >
                    {autoScheduleLoading === draft.id ? "Scheduling..." : `Schedule${activeAccount ? ` \u2192 ${activeAccount.name}` : ""}`}
                  </button>
                  <button
                    onClick={() => { setActiveDraft(draft); setModalType("schedule"); setScheduleDate(""); setSelectedCampaign(""); }}
                    className="text-xs"
                    style={{ color: "var(--text-tertiary)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: "0.25rem 0.375rem" }}
                  >
                    Schedule at...
                  </button>
                  <button
                    onClick={() => { setActiveDraft(draft); setModalType("postNow"); }}
                    className="btn-secondary text-xs"
                  >
                    Post Now{activeAccount ? ` \u2192 ${activeAccount.name}` : ""}
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
        <div className="modal-overlay" onClick={() => setModalType(null)} role="dialog" aria-modal="true" aria-label="Schedule post">
          <div onClick={e => e.stopPropagation()} className="modal-panel">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Schedule Post</h2>
            <p className="text-xs mb-3 truncate" style={{ color: "var(--text-tertiary)" }}>{activeDraft.content.substring(0, 80)}...</p>
            <label htmlFor="sched-campaign" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Campaign</label>
            <select id="sched-campaign" value={selectedCampaign} onChange={e => setSelectedCampaign(e.target.value)} className="w-full mb-3">
              <option value="">Select campaign</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <label htmlFor="sched-datetime" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Schedule Date & Time</label>
            <input id="sched-datetime" type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-full mb-4" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModalType(null)} className="btn-secondary min-h-[44px]">Cancel</button>
              <button onClick={handleSchedule} disabled={actionLoading || !selectedCampaign || !scheduleDate} className="btn-primary min-h-[44px]">{actionLoading ? "Scheduling..." : "Schedule"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Post Now Modal */}
      {modalType === "postNow" && activeDraft && (
        <div className="modal-overlay" onClick={() => setModalType(null)} role="dialog" aria-modal="true" aria-label="Post now">
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
        <div className="modal-overlay" onClick={() => setModalType(null)} role="dialog" aria-modal="true" aria-label="Schedule all drafts">
          <div onClick={e => e.stopPropagation()} className="modal-panel">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Schedule All {drafts.length} Drafts</h2>
            <label htmlFor="schedall-campaign" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Campaign</label>
            <select id="schedall-campaign" value={selectedCampaign} onChange={e => setSelectedCampaign(e.target.value)} className="w-full mb-3">
              <option value="">Select campaign</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <label htmlFor="schedall-datetime" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Start Date & Time</label>
            <input id="schedall-datetime" type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-full mb-3" />
            <label htmlFor="schedall-interval" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Post every</label>
            <select id="schedall-interval" value={scheduleInterval} onChange={e => setScheduleInterval(e.target.value)} className="w-full mb-4">
              <option value="120">2 hours</option>
              <option value="240">4 hours</option>
              <option value="360">6 hours</option>
              <option value="480">8 hours</option>
              <option value="720">12 hours</option>
              <option value="1440">24 hours</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModalType(null)} className="btn-secondary min-h-[44px]">Cancel</button>
              <button onClick={handleScheduleAll} disabled={actionLoading || !selectedCampaign || !scheduleDate} className="btn-primary min-h-[44px]">{actionLoading ? "Scheduling..." : `Schedule All ${drafts.length}`}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
