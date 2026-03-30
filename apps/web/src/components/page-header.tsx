export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1" style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm, 0.875rem)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
