"use client";

import { useCallback, useEffect, useState } from "react";

interface IngestionJob {
  id: string;
  status: "PENDING" | "RUNNING" | "PAUSED" | "COMPLETED" | "FAILED" | "CANCELLED";
  progress: number;
  processedItems: number;
  failedItems: number;
  totalItems: number | null;
  errorMessage: string | null;
  rateLimitHits: number;
  nextRetryAfter: string | null;
  completedAt: string | null;
}

interface IngestionBannerProps {
  pageId: string;
}

const POLL_INTERVAL_MS = 5_000;

export function IngestionBanner({ pageId }: IngestionBannerProps) {
  const [job, setJob] = useState<IngestionJob | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/ingestion/status?pageId=${encodeURIComponent(pageId)}`);
      if (!res.ok) {
        setError("Failed to fetch ingestion status");
        return;
      }
      const data = await res.json();
      setJob(data.job);
      setError(null);
    } catch {
      setError("Failed to fetch ingestion status");
    }
  }, [pageId]);

  useEffect(() => {
    fetchStatus();

    const interval = setInterval(() => {
      fetchStatus();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Stop polling once completed/failed/cancelled
  useEffect(() => {
    if (job && ["COMPLETED", "FAILED", "CANCELLED"].includes(job.status)) {
      // One final fetch, then stop
    }
  }, [job]);

  // Don't render if no job, dismissed, or error
  if (!job || dismissed || error) return null;

  // Don't show for old completed jobs (older than 1 hour)
  if (
    job.status === "COMPLETED" &&
    job.completedAt &&
    Date.now() - new Date(job.completedAt).getTime() > 3_600_000
  ) {
    return null;
  }

  // Don't show cancelled jobs
  if (job.status === "CANCELLED") return null;

  const progressPercent = Math.round(job.progress);
  const formattedCount = job.processedItems.toLocaleString();

  return (
    <div className="border-b bg-blue-50 px-4 py-3 dark:bg-blue-950/30">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {/* Status icon */}
          {job.status === "RUNNING" || job.status === "PENDING" ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          ) : job.status === "COMPLETED" ? (
            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : job.status === "FAILED" ? (
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : job.status === "PAUSED" ? (
            <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : null}

          {/* Status text */}
          <div className="min-w-0 flex-1">
            {job.status === "PENDING" && (
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Preparing to import history...
              </p>
            )}

            {job.status === "RUNNING" && (
              <div className="space-y-1">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Importing history... {formattedCount} posts ({progressPercent}%)
                </p>
                <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-blue-200 dark:bg-blue-800">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {job.status === "PAUSED" && (
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Import paused (rate limited). Resuming automatically...
                {job.nextRetryAfter && (
                  <span className="ml-1 text-xs opacity-75">
                    (retry at {new Date(job.nextRetryAfter).toLocaleTimeString()})
                  </span>
                )}
              </p>
            )}

            {job.status === "COMPLETED" && (
              <p className="text-sm text-green-800 dark:text-green-200">
                Import complete! {formattedCount} posts imported
                {job.failedItems > 0 && (
                  <span className="ml-1 text-xs opacity-75">
                    ({job.failedItems.toLocaleString()} failed)
                  </span>
                )}
              </p>
            )}

            {job.status === "FAILED" && (
              <p className="text-sm text-red-800 dark:text-red-200">
                Import failed: {job.errorMessage ?? "Unknown error"}
                {job.processedItems > 0 && (
                  <span className="ml-1 text-xs opacity-75">
                    ({formattedCount} posts imported before failure)
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Dismiss button — only for terminal states */}
        {["COMPLETED", "FAILED"].includes(job.status) && (
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label="Dismiss"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
