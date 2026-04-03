"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ClientAccountBanner, useActiveAccount } from "@/components/client-account-banner";

interface Approval {
  id: string;
  postId: string;
  status: string;
  comment: string | null;
  createdAt: string;
  reviewedAt: string | null;
  post: { id: string; content: string; platform: string; pageName: string | null; status: string };
  requester: { id: string; name: string | null; email: string };
  reviewer: { id: string; name: string | null; email: string } | null;
}

export default function ApprovalsPage() {
  const activeAccount = useActiveAccount();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("PENDING");
  const [reviewComment, setReviewComment] = useState("");
  const [activeReview, setActiveReview] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApprovals = useCallback(async () => {
    try {
      const pageId = activeAccount?.id;
      const params = new URLSearchParams({ status: filter });
      if (pageId) params.set("pageId", pageId);
      const res = await fetch(`/api/approvals?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load approvals");
      const data = await res.json();
      setApprovals(data.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load approvals");
    } finally {
      setLoading(false);
    }
  }, [filter, activeAccount?.id]);

  useEffect(() => { fetchApprovals(); }, [fetchApprovals]);

  const handleReview = async (approvalId: string, action: "APPROVED" | "REJECTED") => {
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch("/api/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId, action, comment: reviewComment }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to review");
      }
      setSuccess(`Post ${action.toLowerCase()} successfully`);
      setActiveReview(null);
      setReviewComment("");
      fetchApprovals();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to review");
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = approvals.filter(a => a.status === "PENDING").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Approval Workflow" subtitle={activeAccount ? `Posts submitted by team members waiting for your review \— approve or reject with comments \— ${activeAccount.name}` : "Posts submitted by team members waiting for your review \— approve or reject with comments"} />
        {pendingCount > 0 && (
          <span className="badge badge-warning">{pendingCount} pending</span>
        )}
      </div>
      <ClientAccountBanner account={activeAccount} onClear={() => fetchApprovals()} />

      {success && <div className="alert alert-success mb-4">{success}</div>}
      {error && <div className="alert alert-error mb-4">{error}</div>}

      {/* Filter tabs */}
      <div className="tab-bar mb-6">
        {["PENDING", "APPROVED", "REJECTED", "ALL"].map(s => (
          <button
            key={s}
            onClick={() => { setFilter(s); setLoading(true); }}
            className={`tab-item ${filter === s ? "tab-item-active" : ""}`}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-lg" />)}
        </div>
      ) : approvals.length === 0 ? (
        <EmptyState
          title="No approval requests"
          description={filter === "ALL" ? "No posts pending approval. When team members submit posts for review, they'll appear here." : `No ${filter.toLowerCase()} approval requests found.`}
        />
      ) : (
        <div className="space-y-3">
          {approvals.map(approval => (
            <div key={approval.id} className="card card-hover">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge badge-info text-[10px]">{approval.post.platform}</span>
                    {approval.post.pageName && (
                      <span className="text-xs text-[var(--text-tertiary)]">{approval.post.pageName}</span>
                    )}
                    <span className={`badge text-[10px] ${
                      approval.status === "PENDING" ? "badge-warning" :
                      approval.status === "APPROVED" ? "badge-success" : "badge-error"
                    }`}>
                      {approval.status}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-primary)] line-clamp-3 mb-2">
                    {approval.post.content}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
                    <span>Requested by {approval.requester.name ?? approval.requester.email}</span>
                    <span>{new Date(approval.createdAt).toLocaleDateString()}</span>
                    {approval.reviewer && (
                      <span>Reviewed by {approval.reviewer.name ?? approval.reviewer.email}</span>
                    )}
                  </div>
                  {approval.comment && (
                    <p className="mt-2 text-xs text-[var(--text-secondary)] italic border-l-2 border-[var(--border-primary)] pl-2">
                      {approval.comment}
                    </p>
                  )}
                </div>

                {approval.status === "PENDING" && (
                  <div className="flex-shrink-0">
                    {activeReview === approval.id ? (
                      <div className="space-y-2 w-64">
                        <textarea
                          value={reviewComment}
                          onChange={e => setReviewComment(e.target.value)}
                          placeholder="Add a comment (optional)..."
                          className="w-full h-16 text-xs resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReview(approval.id, "APPROVED")}
                            disabled={actionLoading}
                            className="btn-primary text-xs px-3 py-1.5"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReview(approval.id, "REJECTED")}
                            disabled={actionLoading}
                            className="btn-danger text-xs px-3 py-1.5"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => { setActiveReview(null); setReviewComment(""); }}
                            className="btn-ghost text-xs px-3 py-1.5"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveReview(approval.id)}
                        className="btn-primary text-xs"
                      >
                        Review
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
