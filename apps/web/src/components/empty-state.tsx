export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-12">
      {icon && (
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 text-lg"
          style={{ background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}
        >
          {icon}
        </div>
      )}
      <p className="font-medium" style={{ color: "var(--text-secondary)" }}>{title}</p>
      {description && (
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
