"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { PlatformBadge } from "@/components/platform-badge";
import { StatusBadge } from "@/components/status-badge";
import { ClientAccountBanner, useActiveAccount } from "@/components/client-account-banner";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PostData {
  id: string;
  platform: string;
  content: string;
  mediaUrls: string[];
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  platformPostId: string | null;
  rejectionReason: string | null;
  errorMessage: string | null;
  pageId: string | null;
  pageName: string | null;
  version: number;
  createdAt: string;
  approver: { name: string | null } | null;
}

interface CampaignData {
  id: string;
  name: string;
  objective: string;
  status: string;
  targetPlatforms: string[];
  posts: PostData[];
  creator: { name: string | null } | null;
}

interface Connection {
  id: string;
  platform: string;
  platformAccountName: string | null;
}

type FilterTab = "ALL" | "DRAFT" | "SCHEDULED" | "PUBLISHED" | "FAILED";

const OBJECTIVES = ["AWARENESS", "TRAFFIC", "ENGAGEMENT", "CONVERSIONS", "LEADS"];
const ALL_PLATFORMS = ["FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN", "TWITTER_X", "YOUTUBE", "GOOGLE_ADS", "PINTEREST", "SNAPCHAT"];
const CAMPAIGN_STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"];

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const FILTER_TABS: FilterTab[] = ["ALL", "DRAFT", "SCHEDULED", "PUBLISHED", "FAILED"];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CampaignPostsManager({
  campaign: initialCampaign,
}: {
  campaign: CampaignData;
}) {
  const activeAccount = useActiveAccount();
  const campaign = initialCampaign;
  const [posts, setPosts] = useState<PostData[]>(initialCampaign.posts);
  const [filter, setFilter] = useState<FilterTab>("ALL");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [schedulingPostId, setSchedulingPostId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [connections, setConnections] = useState<Connection[]>([]);
  const [publishingPostId, setPublishingPostId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // FIX 11: Edit Campaign state
  const [showEditCampaign, setShowEditCampaign] = useState(false);
  const [editCampaignName, setEditCampaignName] = useState(campaign.name);
  const [editCampaignObjective, setEditCampaignObjective] = useState(campaign.objective);
  const [editCampaignPlatforms, setEditCampaignPlatforms] = useState<string[]>(campaign.targetPlatforms);
  const [editCampaignStatus, setEditCampaignStatus] = useState(campaign.status);
  const [campaignData, setCampaignData] = useState(initialCampaign);

  // Sentiment check state
  const [sentimentScores, setSentimentScores] = useState<Record<string, { sentiment: string; score: number; suggestions: string[]; improvedVersion: string; imageDescription?: string }>>({});
  const [sentimentLoading, setSentimentLoading] = useState<Set<string>>(new Set());

  // FIX 12: Batch schedule modal state
  const [showBatchScheduleModal, setShowBatchScheduleModal] = useState(false);
  const [batchScheduleDate, setBatchScheduleDate] = useState("");

  // Fetch connections on mount
  useEffect(() => {
    fetch("/api/connections")
      .then((r) => r.json())
      .then((data) => {
        if (data.data) setConnections(data.data);
      })
      .catch(() => {});
  }, []);

  const clearError = () => setError(null);

  /* ---- Filtering & sorting ---- */

  const filteredPosts = posts
    .filter((p) => {
      if (filter === "ALL") return p.status !== "DELETED";
      return p.status === filter;
    })
    .sort((a, b) => {
      // Scheduled posts: sort by scheduledAt ascending
      if (a.scheduledAt && b.scheduledAt) {
        return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
      }
      // Otherwise newest first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const draftPosts = posts.filter((p) => p.status === "DRAFT");

  /* ---- Edit content ---- */

  const startEditing = (post: PostData) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
    clearError();
  };

  const cancelEditing = () => {
    setEditingPostId(null);
    setEditContent("");
  };

  const saveEdit = async (post: PostData) => {
    setLoadingAction(`edit-${post.id}`);
    clearError();
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent, version: post.version }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }
      const updated = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, ...updated, scheduledAt: updated.scheduledAt ?? p.scheduledAt, approver: p.approver } : p)));
      setEditingPostId(null);
      setEditContent("");
    } catch {
      setError("Network error while saving");
    } finally {
      setLoadingAction(null);
    }
  };

  /* ---- Schedule a single post ---- */

  const startScheduling = (postId: string) => {
    setSchedulingPostId(postId);
    // Default to 1 hour from now
    const d = new Date(Date.now() + 3600000);
    setScheduleDate(d.toISOString().slice(0, 16));
    clearError();
  };

  const cancelScheduling = () => {
    setSchedulingPostId(null);
    setScheduleDate("");
  };

  const confirmSchedule = async (post: PostData) => {
    if (!scheduleDate) return;
    setLoadingAction(`schedule-${post.id}`);
    clearError();
    try {
      const res = await fetch(`/api/posts/${post.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: new Date(scheduleDate).toISOString() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to schedule");
        return;
      }
      const updated = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, ...updated, approver: p.approver } : p)));
      setSchedulingPostId(null);
      setScheduleDate("");
    } catch {
      setError("Network error while scheduling");
    } finally {
      setLoadingAction(null);
    }
  };

  /* ---- Publish a single post ---- */

  const startPublishing = (post: PostData) => {
    setPublishingPostId(post.id);
    clearError();
    // Auto-select first matching connection
    const match = connections.find((c) => c.platform === post.platform);
    setSelectedConnectionId(match?.id ?? "");
  };

  const cancelPublishing = () => {
    setPublishingPostId(null);
    setSelectedConnectionId("");
  };

  const confirmPublish = async (post: PostData) => {
    if (!selectedConnectionId) {
      setError("Select a platform connection first");
      return;
    }
    setLoadingAction(`publish-${post.id}`);
    clearError();
    try {
      const res = await fetch(`/api/posts/${post.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: selectedConnectionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to publish");
        return;
      }
      if (data.post) {
        setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, ...data.post, approver: p.approver } : p)));
      }
      setPublishingPostId(null);
      setSelectedConnectionId("");
    } catch {
      setError("Network error while publishing");
    } finally {
      setLoadingAction(null);
    }
  };

  /* ---- Delete a post ---- */

  const deletePost = async (post: PostData) => {
    if (!confirm("Delete this post?")) return;
    setLoadingAction(`delete-${post.id}`);
    clearError();
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete");
        return;
      }
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch {
      setError("Network error while deleting");
    } finally {
      setLoadingAction(null);
    }
  };

  /* ---- Submit for approval ---- */

  const submitForApproval = async (post: PostData) => {
    setLoadingAction(`approval-${post.id}`);
    clearError();
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, requestedBy: campaign.creator?.name ?? "Unknown" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit for approval");
        return;
      }
      setPosts((prev) => prev.map((p) =>
        p.id === post.id ? { ...p, status: "PENDING_APPROVAL", version: p.version + 1 } : p
      ));
      setSuccessMessage("Submitted for approval");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch {
      setError("Network error while submitting for approval");
    } finally {
      setLoadingAction(null);
    }
  };

  /* ---- Auto-schedule a single draft (one click) ---- */

  const autoScheduleSingle = async (post: PostData) => {
    setLoadingAction(`auto-schedule-${post.id}`);
    clearError();
    try {
      const res = await fetch("/api/posts/auto-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, campaignId: campaign.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to auto-schedule");
        return;
      }
      const data = await res.json();
      const item = data.scheduled?.[0];
      if (item) {
        setPosts((prev) => prev.map((p) =>
          p.id === post.id ? { ...p, status: "SCHEDULED", scheduledAt: item.scheduledAt, version: p.version + 1 } : p
        ));
        setSuccessMessage(`Scheduled for ${new Date(item.scheduledAt).toLocaleString()}`);
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch {
      setError("Network error while auto-scheduling");
    } finally {
      setLoadingAction(null);
    }
  };

  /* ---- Auto-schedule all drafts (one click) ---- */

  const autoScheduleAllDrafts = async () => {
    if (draftPosts.length === 0) return;
    setLoadingAction("batch-auto-schedule");
    clearError();
    try {
      const res = await fetch("/api/posts/auto-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postIds: draftPosts.map((p) => p.id),
          campaignId: campaign.id,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to auto-schedule");
        return;
      }
      const data = await res.json();
      const items: Array<{ postId: string; scheduledAt: string }> = data.scheduled ?? [];
      // Update local state
      const schedMap = new Map(items.map((s) => [s.postId, s.scheduledAt]));
      setPosts((prev) => prev.map((p) => {
        const at = schedMap.get(p.id);
        if (at) return { ...p, status: "SCHEDULED", scheduledAt: at, version: p.version + 1 };
        return p;
      }));
      if (items.length > 0) {
        const first = new Date(items[0]!.scheduledAt).toLocaleString();
        const last = new Date(items[items.length - 1]!.scheduledAt).toLocaleString();
        setSuccessMessage(
          items.length === 1
            ? `1 post scheduled: ${first}`
            : `${items.length} posts scheduled: first at ${first}, last at ${last} (every 6h)`
        );
        setTimeout(() => setSuccessMessage(null), 6000);
      }
    } catch {
      setError("Error during batch auto-scheduling");
    } finally {
      setLoadingAction(null);
    }
  };

  /* ---- FIX 11: Save campaign edits ---- */

  const saveEditCampaign = async () => {
    setLoadingAction("edit-campaign");
    clearError();
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editCampaignName,
          objective: editCampaignObjective,
          targetPlatforms: editCampaignPlatforms,
          status: editCampaignStatus,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update campaign");
        return;
      }
      const updated = await res.json();
      setCampaignData((prev) => ({ ...prev, ...updated, posts: prev.posts, creator: prev.creator }));
      setShowEditCampaign(false);
      setSuccessMessage("Campaign updated");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setError("Network error while updating campaign");
    } finally {
      setLoadingAction(null);
    }
  };

  /* ---- FIX 12: Batch schedule all drafts (modal — Schedule at...) ---- */

  const openBatchScheduleModal = () => {
    const d = new Date(Date.now() + 3600000);
    setBatchScheduleDate(d.toISOString().slice(0, 16));
    setShowBatchScheduleModal(true);
    clearError();
  };

  const confirmBatchSchedule = async () => {
    if (!batchScheduleDate) return;
    const startAt = new Date(batchScheduleDate);
    if (isNaN(startAt.getTime()) || startAt <= new Date()) {
      setError("Must be a valid future date");
      return;
    }
    setShowBatchScheduleModal(false);
    setLoadingAction("batch-schedule");
    clearError();
    try {
      let offset = 0;
      for (const post of draftPosts) {
        const scheduledAt = new Date(startAt.getTime() + offset * 60 * 60 * 1000);
        const res = await fetch(`/api/posts/${post.id}/schedule`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scheduledAt: scheduledAt.toISOString() }),
        });
        if (res.ok) {
          const updated = await res.json();
          setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, ...updated, approver: p.approver } : p)));
        }
        offset++;
      }
    } catch {
      setError("Error during batch scheduling");
    } finally {
      setLoadingAction(null);
    }
  };

  /* ---- FIX 15: Retry failed post ---- */

  const retryPublish = async (post: PostData) => {
    const conn = connections.find((c) => c.platform === post.platform);
    if (!conn) {
      setError(`No active ${post.platform} connection. Connect one in Settings.`);
      return;
    }
    setLoadingAction(`retry-${post.id}`);
    clearError();
    try {
      const res = await fetch(`/api/posts/${post.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: conn.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Retry failed");
        return;
      }
      if (data.post) {
        setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, ...data.post, approver: p.approver } : p)));
        setSuccessMessage("Post re-published successfully");
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch {
      setError("Network error while retrying");
    } finally {
      setLoadingAction(null);
    }
  };

  /* ---- Batch publish all drafts ---- */

  const publishAllDrafts = async () => {
    if (!confirm(`Publish all ${draftPosts.length} draft posts now?`)) return;
    setLoadingAction("batch-publish");
    clearError();
    let published = 0;
    let failed = 0;
    for (const post of draftPosts) {
      const conn = connections.find((c) => c.platform === post.platform);
      if (!conn) {
        failed++;
        continue;
      }
      try {
        const res = await fetch(`/api/posts/${post.id}/publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ connectionId: conn.id }),
        });
        const data = await res.json();
        if (res.ok && data.post) {
          setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, ...data.post, approver: p.approver } : p)));
          published++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }
    if (failed > 0) {
      setError(`Published ${published}, failed ${failed} (missing connections?)`);
    }
    setLoadingAction(null);
  };

  /* ---- Toggle expand ---- */

  const toggleExpand = (postId: string) => {
    setExpandedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  /* ---- Sentiment check ---- */

  const checkSentiment = async (postId: string, content: string) => {
    setSentimentLoading((prev) => new Set(prev).add(postId));
    try {
      const res = await fetch("/api/ai/sentiment-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, postId }),
      });
      if (res.ok) {
        const result = await res.json();
        setSentimentScores((prev) => ({ ...prev, [postId]: result }));
      }
    } catch { /* ignore */ } finally {
      setSentimentLoading((prev) => { const s = new Set(prev); s.delete(postId); return s; });
    }
  };

  /* ---- Apply improved version ---- */

  const applyImprovedVersion = async (post: PostData, newContent: string) => {
    setLoadingAction(`improve-${post.id}`);
    clearError();
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent, version: post.version }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update");
        return;
      }
      const updated = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, ...updated, content: newContent, scheduledAt: updated.scheduledAt ?? p.scheduledAt, approver: p.approver, mediaUrls: p.mediaUrls } : p)));
      setSentimentScores((prev) => { const next = { ...prev }; delete next[post.id]; return next; });
      setSuccessMessage("Post updated with improved version");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setError("Failed to apply improvement");
    } finally {
      setLoadingAction(null);
    }
  };

  /* ---- Helpers ---- */

  const formatDate = (d: string | null) => {
    if (!d) return null;
    return new Date(d).toLocaleString();
  };

  const isLoading = (action: string) => loadingAction === action;

  const canEdit = (status: string) => ["DRAFT", "REJECTED", "SCHEDULED", "PENDING_APPROVAL", "APPROVED"].includes(status);
  const canSchedule = (status: string) => ["DRAFT", "APPROVED", "FAILED"].includes(status);
  const canPublish = (status: string) => ["DRAFT", "APPROVED", "SCHEDULED", "FAILED"].includes(status);
  const canDelete = (status: string) => status !== "DELETED";

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div>
      {/* ---- Success banner ---- */}
      {successMessage && (
        <div className="alert alert-success mb-4" role="status" aria-live="polite">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="btn-ghost p-1"
            style={{ color: "var(--accent-emerald, #10b981)" }}
            aria-label="Dismiss"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ---- Error banner ---- */}
      {error && (
        <div className="alert alert-error mb-4" role="alert" aria-live="assertive">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="btn-ghost p-1 text-[var(--accent-red)]"
            aria-label="Dismiss error"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ---- FIX 12: Batch Schedule Modal ---- */}
      {showBatchScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="card w-full max-w-md mx-4" style={{ background: "var(--bg-secondary)" }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Schedule All Drafts</h3>
            <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
              {draftPosts.length} draft post(s) will be scheduled 1 hour apart starting from:
            </p>
            <label htmlFor="batch-sched-date" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Start Date &amp; Time</label>
            <input
              id="batch-sched-date"
              type="datetime-local"
              value={batchScheduleDate}
              onChange={(e) => setBatchScheduleDate(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary text-sm" onClick={() => setShowBatchScheduleModal(false)}>Cancel</button>
              <button
                className="btn-primary text-sm"
                disabled={!batchScheduleDate}
                onClick={confirmBatchSchedule}
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- FIX 11: Edit Campaign Modal ---- */}
      {showEditCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="card w-full max-w-lg mx-4" style={{ background: "var(--bg-secondary)" }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Edit Campaign</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-camp-name" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Name</label>
                <input id="edit-camp-name" value={editCampaignName} onChange={(e) => setEditCampaignName(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label htmlFor="edit-camp-objective" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Objective</label>
                <select id="edit-camp-objective" value={editCampaignObjective} onChange={(e) => setEditCampaignObjective(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm">
                  {OBJECTIVES.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Target Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_PLATFORMS.map((p) => (
                    <label key={p} className="flex items-center gap-1.5 text-xs min-h-[36px]" style={{ color: "var(--text-secondary)" }}>
                      <input
                        type="checkbox"
                        checked={editCampaignPlatforms.includes(p)}
                        onChange={(e) => {
                          if (e.target.checked) setEditCampaignPlatforms((prev) => [...prev, p]);
                          else setEditCampaignPlatforms((prev) => prev.filter((x) => x !== p));
                        }}
                        className="w-4 h-4"
                      />
                      {p.replaceAll("_", " ")}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="edit-camp-status" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Status</label>
                <select id="edit-camp-status" value={editCampaignStatus} onChange={(e) => setEditCampaignStatus(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm">
                  {CAMPAIGN_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button className="btn-secondary text-sm" onClick={() => setShowEditCampaign(false)}>Cancel</button>
              <button
                className="btn-primary text-sm"
                disabled={isLoading("edit-campaign") || !editCampaignName.trim()}
                onClick={saveEditCampaign}
              >
                {isLoading("edit-campaign") ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Campaign header ---- */}
      <PageHeader
        title={campaignData.name}
        subtitle={`${campaignData.objective} · ${campaignData.targetPlatforms.join(", ")}`}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Campaigns", href: "/campaigns" },
          { label: campaignData.name },
        ]}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={campaignData.status} />
            <button
              className="btn-secondary text-sm"
              onClick={() => {
                setEditCampaignName(campaignData.name);
                setEditCampaignObjective(campaignData.objective);
                setEditCampaignPlatforms(campaignData.targetPlatforms);
                setEditCampaignStatus(campaignData.status);
                setShowEditCampaign(true);
              }}
            >
              Edit Campaign
            </button>
          </div>
        }
      />
      <ClientAccountBanner account={activeAccount} />
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href={`/campaigns/${campaignData.id}/posts/new`}
          className="btn-primary text-sm"
        >
          Add Post
        </Link>
        {draftPosts.length > 0 && (
          <>
            <button
              className="btn-primary text-sm"
              disabled={isLoading("batch-auto-schedule")}
              onClick={autoScheduleAllDrafts}
            >
              {isLoading("batch-auto-schedule") ? "Scheduling..." : `Schedule All Drafts (${draftPosts.length})${activeAccount ? ` \u2192 ${activeAccount.name}` : ""}`}
            </button>
            <button
              className="text-sm"
              style={{ color: "var(--text-tertiary)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: "0.375rem 0.5rem" }}
              disabled={isLoading("batch-schedule")}
              onClick={openBatchScheduleModal}
            >
              {isLoading("batch-schedule") ? "Scheduling..." : "Schedule All at..."}
            </button>
            <button
              className="btn-secondary text-sm"
              disabled={isLoading("batch-publish")}
              onClick={publishAllDrafts}
            >
              {isLoading("batch-publish") ? "Publishing..." : `Publish All Drafts (${draftPosts.length})${activeAccount ? ` \u2192 ${activeAccount.name}` : ""}`}
            </button>
          </>
        )}
      </div>

      {/* ---- Filter tabs ---- */}
      <div className="tab-bar mb-5 overflow-x-auto" role="tablist" aria-label="Filter posts by status">
        {FILTER_TABS.map((tab) => {
          const count =
            tab === "ALL"
              ? posts.filter((p) => p.status !== "DELETED").length
              : posts.filter((p) => p.status === tab).length;
          const active = filter === tab;
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              role="tab"
              aria-selected={active}
              className={`tab-item ${active ? "tab-item-active" : ""}`}
            >
              {tab} ({count})
            </button>
          );
        })}
      </div>

      {/* ---- Posts list ---- */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-8 text-sm" style={{ color: "var(--text-tertiary)" }}>
          {filter === "ALL"
            ? "No posts yet. Add your first post to this campaign."
            : `No ${filter.toLowerCase()} posts.`}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => {
            const isExpanded = expandedPosts.has(post.id);
            const isLong = post.content.length > 200;
            const displayContent = isLong && !isExpanded ? post.content.substring(0, 200) + "..." : post.content;
            const isEditing = editingPostId === post.id;
            const isScheduling = schedulingPostId === post.id;
            const isPublishingThis = publishingPostId === post.id;
            const connectionsForPlatform = connections.filter((c) => c.platform === post.platform);

            return (
              <div key={post.id} className="card relative">
                {/* ---- Top row: platform + status ---- */}
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <PlatformBadge platform={post.platform} />
                    {post.pageName && (
                      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                        &rarr; {post.pageName}
                      </span>
                    )}
                    <StatusBadge status={post.status} />
                    {sentimentScores[post.id] ? (
                      <span
                        className="text-xs px-2.5 py-1 rounded-md font-bold"
                        style={{
                          background: sentimentScores[post.id]!.sentiment === "positive" ? "var(--accent-emerald)" : sentimentScores[post.id]!.sentiment === "negative" ? "var(--accent-red)" : "var(--accent-amber)",
                          color: "#fff",
                        }}
                      >
                        {sentimentScores[post.id]!.score}/100
                      </span>
                    ) : (
                      <button
                        onClick={() => checkSentiment(post.id, post.content)}
                        disabled={sentimentLoading.has(post.id)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-md"
                        style={{
                          background: sentimentLoading.has(post.id) ? "var(--bg-tertiary)" : "var(--accent-blue-muted)",
                          color: "var(--accent-blue)",
                          border: "1px solid var(--accent-blue)",
                          cursor: sentimentLoading.has(post.id) ? "wait" : "pointer",
                        }}
                      >
                        {sentimentLoading.has(post.id) ? "Scoring..." : "AI Score"}
                      </button>
                    )}
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {/* Edit */}
                    {canEdit(post.status) && !isEditing && (
                      <button
                        className="btn-secondary"
                        onClick={() => startEditing(post)}
                      >
                        Edit
                      </button>
                    )}
                    {/* Submit for Approval */}
                    {post.status === "DRAFT" && (
                      <button
                        className="btn-secondary"
                        style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem" }}
                        disabled={isLoading(`approval-${post.id}`)}
                        onClick={() => submitForApproval(post)}
                      >
                        {isLoading(`approval-${post.id}`) ? "Submitting..." : "Submit for Approval"}
                      </button>
                    )}
                    {/* Approve / Revert for PENDING_APPROVAL posts */}
                    {post.status === "PENDING_APPROVAL" && (
                      <>
                        <button
                          className="btn-primary"
                          style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem", background: "var(--accent-emerald)" }}
                          disabled={isLoading(`approve-${post.id}`)}
                          onClick={async () => {
                            setLoadingAction(`approve-${post.id}`);
                            clearError();
                            try {
                              // Find the approval request and approve it
                              const listRes = await fetch(`/api/approvals?status=PENDING`);
                              const listData = await listRes.json();
                              const approval = (listData.data ?? []).find((a: { post: { id: string } }) => a.post.id === post.id);
                              if (approval) {
                                const res = await fetch("/api/approvals", {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ approvalId: approval.id, action: "APPROVED" }),
                                });
                                if (res.ok) {
                                  setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, status: "APPROVED" } : p));
                                  setSuccessMessage("Post approved");
                                  setTimeout(() => setSuccessMessage(null), 3000);
                                } else {
                                  const d = await res.json();
                                  setError(d.error || "Failed to approve");
                                }
                              } else {
                                // No approval request found — just update status directly
                                const res = await fetch(`/api/posts/${post.id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ version: post.version }),
                                });
                                if (res.ok) {
                                  setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, status: "DRAFT" } : p));
                                }
                              }
                            } catch { setError("Network error"); } finally { setLoadingAction(null); }
                          }}
                        >
                          {isLoading(`approve-${post.id}`) ? "..." : "Approve"}
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem" }}
                          onClick={async () => {
                            setLoadingAction(`revert-${post.id}`);
                            try {
                              const res = await fetch(`/api/posts/${post.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ version: post.version }),
                              });
                              if (res.ok) {
                                setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, status: "DRAFT" } : p));
                                setSuccessMessage("Reverted to draft");
                                setTimeout(() => setSuccessMessage(null), 3000);
                              }
                            } catch { /* ignore */ } finally { setLoadingAction(null); }
                          }}
                        >
                          {isLoading(`revert-${post.id}`) ? "..." : "Revert to Draft"}
                        </button>
                      </>
                    )}
                    {/* Schedule (auto — one click) */}
                    {canSchedule(post.status) && !isScheduling && (
                      <>
                        <button
                          className="btn-primary"
                          style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem" }}
                          disabled={isLoading(`auto-schedule-${post.id}`)}
                          onClick={() => autoScheduleSingle(post)}
                        >
                          {isLoading(`auto-schedule-${post.id}`) ? "Scheduling..." : `Schedule${activeAccount ? ` \u2192 ${activeAccount.name}` : ""}`}
                        </button>
                        <button
                          className="btn-ghost"
                          style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textDecoration: "underline", padding: "0.375rem 0.25rem" }}
                          onClick={() => startScheduling(post.id)}
                        >
                          Schedule at...
                        </button>
                      </>
                    )}
                    {/* Publish Now */}
                    {canPublish(post.status) && !isPublishingThis && (
                      <button
                        className="btn-primary"
                        onClick={() => startPublishing(post)}
                      >
                        Publish Now{activeAccount ? ` \u2192 ${activeAccount.name}` : ""}
                      </button>
                    )}
                    {/* FIX 15: Retry for failed posts */}
                    {post.status === "FAILED" && (
                      <button
                        className="btn-primary"
                        style={{ background: "var(--accent-red)", fontSize: "0.75rem", padding: "0.375rem 0.75rem" }}
                        disabled={isLoading(`retry-${post.id}`)}
                        onClick={() => retryPublish(post)}
                      >
                        {isLoading(`retry-${post.id}`) ? "Retrying..." : "Retry"}
                      </button>
                    )}
                    {/* Delete */}
                    {canDelete(post.status) && (
                      <button
                        className="btn-danger"
                        disabled={isLoading(`delete-${post.id}`)}
                        onClick={() => deletePost(post)}
                      >
                        {isLoading(`delete-${post.id}`) ? "..." : "Delete"}
                      </button>
                    )}
                  </div>
                </div>

                {/* ---- Content ---- */}
                {isEditing ? (
                  <div className="mb-3">
                    <label htmlFor={`edit-content-${post.id}`} className="sr-only">Edit post content</label>
                    <textarea
                      id={`edit-content-${post.id}`}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={6}
                      style={{
                        width: "100%",
                        resize: "vertical",
                        fontSize: "0.875rem",
                        fontFamily: "inherit",
                      }}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        className="btn-primary"
                        disabled={isLoading(`edit-${post.id}`) || editContent.trim() === ""}
                        onClick={() => saveEdit(post)}
                      >
                        {isLoading(`edit-${post.id}`) ? "Saving..." : "Save"}
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-3">
                    {/* Post images */}
                    {post.mediaUrls.length > 0 && (
                      <div className="flex gap-2 mb-3 overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
                        {post.mediaUrls.slice(0, 4).map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt={`Media ${i + 1}`}
                            className="rounded-lg flex-shrink-0"
                            style={{ height: 120, maxWidth: 200, objectFit: "cover" }}
                          />
                        ))}
                        {post.mediaUrls.length > 4 && (
                          <span className="text-xs self-center px-2" style={{ color: "var(--text-tertiary)" }}>
                            +{post.mediaUrls.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap m-0" style={{ color: "var(--text-primary)" }}>
                      {displayContent}
                    </p>
                    {isLong && (
                      <button
                        onClick={() => toggleExpand(post.id)}
                        className="btn-ghost text-xs mt-1 px-0 py-1"
                        style={{ color: "var(--accent-blue)" }}
                      >
                        {isExpanded ? "Show less" : "Show more"}
                      </button>
                    )}
                  </div>
                )}

                {/* ---- Sentiment: suggestions + improved version ---- */}
                {sentimentScores[post.id] && (
                  <div className="mb-3 rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-primary)" }}>
                    {/* Score bar */}
                    <div className="flex items-center gap-2 p-2.5" style={{ background: "var(--bg-tertiary)" }}>
                      <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>AI Analysis</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-primary)" }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${sentimentScores[post.id]!.score}%`,
                            background: sentimentScores[post.id]!.sentiment === "positive" ? "var(--accent-emerald)" : sentimentScores[post.id]!.sentiment === "negative" ? "var(--accent-red)" : "var(--accent-amber)",
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{sentimentScores[post.id]!.score}</span>
                    </div>

                    {/* Image description (proves Claude saw the image) */}
                    {sentimentScores[post.id]!.imageDescription && sentimentScores[post.id]!.imageDescription !== "no image provided" && (
                      <div className="px-2.5 py-2" style={{ borderTop: "1px solid var(--border-primary)", background: "var(--bg-tertiary)" }}>
                        <span className="text-[10px] font-semibold" style={{ color: "var(--text-tertiary)" }}>AI sees: </span>
                        <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                          {sentimentScores[post.id]!.imageDescription}
                        </span>
                      </div>
                    )}

                    {/* Suggestions */}
                    {sentimentScores[post.id]!.suggestions.length > 0 && (
                      <div className="px-2.5 py-2" style={{ borderTop: "1px solid var(--border-primary)" }}>
                        {sentimentScores[post.id]!.suggestions.map((s, i) => (
                          <p key={i} className="text-xs m-0 mt-1" style={{ color: "var(--text-secondary)" }}>
                            <span style={{ color: "var(--accent-blue)" }}>&#8226;</span> {s}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Improved version */}
                    {sentimentScores[post.id]!.improvedVersion && (
                      <div className="p-2.5" style={{ background: "var(--accent-blue-muted)", borderTop: "1px solid var(--accent-blue)" }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold" style={{ color: "var(--accent-blue)" }}>Suggested Improvement</span>
                          <button
                            onClick={() => applyImprovedVersion(post, sentimentScores[post.id]!.improvedVersion)}
                            disabled={isLoading(`improve-${post.id}`)}
                            className="text-xs font-bold px-3 py-1 rounded-md"
                            style={{ background: "var(--accent-blue)", color: "#fff", border: "none", cursor: "pointer" }}
                          >
                            {isLoading(`improve-${post.id}`) ? "Applying..." : "Use This Version"}
                          </button>
                        </div>
                        <p className="text-xs leading-relaxed whitespace-pre-wrap m-0" style={{ color: "var(--text-primary)" }}>
                          {sentimentScores[post.id]!.improvedVersion}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ---- Schedule inline form ---- */}
                {isScheduling && (
                  <div className="inline-form">
                    <label htmlFor={`sched-${post.id}`} style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
                      Schedule for:
                    </label>
                    <input
                      id={`sched-${post.id}`}
                      type="datetime-local"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      style={{ fontSize: "0.8125rem" }}
                    />
                    <button
                      className="btn-primary"
                      style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem", minHeight: 36 }}
                      disabled={isLoading(`schedule-${post.id}`) || !scheduleDate}
                      onClick={() => confirmSchedule(post)}
                    >
                      {isLoading(`schedule-${post.id}`) ? "Scheduling..." : "Confirm"}
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem", minHeight: 36 }}
                      onClick={cancelScheduling}
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* ---- Publish inline form ---- */}
                {isPublishingThis && (
                  <div className="inline-form">
                    <label htmlFor={`pub-conn-${post.id}`} style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
                      Connection:
                    </label>
                    {connectionsForPlatform.length === 0 ? (
                      <span style={{ color: "var(--accent-amber)", fontSize: "0.8125rem" }}>
                        No active {post.platform} connection.{" "}
                        <Link href="/settings/connections" style={{ color: "var(--accent-blue)" }}>
                          Connect
                        </Link>
                      </span>
                    ) : (
                      <select
                        id={`pub-conn-${post.id}`}
                        value={selectedConnectionId}
                        onChange={(e) => setSelectedConnectionId(e.target.value)}
                        style={{ fontSize: "0.8125rem" }}
                      >
                        <option value="">Select connection</option>
                        {connectionsForPlatform.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.platformAccountName ?? c.platform}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      className="btn-primary"
                      style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem", minHeight: 36 }}
                      disabled={isLoading(`publish-${post.id}`) || !selectedConnectionId}
                      onClick={() => confirmPublish(post)}
                    >
                      {isLoading(`publish-${post.id}`) ? "Publishing..." : "Publish"}
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem", minHeight: 36 }}
                      onClick={cancelPublishing}
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* ---- Meta: rejection reason, error, schedule time, published link ---- */}
                <div className="flex flex-col gap-1 text-xs">
                  {post.rejectionReason && (
                    <p className="m-0" style={{ color: "var(--accent-red)" }}>
                      Rejected: {post.rejectionReason}
                    </p>
                  )}
                  {post.errorMessage && (
                    <p className="m-0" style={{ color: "var(--accent-red)" }}>
                      Error: {post.errorMessage}
                    </p>
                  )}
                  {post.scheduledAt && (
                    <p className="m-0" style={{ color: "var(--text-tertiary)" }}>
                      Scheduled: {formatDate(post.scheduledAt)}
                    </p>
                  )}
                  {post.publishedAt && (
                    <p className="m-0" style={{ color: "var(--accent-emerald)" }}>
                      Published: {formatDate(post.publishedAt)}
                      {post.platformPostId && (
                        <span className="ml-2">(ID: {post.platformPostId})</span>
                      )}
                    </p>
                  )}
                  {post.approver?.name && (
                    <p className="m-0" style={{ color: "var(--text-tertiary)" }}>
                      Approved by: {post.approver.name}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
