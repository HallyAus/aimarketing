const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "badge-success",
  DRAFT: "badge-neutral",
  SCHEDULED: "badge-info",
  PAUSED: "badge-warning",
  COMPLETED: "badge-purple",
  FAILED: "badge-error",
  DELETED: "badge-neutral",
  PUBLISHED: "badge-success",
  PENDING_APPROVAL: "badge-warning",
};

export function StatusBadge({ status }: { status: string }) {
  const badgeClass = STATUS_STYLES[status] ?? "badge-neutral";
  return <span className={`badge ${badgeClass}`}>{status}</span>;
}
