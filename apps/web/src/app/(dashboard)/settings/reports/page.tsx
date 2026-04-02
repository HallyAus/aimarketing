"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";

interface ReportHistory {
  id: string;
  startDate: string;
  endDate: string;
  data: Record<string, unknown>;
  sentTo: string[];
  createdAt: string;
}

export default function ReportsSettingsPage() {
  const [enabled, setEnabled] = useState(true);
  const [frequency, setFrequency] = useState("WEEKLY");
  const [recipients, setRecipients] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<ReportHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [previewHtml, setPreviewHtml] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/reports/weekly");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.reports || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingHistory(false);
    }
  }

  async function sendReport() {
    const emailList = recipients
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    if (emailList.length === 0) {
      setError("Please enter at least one email address");
      return;
    }

    setSending(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/reports/weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients: emailList }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send report");
      }

      const data = await res.json();
      setPreviewHtml(data.html || "");
      setSuccess(
        data.sent
          ? `Report sent to ${emailList.length} recipient(s)`
          : "Report generated (email sending not configured - set RESEND_API_KEY)"
      );
      fetchHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <PageHeader
        title="Report Settings"
        subtitle="Configure automated performance report emails"
        breadcrumbs={[
          { label: "Settings", href: "/settings/connections" },
          { label: "Reports" },
        ]}
      />

      {/* Toggle */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>
              Automated Reports
            </h3>
            <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
              Automatically send performance reports to your team
            </p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className="relative w-12 h-6 rounded-full transition-colors"
            style={{
              background: enabled ? "var(--accent-emerald)" : "var(--bg-elevated)",
            }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full transition-transform"
              style={{
                background: "white",
                transform: enabled ? "translateX(26px)" : "translateX(2px)",
              }}
            />
          </button>
        </div>

        {enabled && (
          <div className="space-y-4">
            {/* Frequency */}
            <div>
              <label className="section-label block mb-1.5">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full sm:w-48"
              >
                <option value="WEEKLY">Weekly</option>
                <option value="BIWEEKLY">Bi-weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>

            {/* Recipients */}
            <div>
              <label className="section-label block mb-1.5">Recipients</label>
              <input
                type="text"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder="email@example.com, team@example.com"
                className="w-full"
              />
              <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                Comma-separated email addresses
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={sendReport}
                disabled={sending || !recipients.trim()}
                className="btn-primary"
              >
                {sending ? "Sending..." : "Send Report Now"}
              </button>
            </div>

            {success && <div className="alert alert-success">{success}</div>}
            {error && <div className="alert alert-error">{error}</div>}
          </div>
        )}
      </div>

      {/* Preview */}
      {previewHtml && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
              Email Preview
            </h3>
            <button
              onClick={() => setPreviewHtml("")}
              className="btn-ghost text-xs"
            >
              Close
            </button>
          </div>
          <div
            className="rounded-lg overflow-hidden"
            style={{ border: "1px solid var(--border-secondary)" }}
          >
            <iframe
              srcDoc={previewHtml}
              className="w-full"
              style={{ height: "600px", background: "#0a0a0f" }}
              title="Report Preview"
            />
          </div>
        </div>
      )}

      {/* History */}
      <div className="card">
        <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          Report History
        </h3>
        {loadingHistory && <div className="skeleton h-32 rounded-lg" />}
        {!loadingHistory && history.length === 0 && (
          <p className="text-sm py-4 text-center" style={{ color: "var(--text-tertiary)" }}>
            No reports sent yet. Send your first report above.
          </p>
        )}
        {!loadingHistory && history.length > 0 && (
          <div className="space-y-2">
            {history.map((report) => (
              <div key={report.id} className="table-row flex items-center justify-between py-3 px-3 rounded-lg">
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {new Date(report.startDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    -{" "}
                    {new Date(report.endDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                    Sent to: {report.sentTo.join(", ")}
                  </p>
                </div>
                <span className="badge badge-success">Sent</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
