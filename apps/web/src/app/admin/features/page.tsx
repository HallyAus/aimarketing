import { prisma } from "@/lib/db";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Feature Flags | Admin" };

const tierColor: Record<string, string> = {
  FREE: "#6b7280",
  PRO: "#3b82f6",
  AGENCY: "#8b5cf6",
};

export default async function FeaturesPage() {
  const flags = await prisma.featureFlag.findMany({
    orderBy: { key: "asc" },
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>
          Feature Flags
        </h1>
        <Link
          href="/admin/features/new"
          style={{
            padding: "8px 20px",
            background: "var(--accent-blue)",
            border: "none",
            borderRadius: 6,
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Create Flag
        </Link>
      </div>

      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 600 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-primary, #2a2a2a)" }}>
              {["Key", "Name", "Global Enabled", "Enabled Tiers", "Org Overrides", "Actions"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 12, textTransform: "uppercase" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {flags.map((flag) => (
              <tr key={flag.id} style={{ borderBottom: "1px solid var(--border-primary, #2a2a2a)" }}>
                <td style={{ padding: "12px", fontFamily: "monospace", fontSize: 13, color: "var(--text-primary)" }}>
                  {flag.key}
                </td>
                <td style={{ padding: "12px", color: "var(--text-primary)" }}>
                  {flag.name}
                </td>
                <td style={{ padding: "12px" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "2px 10px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    background: flag.enabled ? "#22c55e" : "#6b7280",
                    color: "#fff",
                  }}>
                    {flag.enabled ? "ON" : "OFF"}
                  </span>
                </td>
                <td style={{ padding: "12px" }}>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {flag.enabledForTiers.length === 0 ? (
                      <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>None</span>
                    ) : (
                      flag.enabledForTiers.map((tier) => (
                        <span key={tier} style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          background: tierColor[tier] || "#6b7280",
                          color: "#fff",
                        }}>
                          {tier}
                        </span>
                      ))
                    )}
                  </div>
                </td>
                <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                  {flag.enabledForOrgs.length}
                </td>
                <td style={{ padding: "12px" }}>
                  <Link
                    href={`/admin/features/${flag.id}`}
                    style={{ color: "var(--accent-blue)", textDecoration: "none", fontSize: 13 }}
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {flags.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
                  No feature flags configured
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
