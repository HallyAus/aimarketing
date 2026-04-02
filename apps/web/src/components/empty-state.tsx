import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

function DefaultIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M12 8v4m0 4h.01" />
    </svg>
  );
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-xl"
      style={{
        border: "1px dashed var(--border-primary)",
        background: "var(--bg-secondary)",
      }}
    >
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
        style={{ background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}
      >
        {icon ?? <DefaultIcon />}
      </div>
      <p className="font-medium text-sm" style={{ color: "var(--text-secondary)" }}>
        {title}
      </p>
      {description && (
        <p className="mt-1.5 text-sm max-w-md" style={{ color: "var(--text-tertiary)" }}>
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
