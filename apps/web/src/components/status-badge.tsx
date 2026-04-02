type StatusBadgeSize = "sm" | "md" | "lg";

const STATUS_CONFIG: Record<string, { className: string; label?: string }> = {
  ACTIVE:           { className: "badge-success" },
  PUBLISHED:        { className: "badge-success" },
  COMPLETED:        { className: "badge-success" },
  SCHEDULED:        { className: "badge-info" },
  PUBLISHING:       { className: "badge-info", label: "Publishing" },
  PENDING_APPROVAL: { className: "badge-warning", label: "Pending Approval" },
  PAUSED:           { className: "badge-warning" },
  FAILED:           { className: "badge-error" },
  EXPIRED:          { className: "badge-error" },
  DRAFT:            { className: "badge-neutral" },
};

const SIZE_CLASSES: Record<StatusBadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1 text-sm",
};

export function StatusBadge({
  status,
  size = "sm",
}: {
  status: string;
  size?: StatusBadgeSize;
}) {
  const config = STATUS_CONFIG[status] ?? { className: "badge-neutral" };
  const label = config.label ?? status.replace(/_/g, " ");
  const sizeClass = SIZE_CLASSES[size];

  return (
    <span className={`badge ${config.className} ${sizeClass}`}>
      {label}
    </span>
  );
}
