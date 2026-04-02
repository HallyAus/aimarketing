"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  formatSmartDate,
  formatTimeOnly,
  getRelativeTime,
  getUserTimezone,
} from "@/lib/timezone";

export interface CalendarPost {
  id: string;
  campaignId: string | null;
  content: string;
  platform: string;
  pageName: string | null;
  pageId: string | null;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  campaignName: string | null;
  errorMessage: string | null;
  version: number;
}

interface PostDetailPanelProps {
  post: CalendarPost | null;
  onClose: () => void;
  onPostUpdated: () => void;
}

const PLATFORM_LABELS: Record<string, string> = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
  TWITTER_X: "Twitter/X",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  PINTEREST: "Pinterest",
  GOOGLE_ADS: "Google Ads",
  SNAPCHAT: "Snapchat",
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  SCHEDULED: { bg: "var(--accent-blue-muted)", text: "var(--accent-blue)", label: "Scheduled" },
  PUBLISHED: { bg: "var(--accent-emerald-muted)", text: "var(--accent-emerald)", label: "Published" },
  DRAFT: { bg: "var(--bg-tertiary)", text: "var(--text-tertiary)", label: "Draft" },
  FAILED: { bg: "var(--accent-red-muted)", text: "var(--accent-red)", label: "Failed" },
  PENDING_APPROVAL: { bg: "var(--accent-amber-muted)", text: "var(--accent-amber)", label: "Pending Approval" },
  DELETED: { bg: "var(--accent-red-muted)", text: "var(--accent-red)", label: "Deleted" },
};

