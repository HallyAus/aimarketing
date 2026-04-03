import { prisma } from "@/lib/db";
import { relativeTime } from "../components/relative-time";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "System Health | Admin" };

const cardStyle: React.CSSProperties = {
  background: "var(--bg-secondary)",
  border: "1px solid var(--border-primary, #2a2a2a)",
  borderRadius: 8,
  padding: "20px 24px",
};

const statLabel: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  fontWeight: 600,
  marginBottom: 4,
};

const statValue: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: "var(--text-primary)",
};

async function getQueueStatus(): Promise<{ available: boolean; queues: Array<{ name: string; waiting: number; active: number; completed: number; failed: number }> }> {
  try {
    const { default: IORedis } = await import("ioredis");
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) return { available: false, queues: [] };

    const redis = new IORedis(redisUrl, { maxRetriesPerRequest: 1, connectTimeout: 3000 });

    // Try to get BullMQ queue keys
    const keys = await redis.keys("bull:*:id");
    const queueNames = keys.map((k: string) => k.split(":")[1]).filter((n): n is string => !!n);

    const queues = await Promise.all(
      queueNames.slice(0, 10).map(async (name: string) => {
        const [waiting, active, completed, failed] = await Promise.all([
          redis.llen(`bull:${name}:wait`).catch(() => 0),
          redis.llen(`bull:${name}:active`).catch(() => 0),
          redis.scard(`bull:${name}:completed`).catch(() => 0),
          redis.scard(`bull:${name}:failed`).catch(() => 0),
        ]);
        return { name, waiting, active, completed, failed };
      })
    );

    await redis.quit();
    return { available: true, queues };
  } catch {
    return { available: false, queues: [] };
  }
}

export default async function SystemPage() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    queueStatus,
    recentMetrics,
    scheduledNext24h,
    failedLast7d,
  ] = await Promise.all([
    getQueueStatus(),
    prisma.systemMetric.findMany({
      orderBy: { recordedAt: "desc" },
      take: 20,
    }),
    prisma.post.count({
      where: {
        status: "SCHEDULED",
        scheduledAt: { gte: now, lte: next24h },
      },
    }),
    prisma.post.findMany({
      where: {
        status: "FAILED",
        updatedAt: { gte: last7d },
      },
      select: {
        id: true,
        content: true,
        errorMessage: true,
        platform: true,
        updatedAt: true,
        organization: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 24 }}>
        System Health
      </h1>

      {/* Overview cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        <div style={cardStyle}>
          <div style={statLabel}>Scheduled (Next 24h)</div>
          <div style={statValue}>{scheduledNext24h}</div>
        </div>
        <div style={cardStyle}>
          <div style={statLabel}>Failed (Last 7d)</div>
          <div style={{ ...statValue, color: failedLast7d.length > 0 ? "#ef4444" : "var(--text-primary)" }}>
            {failedLast7d.length}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={statLabel}>Redis / BullMQ</div>
          <div style={{ ...statValue, fontSize: 16 }}>
            <span style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 600,
              background: queueStatus.available ? "#22c55e" : "#6b7280",
              color: "#fff",
            }}>
              {queueStatus.available ? "Connected" : "Not Configured"}
            </span>
          </div>
        </div>
      </div>

      {/* Queue status */}
      {queueStatus.available && queueStatus.queues.length > 0 && (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
            Queue Status
          </h2>
          <div style={{ overflowX: "auto", marginBottom: 32 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-primary, #2a2a2a)" }}>
                  {["Queue", "Waiting", "Active", "Completed", "Failed"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 12, textTransform: "uppercase" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {queueStatus.queues.map((q) => (
                  <tr key={q.name} style={{ borderBottom: "1px solid var(--border-primary, #2a2a2a)" }}>
                    <td style={{ padding: "12px", color: "var(--text-primary)", fontFamily: "monospace" }}>{q.name}</td>
                    <td style={{ padding: "12px", color: "var(--text-primary)" }}>{q.waiting}</td>
                    <td style={{ padding: "12px", color: "var(--accent-blue)" }}>{q.active}</td>
                    <td style={{ padding: "12px", color: "#22c55e" }}>{q.completed}</td>
                    <td style={{ padding: "12px", color: q.failed > 0 ? "#ef4444" : "var(--text-primary)" }}>{q.failed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Recent system metrics */}
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
        Recent System Metrics
      </h2>
      {recentMetrics.length === 0 ? (
        <div style={{ padding: 20, color: "var(--text-secondary)", background: "var(--bg-secondary)", borderRadius: 8, marginBottom: 32 }}>
          No system metrics recorded yet
        </div>
      ) : (
        <div style={{ overflowX: "auto", marginBottom: 32 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-primary, #2a2a2a)" }}>
                {["Metric", "Value", "Tags", "Recorded"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 12, textTransform: "uppercase" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentMetrics.map((m) => (
                <tr key={m.id} style={{ borderBottom: "1px solid var(--border-primary, #2a2a2a)" }}>
                  <td style={{ padding: "12px", color: "var(--text-primary)", fontFamily: "monospace", fontSize: 13 }}>{m.metric}</td>
                  <td style={{ padding: "12px", color: "var(--text-primary)", fontWeight: 600 }}>{m.value}</td>
                  <td style={{ padding: "12px", color: "var(--text-secondary)", fontSize: 12, fontFamily: "monospace" }}>
                    {m.tags ? JSON.stringify(m.tags) : "-"}
                  </td>
                  <td style={{ padding: "12px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                    {relativeTime(m.recordedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Failed posts */}
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
        Failed Posts (Last 7 Days)
      </h2>
      {failedLast7d.length === 0 ? (
        <div style={{ padding: 20, color: "#22c55e", background: "var(--bg-secondary)", borderRadius: 8 }}>
          No failed posts in the last 7 days
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-primary, #2a2a2a)" }}>
                {["Content", "Organization", "Platform", "Error", "When"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 12, textTransform: "uppercase" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {failedLast7d.map((post) => (
                <tr key={post.id} style={{ borderBottom: "1px solid var(--border-primary, #2a2a2a)" }}>
                  <td style={{ padding: "12px", color: "var(--text-primary)", maxWidth: 200 }}>
                    {post.content.length > 60 ? post.content.slice(0, 60) + "..." : post.content}
                  </td>
                  <td style={{ padding: "12px", color: "var(--text-secondary)" }}>{post.organization.name}</td>
                  <td style={{ padding: "12px", color: "var(--text-secondary)" }}>{post.platform.replace("_", " ")}</td>
                  <td style={{ padding: "12px", color: "#ef4444", fontSize: 12, maxWidth: 300 }}>
                    {post.errorMessage || "No error message"}
                  </td>
                  <td style={{ padding: "12px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                    {relativeTime(post.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
