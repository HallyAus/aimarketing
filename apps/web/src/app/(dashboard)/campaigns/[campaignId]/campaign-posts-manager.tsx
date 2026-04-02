"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PostData {
  id: string;
  platform: string;
  content: string;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  platformPostId: string | null;
  rejectionReason: string | null;
  errorMessage: string | null;
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

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "badge badge-neutral",
  PENDING_APPROVAL: "badge badge-warning",
  APPROVED: "badge badge-info",
  REJECTED: "badge badge-error",
  SCHEDULED: "badge badge-info",
  PUBLISHING: "badge badge-warning",
  PUBLISHED: "badge badge-success",
  FAILED: "badge badge-error",
  DELETED: "badge badge-neutral",
};

const CAMPAIGN_STATUS_BADGE: Record<string, string> = {
  DRAFT: "badge badge-neutral",
  SCHEDULED: "badge badge-info",
  ACTIVE: "badge badge-success",
  PAUSED: "badge badge-warning",
  COMPLETED: "badge badge-purple",
  FAILED: "badge badge-error",
};

const PLATFORM_STYLE: Record<string, { bg: string; color: string }> = {
  FACEBOOK: { bg: "rgba(59, 130, 246, 0.15)", color: "var(--accent-blue)" },
  INSTAGRAM: { bg: "rgba(139, 92, 246, 0.15)", color: "var(--accent-purple)" },
  TIKTOK: { bg: "rgba(16, 185, 129, 0.15)", color: "var(--accent-emerald)" },
  LINKEDIN: { bg: "rgba(59, 130, 246, 0.15)", color: "var(--accent-blue)" },
  TWITTER_X: { bg: "rgba(139, 92, 246, 0.15)", color: "var(--accent-purple)" },
  GOOGLE_ADS: { bg: "rgba(245, 158, 11, 0.15)", color: "var(--accent-amber)" },
  YOUTUBE: { bg: "rgba(239, 68, 68, 0.15)", color: "var(--accent-red)" },
  PINTEREST: { bg: "rgba(239, 68, 68, 0.15)", color: "var(--accent-red)" },
  SNAPCHAT: { bg: "rgba(245, 158, 11, 0.15)", color: "var(--accent-amber)" },
};

