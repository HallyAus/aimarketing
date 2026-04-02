"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { useActiveAccount } from "@/components/client-account-banner";

interface Report {
  id: string;
  reportType: string;
  startDate: string;
  endDate: string;
  data: Record<string, unknown>;
  sentTo: string[];
  createdAt: string;
  page: { id: string; name: string; platform: string } | null;
}

export default function ReportsPage() {
  const activeAccount = useActiveAccount();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showGenerate, setShowGenerate] = useState(false);
  const [previewReport, setPreviewReport] = useState<Record<string, unknown> | null>(null);

  // Generation form
  const [reportType, setReportType] = useState("WEEKLY");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [clientName, setClientName] = useState("");
  const [brandColor, setBrandColor] = useState("#3b82f6");
  const [sendTo, setSendTo] = useState("");

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch("/api/reports/generate");
      if (!res.ok) throw new Error("Failed to load reports");
      const data = await res.json();
      setReports(data.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const generateReport = async () => {
    setGenerating(true);
    setError("");
    try {
      const emails = sendTo.split(",").map(e => e.trim()).filter(Boolean);
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: activeAccount?.id ?? undefined,
          reportType,
          startDate,
          endDate,
          clientName: clientName || "Client",
          brandColor,
          sendTo: emails,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to generate report");
      }
      const data = await res.json();
      setPreviewReport(data.reportData);
      setSuccess("Report generated successfully");
      setShowGenerate(false);
      fetchReports();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const renderMetric = (label: string, value: number) => (
    <div className="metric-card text-center">
      <p className="text-lg font-bold text-[var(--text-primary)]">{value.toLocaleString()}</p>
      <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide">{label}</p>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="White-Label Reports" subtitle="Generate branded performance reports for clients" />
        <button onClick={() => setShowGenerate(!showGenerate)} className="btn-primary text-sm">
          Generate Report
        </button>
      </div>

      {success && <div className="alert alert-success mb-4">{success}</div>}
      {error && <div className="alert alert-error mb-4">{error}</div>}

      {showGenerate && (
        <div className="card mb-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">New Report</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Report Type</label>
              <select value={reportType} onChange={e => setReportType(e.target.value)} className="w-full">
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="CUSTOM">Custom Range</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Client Name</label>
              <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client Company" className="w-full" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Brand Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-8 h-8 rounded border-0 p-0 cursor-pointer" />
                <input value={brandColor} onChange={e => setBrandColor(e.target.value)} className="flex-1" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Send via Email (optional)</label>
              <input value={sendTo} onChange={e => setSendTo(e.target.value)} placeholder="client@example.com" className="w-full" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={generateReport} disabled={generating} className="btn-primary text-sm">
              {generating ? "Generating..." : "Generate Report"}
            </button>
            <button onClick={() => setShowGenerate(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Preview */}
      {previewReport && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Report Preview: {(previewReport.clientName as string) ?? "Client"}
              </h3>
              <p className="text-xs text-[var(--text-tertiary)]">
                {new Date((previewReport.period as Record<string, string>)?.start ?? "").toLocaleDateString()} - {new Date((previewReport.period as Record<string, string>)?.end ?? "").toLocaleDateString()}
              </p>
            </div>
            <button onClick={() => setPreviewReport(null)} className="btn-ghost text-xs">Close Preview</button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
            {renderMetric("Posts Published", (previewReport.postsPublished as number) ?? 0)}
            {renderMetric("Impressions", ((previewReport.totals as Record<string, number>)?.impressions) ?? 0)}
            {renderMetric("Reach", ((previewReport.totals as Record<string, number>)?.reach) ?? 0)}
            {renderMetric("Clicks", ((previewReport.totals as Record<string, number>)?.clicks) ?? 0)}
            {renderMetric("Engagement", (((previewReport.totals as Record<string, number>)?.likes ?? 0) + ((previewReport.totals as Record<string, number>)?.comments ?? 0) + ((previewReport.totals as Record<string, number>)?.shares ?? 0)))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {renderMetric("Likes", ((previewReport.totals as Record<string, number>)?.likes) ?? 0)}
            {renderMetric("Comments", ((previewReport.totals as Record<string, number>)?.comments) ?? 0)}
            {renderMetric("Shares", ((previewReport.totals as Record<string, number>)?.shares) ?? 0)}
          </div>
        </div>
      )}

      {/* Report history */}
      <div className="mt-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Report History</h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-lg" />)}
          </div>
        ) : reports.length === 0 ? (
          <EmptyState title="No reports yet" description="Generate your first white-label performance report." />
        ) : (
          <div className="space-y-3">
            {reports.map(report => (
              <div key={report.id} className="card card-hover">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge badge-info text-[10px]">{report.reportType}</span>
                      {report.page && (
                        <span className="text-xs text-[var(--text-tertiary)]">{report.page.name}</span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}
                    </p>
                    {report.sentTo.length > 0 && (
                      <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                        Sent to: {report.sentTo.join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewReport(report.data)}
                      className="btn-secondary text-xs"
                    >
                      View
                    </button>
                    <span className="text-xs text-[var(--text-tertiary)] self-center">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
