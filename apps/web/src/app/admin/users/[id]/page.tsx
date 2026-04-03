import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { relativeTime } from "../../components/relative-time";
import { UserActions } from "./components/user-actions";
import { UserTabs } from "./components/user-tabs";
import { ProfileEditForm } from "./components/profile-edit-form";
import Link from "next/link";

function statusColor(status: string): string {
  switch (status) {
    case "ACTIVE": return "#30a46c";
    case "SUSPENDED": return "#e5a100";
    case "BANNED": return "#e5484d";
    default: return "#6b7280";
  }
}

function roleColor(role: string): string {
  switch (role) {
    case "SUPER_ADMIN": return "var(--accent-blue)";
    case "ADMIN": return "#6b4fbb";
    default: return "#6b7280";
  }
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [user, auditLogs, posts, loginLogs] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: {
        memberships: {
          include: {
            organization: {
              select: { id: true, name: true, plan: true, slug: true },
            },
          },
        },
      },
    }),
    prisma.auditLog.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.post.findMany({
      where: {
        organization: {
          memberships: { some: { userId: id } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        platform: true,
        status: true,
        content: true,
        scheduledAt: true,
        publishedAt: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.findMany({
      where: { userId: id, action: { in: ["USER_LOGIN", "LOGIN", "SIGN_IN"] } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  if (!user) notFound();

  const thStyle: React.CSSProperties = {
    textAlign: "left",
    padding: "8px 12px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-secondary)",
    borderBottom: "1px solid var(--border-primary, #2a2a2a)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const tdStyle: React.CSSProperties = {
    padding: "10px 12px",
    fontSize: 13,
    color: "var(--text-primary)",
    borderBottom: "1px solid var(--border-primary, #2a2a2a)",
  };

  const badgeStyle = (bg: string): React.CSSProperties => ({
    display: "inline-block",
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 4,
    background: bg,
    color: "#fff",
    fontWeight: 600,
    textTransform: "uppercase",
  });

  const sectionStyle: React.CSSProperties = {
    background: "var(--bg-secondary)",
    borderRadius: 8,
    border: "1px solid var(--border-primary, #2a2a2a)",
    padding: 20,
  };

  // ── Profile tab content ─────────────────────────────
  const profileTab = (
    <div style={sectionStyle}>
      <ProfileEditForm
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          timezone: user.timezone,
          locale: user.locale,
          status: user.status,
          systemRole: user.systemRole,
        }}
      />
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-primary, #2a2a2a)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(100px, 140px) 1fr", gap: 8, padding: "6px 0" }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Login Count</span>
          <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{user.loginCount}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(100px, 140px) 1fr", gap: 8, padding: "6px 0" }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Last Login</span>
          <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{relativeTime(user.lastLoginAt)}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(100px, 140px) 1fr", gap: 8, padding: "6px 0" }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Last Login IP</span>
          <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{user.lastLoginIp ?? "—"}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(100px, 140px) 1fr", gap: 8, padding: "6px 0" }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Created</span>
          <span style={{ fontSize: 13, color: "var(--text-primary)" }}>
            {user.createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(100px, 140px) 1fr", gap: 8, padding: "6px 0" }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Onboarding</span>
          <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{user.onboardingComplete ? "Complete" : "Incomplete"}</span>
        </div>
      </div>
    </div>
  );

  // ── Organizations tab ───────────────────────────────
  const orgsTab = (
    <div style={sectionStyle}>
      {user.memberships.length === 0 ? (
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>No organizations.</p>
      ) : (
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 400 }}>
            <thead>
              <tr>
                <th style={thStyle}>Organization</th>
                <th style={thStyle}>Plan</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {user.memberships.map((m) => (
                <tr key={m.id}>
                  <td style={tdStyle}>{m.organization.name}</td>
                  <td style={tdStyle}>{m.organization.plan}</td>
                  <td style={tdStyle}>{m.role}</td>
                  <td style={tdStyle}>{relativeTime(m.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // ── Activity tab ────────────────────────────────────
  const activityTab = (
    <div style={sectionStyle}>
      {auditLogs.length === 0 ? (
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>No activity.</p>
      ) : (
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
            <thead>
              <tr>
                <th style={thStyle}>Time</th>
                <th style={thStyle}>Action</th>
                <th style={thStyle}>Entity</th>
                <th style={thStyle}>Entity ID</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td style={tdStyle}>{relativeTime(log.createdAt)}</td>
                  <td style={tdStyle}>
                    <span style={{ fontFamily: "monospace", fontSize: 12, padding: "2px 6px", borderRadius: 3, background: "var(--bg-primary)" }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={tdStyle}>{log.entityType}</td>
                  <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 12 }}>{log.entityId.slice(0, 16)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // ── Posts tab ───────────────────────────────────────
  const postsTab = (
    <div style={sectionStyle}>
      {posts.length === 0 ? (
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>No posts.</p>
      ) : (
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
            <thead>
              <tr>
                <th style={thStyle}>Platform</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Content</th>
                <th style={thStyle}>Scheduled</th>
                <th style={thStyle}>Published</th>
                <th style={thStyle}>Created</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td style={tdStyle}>{post.platform}</td>
                  <td style={tdStyle}>
                    <span style={badgeStyle(post.status === "PUBLISHED" ? "#30a46c" : post.status === "FAILED" ? "#e5484d" : "#6b7280")}>
                      {post.status}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {post.content.slice(0, 80)}{post.content.length > 80 ? "..." : ""}
                  </td>
                  <td style={tdStyle}>{post.scheduledAt ? relativeTime(post.scheduledAt) : "—"}</td>
                  <td style={tdStyle}>{post.publishedAt ? relativeTime(post.publishedAt) : "—"}</td>
                  <td style={tdStyle}>{relativeTime(post.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // ── Sessions tab (JWT strategy — show login activity) ──
  const sessionsTab = (
    <div style={sectionStyle}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(100px, 140px) 1fr", gap: 8, padding: "6px 0" }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Auth Strategy</span>
          <span style={{ fontSize: 13, color: "var(--text-primary)" }}>JWT (stateless)</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(100px, 140px) 1fr", gap: 8, padding: "6px 0" }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Total Logins</span>
          <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{user.loginCount}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(100px, 140px) 1fr", gap: 8, padding: "6px 0" }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Last Login</span>
          <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{relativeTime(user.lastLoginAt)}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(100px, 140px) 1fr", gap: 8, padding: "6px 0" }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Last IP</span>
          <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{user.lastLoginIp ?? "—"}</span>
        </div>
      </div>

      {loginLogs.length > 0 && (
        <>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: "16px 0 8px" }}>Login History</h4>
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 400 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Time</th>
                  <th style={thStyle}>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {loginLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={tdStyle}>{relativeTime(log.createdAt)}</td>
                    <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 12 }}>{log.ipAddress ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 16, fontSize: 13 }}>
        <Link href="/admin/users" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
          Users
        </Link>
        <span style={{ color: "var(--text-secondary)", margin: "0 8px" }}>/</span>
        <span style={{ color: "var(--text-primary)" }}>{user.name ?? user.email}</span>
      </div>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            {user.name ?? "Unnamed User"}
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "4px 0 8px" }}>{user.email}</p>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={badgeStyle(statusColor(user.status))}>{user.status}</span>
            <span style={badgeStyle(roleColor(user.systemRole))}>{user.systemRole.replace("_", " ")}</span>
          </div>
        </div>
        <UserActions userId={user.id} userEmail={user.email} status={user.status} />
      </div>

      {/* Tabs */}
      <UserTabs>
        {{
          Profile: profileTab,
          Organizations: orgsTab,
          Activity: activityTab,
          Posts: postsTab,
          Sessions: sessionsTab,
        }}
      </UserTabs>
    </div>
  );
}