const FILTER_TABS: FilterTab[] = ["ALL", "DRAFT", "SCHEDULED", "PUBLISHED", "FAILED"];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CampaignPostsManager({
  campaign: initialCampaign,
}: {
  campaign: CampaignData;
}) {
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

  /* ---- Batch schedule all drafts ---- */

  const scheduleAllDrafts = async () => {
    const dateStr = prompt("Schedule all drafts starting at (YYYY-MM-DDTHH:mm):");
    if (!dateStr) return;
    const startAt = new Date(dateStr);
    if (isNaN(startAt.getTime()) || startAt <= new Date()) {
      setError("Must be a valid future date");
      return;
    }
    setLoadingAction("batch-schedule");
    clearError();
    try {
      // Schedule each draft sequentially, 60 min apart
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

  /* ---- Helpers ---- */

  const formatDate = (d: string | null) => {
    if (!d) return null;
    return new Date(d).toLocaleString();
  };

  const platformBadge = (platform: string) => {
    const style = PLATFORM_STYLE[platform] ?? { bg: "var(--bg-elevated)", color: "var(--text-secondary)" };
    return (
      <span
        className="badge"
        style={{ background: style.bg, color: style.color }}
      >
        {platform.replace("_", " ")}
      </span>
    );
  };

  const isLoading = (action: string) => loadingAction === action;

  const canEdit = (status: string) => ["DRAFT", "REJECTED"].includes(status);
  const canSchedule = (status: string) => ["DRAFT", "APPROVED", "FAILED"].includes(status);
  const canPublish = (status: string) => ["DRAFT", "APPROVED", "SCHEDULED", "FAILED"].includes(status);
  const canDelete = (status: string) => status !== "DELETED";

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div>
      {/* ---- Error banner ---- */}
      {error && (
        <div
          style={{
            background: "var(--accent-red-muted)",
            color: "var(--accent-red)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "var(--radius-md)",
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.875rem",
          }}
        >
          <span>{error}</span>
          <button
            onClick={clearError}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent-red)",
              cursor: "pointer",
              fontSize: "1.125rem",
              lineHeight: 1,
              padding: "0 0.25rem",
            }}
          >
            x
          </button>
        </div>
      )}

      {/* ---- Campaign header ---- */}
      <PageHeader
        title={campaign.name}
        subtitle={`${campaign.objective} · ${campaign.targetPlatforms.join(", ")}`}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Campaigns", href: "/campaigns" },
          { label: campaign.name },
        ]}
        action={
          <div className="flex items-center gap-2">
            <span className={CAMPAIGN_STATUS_BADGE[campaign.status] ?? "badge badge-neutral"}>
              {campaign.status}
            </span>
          </div>
        }
      />
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href={`/campaigns/${campaign.id}/posts/new`}
          className="btn-primary text-sm"
        >
          Add Post
        </Link>
        {draftPosts.length > 0 && (
          <>
            <button
              className="btn-secondary text-sm"
              disabled={isLoading("batch-schedule")}
              onClick={scheduleAllDrafts}
            >
              {isLoading("batch-schedule") ? "Scheduling..." : `Schedule All Drafts (${draftPosts.length})`}
            </button>
            <button
              className="btn-secondary text-sm"
              disabled={isLoading("batch-publish")}
              onClick={publishAllDrafts}
            >
              {isLoading("batch-publish") ? "Publishing..." : `Publish All Drafts (${draftPosts.length})`}
            </button>
          </>
        )}
      </div>

      {/* ---- Filter tabs ---- */}
      <div
        style={{
          display: "flex",
          gap: "0.25rem",
          marginBottom: "1.25rem",
          borderBottom: "1px solid var(--border-secondary)",
          paddingBottom: "0",
        }}
      >
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
              style={{
                background: "none",
                border: "none",
                borderBottom: active ? "2px solid var(--accent-blue)" : "2px solid transparent",
                color: active ? "var(--accent-blue)" : "var(--text-secondary)",
                padding: "0.5rem 1rem",
                fontSize: "0.8125rem",
                fontWeight: active ? 600 : 400,
                cursor: "pointer",
                transition: "color 0.15s, border-color 0.15s",
              }}
            >
              {tab} ({count})
            </button>
          );
        })}
      </div>

      {/* ---- Posts list ---- */}
      {filteredPosts.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>
          {filter === "ALL"
            ? "No posts yet. Add your first post to this campaign."
            : `No ${filter.toLowerCase()} posts.`}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filteredPosts.map((post) => {
            const isExpanded = expandedPosts.has(post.id);
            const isLong = post.content.length > 200;
            const displayContent = isLong && !isExpanded ? post.content.substring(0, 200) + "..." : post.content;
            const isEditing = editingPostId === post.id;
            const isScheduling = schedulingPostId === post.id;
            const isPublishingThis = publishingPostId === post.id;
            const connectionsForPlatform = connections.filter((c) => c.platform === post.platform);

            return (
              <div key={post.id} className="card" style={{ position: "relative" }}>
                {/* ---- Top row: platform + status ---- */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {platformBadge(post.platform)}
                    <span className={STATUS_BADGE[post.status] ?? "badge badge-neutral"}>
                      {post.status.replace("_", " ")}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                    {/* Edit */}
                    {canEdit(post.status) && !isEditing && (
                      <button
                        className="btn-secondary"
                        style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem", minHeight: 36 }}
                        onClick={() => startEditing(post)}
                      >
                        Edit
                      </button>
                    )}
                    {/* Schedule */}
                    {canSchedule(post.status) && !isScheduling && (
                      <button
                        className="btn-secondary"
                        style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem", minHeight: 36 }}
                        onClick={() => startScheduling(post.id)}
                      >
                        Schedule
                      </button>
                    )}
                    {/* Publish Now */}
                    {canPublish(post.status) && !isPublishingThis && (
                      <button
                        className="btn-primary"
                        style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem", minHeight: 36 }}
                        onClick={() => startPublishing(post)}
                      >
                        Publish Now
                      </button>
                    )}
                    {/* Delete */}
                    {canDelete(post.status) && (
                      <button
                        className="btn-danger"
                        style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem", minHeight: 36 }}
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
                  <div style={{ marginBottom: "0.75rem" }}>
                    <textarea
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
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                      <button
                        className="btn-primary"
                        style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem", minHeight: 36 }}
                        disabled={isLoading(`edit-${post.id}`) || editContent.trim() === ""}
                        onClick={() => saveEdit(post)}
                      >
                        {isLoading(`edit-${post.id}`) ? "Saving..." : "Save"}
                      </button>
                      <button
                        className="btn-secondary"
                        style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem", minHeight: 36 }}
                        onClick={cancelEditing}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <p
                      style={{
                        color: "var(--text-primary)",
                        fontSize: "0.875rem",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        margin: 0,
                      }}
                    >
                      {displayContent}
                    </p>
                    {isLong && (
                      <button
                        onClick={() => toggleExpand(post.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--accent-blue)",
                          fontSize: "0.75rem",
                          cursor: "pointer",
                          padding: "0.25rem 0",
                          marginTop: "0.25rem",
                        }}
                      >
                        {isExpanded ? "Show less" : "Show more"}
                      </button>
                    )}
                  </div>
                )}

                {/* ---- Schedule inline form ---- */}
                {isScheduling && (
                  <div
                    style={{
                      background: "var(--bg-tertiary)",
                      borderRadius: "var(--radius-md)",
                      padding: "0.75rem",
                      marginBottom: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <label style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
                      Schedule for:
                    </label>
                    <input
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
                  <div
                    style={{
                      background: "var(--bg-tertiary)",
                      borderRadius: "var(--radius-md)",
                      padding: "0.75rem",
                      marginBottom: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <label style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
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
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  {post.rejectionReason && (
                    <p style={{ color: "var(--accent-red)", fontSize: "0.75rem", margin: 0 }}>
                      Rejected: {post.rejectionReason}
                    </p>
                  )}
                  {post.errorMessage && (
                    <p style={{ color: "var(--accent-red)", fontSize: "0.75rem", margin: 0 }}>
                      Error: {post.errorMessage}
                    </p>
                  )}
                  {post.scheduledAt && (
                    <p style={{ color: "var(--text-tertiary)", fontSize: "0.75rem", margin: 0 }}>
                      Scheduled: {formatDate(post.scheduledAt)}
                    </p>
                  )}
                  {post.publishedAt && (
                    <p style={{ color: "var(--accent-emerald)", fontSize: "0.75rem", margin: 0 }}>
                      Published: {formatDate(post.publishedAt)}
                      {post.platformPostId && (
                        <span style={{ marginLeft: "0.5rem" }}>
                          (ID: {post.platformPostId})
                        </span>
                      )}
                    </p>
                  )}
                  {post.approver?.name && (
                    <p style={{ color: "var(--text-tertiary)", fontSize: "0.75rem", margin: 0 }}>
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