export function PostDetailPanel({
  post,
  onClose,
  onPostUpdated,
}: PostDetailPanelProps) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [rescheduling, setRescheduling] = useState(false);
  const [newScheduleDate, setNewScheduleDate] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState("");

  // Update countdown every second
  useEffect(() => {
    if (!post) return;
    const date = post.scheduledAt ?? post.publishedAt;
    if (!date) return;

    function update() {
      setCountdown(getRelativeTime(date!));
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [post]);

  // Reset state when post changes
  useEffect(() => {
    setEditing(false);
    setRescheduling(false);
    setConfirmDelete(false);
    setError(null);
    if (post) {
      setEditContent(post.content);
      if (post.scheduledAt) {
        const d = new Date(post.scheduledAt);
        setNewScheduleDate(
          d.toISOString().slice(0, 16) // YYYY-MM-DDTHH:MM format for input
        );
      }
    }
  }, [post]);

  const handleSaveContent = useCallback(async () => {
    if (!post) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editContent,
          version: post.version,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update post");
      }
      setEditing(false);
      onPostUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }, [post, editContent, onPostUpdated]);

  const handleReschedule = useCallback(async () => {
    if (!post || !newScheduleDate) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${post.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledAt: new Date(newScheduleDate).toISOString(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reschedule");
      }
      setRescheduling(false);
      onPostUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reschedule");
    } finally {
      setLoading(false);
    }
  }, [post, newScheduleDate, onPostUpdated]);

  const handleDelete = useCallback(async () => {
    if (!post) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      onClose();
      onPostUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setLoading(false);
    }
  }, [post, onClose, onPostUpdated]);

  const handlePublishNow = useCallback(async () => {
    if (!post) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${post.id}/publish`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to publish");
      }
      onPostUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setLoading(false);
    }
  }, [post, onPostUpdated]);

  if (!post) return null;

  const statusStyle = STATUS_STYLES[post.status] ?? STATUS_STYLES.DRAFT!;
  const tz = getUserTimezone();
  const dateToShow = post.scheduledAt ?? post.publishedAt;
  const isScheduled = post.status === "SCHEDULED";
  const isPublished = post.status === "PUBLISHED";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Post details"
        style={{
          background: "var(--bg-primary)",
          borderLeft: "1px solid var(--border-primary)",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
          style={{
            background: "var(--bg-primary)",
            borderBottom: "1px solid var(--border-primary)",
          }}
        >
          <h2
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Post Details
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            aria-label="Close panel"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Error banner */}
          {error && (
            <div
              className="p-3 rounded-lg text-sm"
              style={{
                background: "var(--accent-red-muted)",
                color: "var(--accent-red)",
                border: "1px solid var(--accent-red)",
              }}
            >
              {error}
            </div>
          )}

          {/* Status + Platform row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-medium px-2 py-1 rounded"
              style={{ background: statusStyle.bg, color: statusStyle.text }}
            >
              {statusStyle.label}
            </span>
            <span className="badge badge-info text-[10px]">
              {PLATFORM_LABELS[post.platform] ?? post.platform}
            </span>
            {post.pageName && (
              <span
                className="text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                {post.pageName}
              </span>
            )}
          </div>

          {/* Schedule info */}
          {dateToShow && (
            <div
              className="p-3 rounded-lg"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-primary)",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div
                    className="text-xs font-medium mb-0.5"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {isPublished ? "Published" : "Scheduled"}
                  </div>
                  <div
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {formatSmartDate(dateToShow, tz)}
                  </div>
                </div>
                <div
                  className="text-xs font-medium px-2 py-1 rounded"
                  style={{
                    background: isScheduled
                      ? "var(--accent-blue-muted)"
                      : "var(--accent-emerald-muted)",
                    color: isScheduled
                      ? "var(--accent-blue)"
                      : "var(--accent-emerald)",
                  }}
                >
                  {isScheduled && countdown.startsWith("in")
                    ? `Goes live ${countdown}`
                    : isPublished
                      ? `Posted ${countdown}`
                      : countdown}
                </div>
              </div>
            </div>
          )}

          {/* Post content */}
          <div>
            <div
              className="text-xs font-medium mb-2"
              style={{ color: "var(--text-tertiary)" }}
            >
              Content
            </div>
            {editing ? (
              <div className="space-y-2">
                <label htmlFor="post-edit-content" className="sr-only">Edit post content</label>
                <textarea
                  id="post-edit-content"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full rounded-lg p-3 text-sm resize-y min-h-[120px]"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-primary)",
                    color: "var(--text-primary)",
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveContent}
                    disabled={loading}
                    className="btn-primary text-xs px-3 py-1.5"
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setEditContent(post.content);
                    }}
                    className="btn-ghost text-xs px-3 py-1.5"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="text-sm leading-relaxed whitespace-pre-wrap p-3 rounded-lg"
                style={{
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-primary)",
                }}
              >
                {post.content}
              </div>
            )}
          </div>

          {/* Reschedule section */}
          {rescheduling && (
            <div
              className="p-3 rounded-lg space-y-3"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-primary)",
              }}
            >
              <label
                htmlFor="reschedule-date"
                className="text-xs font-medium block"
                style={{ color: "var(--text-tertiary)" }}
              >
                Reschedule Post
              </label>
              <input
                id="reschedule-date"
                type="datetime-local"
                value={newScheduleDate}
                onChange={(e) => setNewScheduleDate(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border-primary)",
                  color: "var(--text-primary)",
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReschedule}
                  disabled={loading}
                  className="btn-primary text-xs px-3 py-1.5"
                >
                  {loading ? "Saving..." : "Reschedule"}
                </button>
                <button
                  onClick={() => setRescheduling(false)}
                  className="btn-ghost text-xs px-3 py-1.5"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Delete confirmation */}
          {confirmDelete && (
            <div
              className="p-3 rounded-lg space-y-3"
              style={{
                background: "var(--accent-red-muted)",
                border: "1px solid var(--accent-red)",
              }}
            >
              <p
                className="text-sm font-medium"
                style={{ color: "var(--accent-red)" }}
              >
                Are you sure you want to delete this post?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{
                    background: "var(--accent-red)",
                    color: "white",
                  }}
                >
                  {loading ? "Deleting..." : "Yes, Delete"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="btn-ghost text-xs px-3 py-1.5"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Failed post error */}
          {post.status === "FAILED" && post.errorMessage && (
            <div
              className="p-3 rounded-lg"
              style={{
                background: "var(--accent-red-muted)",
                border: "1px solid var(--accent-red)",
              }}
            >
              <div
                className="text-xs font-medium mb-1"
                style={{ color: "var(--accent-red)" }}
              >
                Error
              </div>
              <p
                className="text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                {post.errorMessage}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {!editing && !rescheduling && (
              <>
                {(post.status === "DRAFT" || post.status === "REJECTED") && (
                  <button
                    onClick={() => setEditing(true)}
                    className="btn-ghost text-xs px-3 py-2 flex items-center gap-1.5 min-h-[44px]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit
                  </button>
                )}
                {isScheduled && (
                  <>
                    <button
                      onClick={() => setRescheduling(true)}
                      className="btn-ghost text-xs px-3 py-2 flex items-center gap-1.5 min-h-[44px]"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                      Reschedule
                    </button>
                    <button
                      onClick={handlePublishNow}
                      disabled={loading}
                      className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5 min-h-[44px]"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                      {loading ? "Publishing..." : "Post Now"}
                    </button>
                  </>
                )}
                {!isPublished && (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 min-h-[44px]"
                    style={{
                      color: "var(--accent-red)",
                      background: "transparent",
                      border: "1px solid var(--accent-red)",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                    Delete
                  </button>
                )}
              </>
            )}
          </div>

          {/* Campaign link */}
          {post.campaignId && (
            <Link
              href={`/campaigns/${post.campaignId}`}
              className="flex items-center gap-2 text-sm font-medium no-underline hover:underline"
              style={{ color: "var(--accent-blue)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              View Campaign: {post.campaignName ?? "Unnamed"}
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
