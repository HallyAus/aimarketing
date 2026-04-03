import { prisma } from "@/lib/db";
import { relativeTime } from "../components/relative-time";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Announcements | Admin" };

const typeColor: Record<string, string> = {
  INFO: "#3b82f6",
  WARNING: "#f59e0b",
  MAINTENANCE: "#ef4444",
  FEATURE: "#22c55e",
};

const tierColor: Record<string, string> = {
  FREE: "#6b7280",
  PRO: "#3b82f6",
  AGENCY: "#8b5cf6",
};

export default async function AnnouncementsPage() {
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>
          Announcements
        </h1>
        <Link
          href="/admin/announcements/new"
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
          Create Announcement
        </Link>
      </div>

      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 600 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-primary, #2a2a2a)" }}>
              {["Title", "Type", "Active", "Show From", "Show Until", "Target Tiers", "Created", "Actions"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 12, textTransform: "uppercase" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {announcements.map((ann) => (
              <tr key={ann.id} style={{ borderBottom: "1px solid var(--border-primary, #2a2a2a)" }}>
                <td style={{ padding: "12px", color: "var(--text-primary)", fontWeight: 500 }}>
                  {ann.title}
                </td>
                <td style={{ padding: "12px" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    background: typeColor[ann.type] || "#6b7280",
                    color: "#fff",
                  }}>
                    {ann.type}
                  </span>
                </td>
                <td style={{ padding: "12px" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "2px 10px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    background: ann.isActive ? "#22c55e" : "#6b7280",
                    color: "#fff",
                  }}>
                    {ann.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </td>
                <td style={{ padding: "12px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                  {ann.showFrom ? relativeTime(ann.showFrom) : "-"}
                </td>
                <td style={{ padding: "12px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                  {ann.showUntil ? relativeTime(ann.showUntil) : "-"}
                </td>
                <td style={{ padding: "12px" }}>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {ann.targetTiers.length === 0 ? (
                      <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>All</span>
                    ) : (
                      ann.targetTiers.map((tier) => (
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
                <td style={{ padding: "12px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                  {relativeTime(ann.createdAt)}
                </td>
                <td style={{ padding: "12px" }}>
                  <Link
                    href={`/admin/announcements/${ann.id}`}
                    style={{ color: "var(--accent-blue)", textDecoration: "none", fontSize: 13 }}
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {announcements.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
                  No announcements yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
