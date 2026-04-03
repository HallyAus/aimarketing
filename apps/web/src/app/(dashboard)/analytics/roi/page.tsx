"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/page-header";

interface PlatformRow {
  platform: string;
  adSpend: number;
  conversions: number;
  revenue: number;
}

const PLATFORMS = [
  "Facebook",
  "Instagram",
  "TikTok",
  "LinkedIn",
  "Twitter/X",
  "Google Ads",
  "YouTube",
  "Pinterest",
];

const DEFAULT_ROW: PlatformRow = { platform: "", adSpend: 0, conversions: 0, revenue: 0 };

interface MonthlyEntry {
  month: string;
  adSpend: number;
  revenue: number;
  conversions: number;
}

export default function ROIPage() {
  const [rows, setRows] = useState<PlatformRow[]>([
    { platform: "Facebook", adSpend: 0, conversions: 0, revenue: 0 },
    { platform: "Instagram", adSpend: 0, conversions: 0, revenue: 0 },
  ]);
  const [monthlyData, setMonthlyData] = useState<MonthlyEntry[]>(() => {
    const months: MonthlyEntry[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        adSpend: 0,
        revenue: 0,
        conversions: 0,
      });
    }
    return months;
  });

  function updateRow(index: number, field: keyof PlatformRow, value: string | number) {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  }

  function addRow() {
    const usedPlatforms = new Set(rows.map((r) => r.platform));
    const nextPlatform = PLATFORMS.find((p) => !usedPlatforms.has(p)) || "";
    setRows((prev) => [...prev, { ...DEFAULT_ROW, platform: nextPlatform }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function updateMonthly(index: number, field: keyof MonthlyEntry, value: number) {
    setMonthlyData((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  }

  // Calculate totals
  const totals = useMemo(() => {
    const totalSpend = rows.reduce((sum, r) => sum + r.adSpend, 0);
    const totalRevenue = rows.reduce((sum, r) => sum + r.revenue, 0);
    const totalConversions = rows.reduce((sum, r) => sum + r.conversions, 0);
    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0;
    const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;

    return { totalSpend, totalRevenue, totalConversions, roas, cpa, roi };
  }, [rows]);

  // Per-platform metrics
  const platformMetrics = useMemo(() => {
    return rows.map((r) => ({
      ...r,
      roas: r.adSpend > 0 ? r.revenue / r.adSpend : 0,
      cpa: r.conversions > 0 ? r.adSpend / r.conversions : 0,
      roi: r.adSpend > 0 ? ((r.revenue - r.adSpend) / r.adSpend) * 100 : 0,
    }));
  }, [rows]);

  // Monthly trend max for bar chart
  const maxMonthlyValue = Math.max(
    ...monthlyData.map((m) => Math.max(m.adSpend, m.revenue)),
    1
  );

  return (
    <div className="w-full">
      <PageHeader
        title="ROI Calculator"
        subtitle="Enter your ad spend and revenue \u2014 calculate ROAS, CPA, and ROI per platform"
        breadcrumbs={[
          { label: "Analytics", href: "/analytics" },
          { label: "ROI Calculator" },
        ]}
        action={
          <button onClick={addRow} className="btn-secondary">
            + Add Platform
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="metric-card text-center">
          <div className="text-2xl font-bold" style={{ color: "var(--accent-blue)" }}>
            {totals.roas.toFixed(2)}x
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
            ROAS (Return on Ad Spend)
          </div>
        </div>
        <div className="metric-card text-center">
          <div className="text-2xl font-bold" style={{ color: "var(--accent-amber)" }}>
            ${totals.cpa.toFixed(2)}
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
            CPA (Cost per Acquisition)
          </div>
        </div>
        <div className="metric-card text-center">
          <div
            className="text-2xl font-bold"
            style={{
              color: totals.roi >= 0 ? "var(--accent-emerald)" : "var(--accent-red)",
            }}
          >
            {totals.roi >= 0 ? "+" : ""}
            {totals.roi.toFixed(1)}%
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
            ROI Percentage
          </div>
        </div>
      </div>

      {/* Input Table */}
      <div className="card mb-8">
        <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          Per-Platform Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border-secondary)" }}>
                <th className="text-left py-3 px-3 font-semibold" style={{ color: "var(--text-tertiary)" }}>
                  Platform
                </th>
                <th className="text-right py-3 px-3 font-semibold" style={{ color: "var(--text-tertiary)" }}>
                  Ad Spend ($)
                </th>
                <th className="text-right py-3 px-3 font-semibold" style={{ color: "var(--text-tertiary)" }}>
                  Conversions
                </th>
                <th className="text-right py-3 px-3 font-semibold" style={{ color: "var(--text-tertiary)" }}>
                  Revenue ($)
                </th>
                <th className="text-right py-3 px-3 font-semibold" style={{ color: "var(--text-tertiary)" }}>
                  ROAS
                </th>
                <th className="text-right py-3 px-3 font-semibold" style={{ color: "var(--text-tertiary)" }}>
                  CPA
                </th>
                <th className="text-right py-3 px-3 font-semibold" style={{ color: "var(--text-tertiary)" }}>
                  ROI
                </th>
                <th className="py-3 px-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const m = platformMetrics[i]!;
                return (
                  <tr key={i} className="table-row">
                    <td className="py-2 px-3">
                      <select
                        value={row.platform}
                        onChange={(e) => updateRow(i, "platform", e.target.value)}
                        className="text-sm py-1"
                      >
                        <option value="">Select...</option>
                        {PLATFORMS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.adSpend || ""}
                        onChange={(e) => updateRow(i, "adSpend", parseFloat(e.target.value) || 0)}
                        className="w-28 text-right text-sm py-1"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min="0"
                        value={row.conversions || ""}
                        onChange={(e) => updateRow(i, "conversions", parseInt(e.target.value) || 0)}
                        className="w-24 text-right text-sm py-1"
                        placeholder="0"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.revenue || ""}
                        onChange={(e) => updateRow(i, "revenue", parseFloat(e.target.value) || 0)}
                        className="w-28 text-right text-sm py-1"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="py-2 px-3 text-right" style={{ color: "var(--text-secondary)" }}>
                      {m.roas.toFixed(2)}x
                    </td>
                    <td className="py-2 px-3 text-right" style={{ color: "var(--text-secondary)" }}>
                      ${m.cpa.toFixed(2)}
                    </td>
                    <td
                      className="py-2 px-3 text-right font-medium"
                      style={{
                        color: m.roi >= 0 ? "var(--accent-emerald)" : "var(--accent-red)",
                      }}
                    >
                      {m.roi >= 0 ? "+" : ""}
                      {m.roi.toFixed(1)}%
                    </td>
                    <td className="py-2 px-3">
                      {rows.length > 1 && (
                        <button
                          onClick={() => removeRow(i)}
                          className="text-xs btn-ghost"
                          style={{ color: "var(--accent-red)", minHeight: "auto" }}
                        >
                          X
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {/* Totals row */}
              <tr className="border-t-2" style={{ borderColor: "var(--border-primary)" }}>
                <td className="py-3 px-3 font-semibold" style={{ color: "var(--text-primary)" }}>
                  Total
                </td>
                <td className="py-3 px-3 text-right font-semibold" style={{ color: "var(--text-primary)" }}>
                  ${totals.totalSpend.toFixed(2)}
                </td>
                <td className="py-3 px-3 text-right font-semibold" style={{ color: "var(--text-primary)" }}>
                  {totals.totalConversions}
                </td>
                <td className="py-3 px-3 text-right font-semibold" style={{ color: "var(--text-primary)" }}>
                  ${totals.totalRevenue.toFixed(2)}
                </td>
                <td className="py-3 px-3 text-right font-bold" style={{ color: "var(--accent-blue)" }}>
                  {totals.roas.toFixed(2)}x
                </td>
                <td className="py-3 px-3 text-right font-bold" style={{ color: "var(--accent-amber)" }}>
                  ${totals.cpa.toFixed(2)}
                </td>
                <td
                  className="py-3 px-3 text-right font-bold"
                  style={{
                    color: totals.roi >= 0 ? "var(--accent-emerald)" : "var(--accent-red)",
                  }}
                >
                  {totals.roi >= 0 ? "+" : ""}
                  {totals.roi.toFixed(1)}%
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="card">
        <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          Monthly Trend
        </h3>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border-secondary)" }}>
                <th className="text-left py-2 px-3" style={{ color: "var(--text-tertiary)" }}>Month</th>
                <th className="text-right py-2 px-3" style={{ color: "var(--text-tertiary)" }}>Ad Spend ($)</th>
                <th className="text-right py-2 px-3" style={{ color: "var(--text-tertiary)" }}>Revenue ($)</th>
                <th className="text-right py-2 px-3" style={{ color: "var(--text-tertiary)" }}>Conversions</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((m, i) => (
                <tr key={m.month} className="table-row">
                  <td className="py-2 px-3" style={{ color: "var(--text-secondary)" }}>{m.month}</td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={m.adSpend || ""}
                      onChange={(e) => updateMonthly(i, "adSpend", parseFloat(e.target.value) || 0)}
                      className="w-28 text-right text-sm py-1"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={m.revenue || ""}
                      onChange={(e) => updateMonthly(i, "revenue", parseFloat(e.target.value) || 0)}
                      className="w-28 text-right text-sm py-1"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min="0"
                      value={m.conversions || ""}
                      onChange={(e) => updateMonthly(i, "conversions", parseInt(e.target.value) || 0)}
                      className="w-24 text-right text-sm py-1"
                      placeholder="0"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Visual bar chart */}
        <div className="flex items-end gap-3 h-40 mt-6 px-3">
          {monthlyData.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-1 items-end" style={{ height: "120px" }}>
                <div
                  className="flex-1 rounded-t transition-all"
                  style={{
                    height: `${(m.adSpend / maxMonthlyValue) * 100}%`,
                    background: "var(--accent-red-muted)",
                    minHeight: m.adSpend > 0 ? "4px" : "0",
                  }}
                />
                <div
                  className="flex-1 rounded-t transition-all"
                  style={{
                    height: `${(m.revenue / maxMonthlyValue) * 100}%`,
                    background: "var(--accent-emerald-muted)",
                    minHeight: m.revenue > 0 ? "4px" : "0",
                  }}
                />
              </div>
              <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                {m.month.split(" ")[0]}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: "var(--accent-red-muted)" }} />
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Ad Spend</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: "var(--accent-emerald-muted)" }} />
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Revenue</span>
          </div>
        </div>
      </div>
    </div>
  );
}
