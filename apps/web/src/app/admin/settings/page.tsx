import { prisma } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings | Admin" };

const sectionStyle: React.CSSProperties = {
  background: "var(--bg-secondary)",
  border: "1px solid var(--border-primary, #2a2a2a)",
  borderRadius: 8,
  padding: "24px",
  marginBottom: 20,
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: 4,
};

const valueStyle: React.CSSProperties = {
  fontSize: 15,
  color: "var(--text-primary)",
  fontWeight: 500,
};

export default async function SettingsPage() {
  // Check maintenance mode
  const maintenanceFlag = await prisma.featureFlag.findUnique({
    where: { key: "maintenance_mode" },
  });

  const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;
  const redisConfigured = !!process.env.REDIS_URL;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 24 }}>
        Settings
      </h1>

      {/* Platform Info */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
          Platform Information
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <div style={labelStyle}>Platform Name</div>
            <div style={valueStyle}>ReachPilot</div>
          </div>
          <div>
            <div style={labelStyle}>Support Email</div>
            <div style={valueStyle}>{process.env.SUPPORT_EMAIL || "support@reachpilot.co"}</div>
          </div>
          <div>
            <div style={labelStyle}>Environment</div>
            <div style={valueStyle}>{process.env.NODE_ENV || "development"}</div>
          </div>
          <div>
            <div style={labelStyle}>App URL</div>
            <div style={valueStyle}>{process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}</div>
          </div>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
          Maintenance Mode
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            display: "inline-block",
            padding: "4px 14px",
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 600,
            background: maintenanceFlag?.enabled ? "#ef4444" : "#22c55e",
            color: "#fff",
          }}>
            {maintenanceFlag?.enabled ? "ENABLED" : "DISABLED"}
          </span>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            {maintenanceFlag
              ? "Controlled via Feature Flags"
              : "No maintenance_mode flag exists yet"}
          </span>
          <a
            href={maintenanceFlag ? `/admin/features/${maintenanceFlag.id}` : "/admin/features/new"}
            style={{
              padding: "6px 14px",
              background: "var(--bg-primary)",
              border: "1px solid var(--border-primary, #2a2a2a)",
              borderRadius: 6,
              color: "var(--accent-blue)",
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            {maintenanceFlag ? "Edit Flag" : "Create Flag"}
          </a>
        </div>
      </div>

      {/* Service Connections */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
          Service Connections
        </h2>
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border-primary, #2a2a2a)" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Stripe</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Payment processing</div>
            </div>
            <span style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              background: stripeConfigured ? "#22c55e" : "#f59e0b",
              color: "#fff",
            }}>
              {stripeConfigured ? "Connected" : "Not Configured"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border-primary, #2a2a2a)" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Redis</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Queue processing and caching</div>
            </div>
            <span style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              background: redisConfigured ? "#22c55e" : "#f59e0b",
              color: "#fff",
            }}>
              {redisConfigured ? "Connected" : "Not Configured"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border-primary, #2a2a2a)" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Database</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>PostgreSQL via Prisma</div>
            </div>
            <span style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              background: "#22c55e",
              color: "#fff",
            }}>
              Connected
            </span>
          </div>
        </div>
      </div>

      {/* Rate Limiting */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
          Rate Limiting
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
          <div>
            <div style={labelStyle}>API Rate Limit</div>
            <div style={valueStyle}>{process.env.API_RATE_LIMIT || "100"} req/min</div>
          </div>
          <div>
            <div style={labelStyle}>Auth Rate Limit</div>
            <div style={valueStyle}>{process.env.AUTH_RATE_LIMIT || "10"} req/min</div>
          </div>
          <div>
            <div style={labelStyle}>Upload Rate Limit</div>
            <div style={valueStyle}>{process.env.UPLOAD_RATE_LIMIT || "20"} req/min</div>
          </div>
        </div>
      </div>
    </div>
  );
}
