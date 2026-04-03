import { prisma } from "@/lib/db";
import Link from "next/link";

export const metadata = {
  title: "Ingestion Jobs — Admin",
  robots: { index: false },
};

function statusColor(status: string): string {
  switch (status) {
    case "COMPLETED": return "var(--accent-emerald, #10b981)";
    case "RUNNING": return "var(--accent-blue, #3b82f6)";
    case "PAUSED": return "var(--accent-amber, #f59e0b)";
    case "FAILED": return "var(--accent-red, #ef4444)";
    case "CANCELLED": return "var(--text-tertiary, #888)";
    default: return "var(--text-tertiary, #888)";
  }
}

function relativeTime(date: Date): string {
  const now = new Date();
  const diffMs = Math.abs(now.getTime() - date.getTime());
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function AdminIngestionPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; platform?: string; page?: string }>;
}) {
  const params = await searchParams;
  // Check if ingestion tables exist (may not be migrated yet)
  let tablesExist = true;
  try {
    await prisma.ingestionJob.count({ take: 0 });
  } catch {
    tablesExist = false;
  }

  if (!tablesExist) {
    return (
      <div className="text-center py-16">
        <h1 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Ingestion Not Available</h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Database migration required. Run <code>prisma migrate deploy</code> to add ingestion tables.</p>
      </div>
    );
  }

  const currentPage = parseInt(params.page || "1", 10);
  const pageSize = 25;

  // Build filters
  const where: Record<string, unknown> = {};
  if (params.status && params.status !== "ALL") {
    where.status = params.status;
  }

  // Stats
  const [totalJobs, activeJobs, completedToday, failedJobs, totalHistoricalPosts] = await Promise.all([
    prisma.ingestionJob.count(),
    prisma.ingestionJob.count({ where: { status: { in: ["RUNNING", "PENDING"] } } }),
    prisma.ingestionJob.count({
      where: {
        status: "COMPLETED",
        completedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.ingestionJob.count({ where: { status: { in: ["FAILED", "PAUSED"] } } }),
    prisma.historicalPost.count(),
  ]);

  // Paginated job list
  const [jobs, totalCount] = await Promise.all([
    prisma.ingestionJob.findMany({
      where,
      include: {
        page: {
          select: { id: true, name: true, platform: true, orgId: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (currentPage - 1) * pageSize,
    }),
    prisma.ingestionJob.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Historical Ingestion
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Monitor and manage historical data imports from connected social accounts.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total Jobs", value: totalJobs, color: "var(--accent-blue)" },
          { label: "Active Now", value: activeJobs, color: "var(--accent-emerald)" },
          { label: "Completed Today", value: completedToday, color: "var(--accent-purple)" },
          { label: "Failed / Paused", value: failedJobs, color: failedJobs > 0 ? "var(--accent-red)" : "var(--text-tertiary)" },
          { label: "Historical Posts", value: totalHistoricalPosts.toLocaleString(), color: "var(--accent-blue)" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg p-4 border"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border-secondary)" }}
          >
            <div className="text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>
              {stat.label}
            </div>
            <div className="text-2xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        {["ALL", "PENDING", "RUNNING", "PAUSED", "COMPLETED", "FAILED", "CANCELLED"].map((s) => (
          <Link
            key={s}
            href={`/admin/ingestion?status=${s}`}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: (params.status || "ALL") === s ? "var(--accent-blue)" : "var(--bg-tertiary)",
              color: (params.status || "ALL") === s ? "#fff" : "var(--text-secondary)",
              border: "1px solid var(--border-primary)",
            }}
          >
            {s}
          </Link>
        ))}
      </div>

      {/* Jobs Table */}
      <div
        className="rounded-lg border"
        style={{ background: "var(--bg-secondary)", borderColor: "var(--border-secondary)", overflow: "hidden" }}
      >
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table className="w-full text-sm" style={{ minWidth: 650 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-secondary)" }}>
              {["Page", "Platform", "Status", "Progress", "Processed", "Started", "Duration", "Error"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-medium"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
                  No ingestion jobs found.
                </td>
              </tr>
            ) : (
              jobs.map((job) => {
                const durationMs = job.startedAt
                  ? (job.completedAt ?? new Date()).getTime() - job.startedAt.getTime()
                  : 0;
                const durationMin = Math.round(durationMs / 60000);

                return (
                  <tr
                    key={job.id}
                    className="transition-colors"
                    style={{ borderBottom: "1px solid var(--border-secondary)" }}
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {job.page?.name || "Unknown"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                      >
                        {job.page?.platform || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{ background: `${statusColor(job.status)}20`, color: statusColor(job.status) }}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-1.5 w-20 rounded-full overflow-hidden"
                          style={{ background: "var(--bg-tertiary)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.round(job.progress * 100)}%`,
                              background: statusColor(job.status),
                            }}
                          />
                        </div>
                        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                          {Math.round(job.progress * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                      {job.processedItems.toLocaleString()}
                      {job.totalItems ? ` / ${job.totalItems.toLocaleString()}` : ""}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {job.startedAt ? relativeTime(job.startedAt) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {durationMin > 0 ? `${durationMin}m` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs max-w-[200px] truncate" style={{ color: "var(--accent-red)" }}>
                      {job.errorMessage || "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalCount)} of {totalCount}
          </span>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={`/admin/ingestion?status=${params.status || "ALL"}&page=${currentPage - 1}`}
                className="px-3 py-1.5 rounded text-xs"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)", border: "1px solid var(--border-primary)" }}
              >
                Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/admin/ingestion?status=${params.status || "ALL"}&page=${currentPage + 1}`}
                className="px-3 py-1.5 rounded text-xs"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)", border: "1px solid var(--border-primary)" }}
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
