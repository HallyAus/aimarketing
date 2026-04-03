"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ClientAccountBanner, useActiveAccount } from "@/components/client-account-banner";

export default function EmailMarketingPage() {
  const activeAccount = useActiveAccount();
  const [tab, setTab] = useState<"compose" | "recipients" | "preview">("compose");
  const [brief, setBrief] = useState("");
  const [subject, setSubject] = useState("");
  const [tone, setTone] = useState("professional");
  const [template, setTemplate] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [plainText, setPlainText] = useState("");
  const [preheader, setPreheader] = useState("");
  const [recipients, setRecipients] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const generateEmail = async () => {
    if (!brief) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/email/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", brief, subject, tone, template }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Generation failed");
      }
      const data = await res.json();
      setSubject(data.subject ?? subject);
      setPreheader(data.preheader ?? "");
      setHtmlContent(data.htmlBody ?? "");
      setPlainText(data.plainText ?? "");
      setTab("preview");
      setSuccess("Email generated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async () => {
    const recipientList = recipients.split(",").map(e => e.trim()).filter(Boolean);
    if (!recipientList.length || !htmlContent || !subject) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/email/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send-test", subject, htmlContent, recipients: recipientList }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      setSuccess(data.message);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setLoading(false);
    }
  };

  const sendCampaign = async () => {
    const recipientList = recipients.split(",").map(e => e.trim()).filter(Boolean);
    if (!recipientList.length || !htmlContent || !subject) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/email/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", subject, htmlContent, recipients: recipientList }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      setSuccess(data.message);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Email Marketing" subtitle={activeAccount ? `AI writes email campaigns \u2014 compose, preview, and send to your audience \u2014 ${activeAccount.name}` : "AI writes email campaigns \u2014 compose, preview, and send to your audience"} />
      <ClientAccountBanner account={activeAccount} />

      {success && <div className="alert alert-success mb-4 mt-4">{success}</div>}
      {error && <div className="alert alert-error mb-4 mt-4">{error}</div>}

      {/* Tabs */}
      <div className="tab-bar mt-6 mb-6">
        {(["compose", "recipients", "preview"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`tab-item ${tab === t ? "tab-item-active" : ""}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "compose" && (
        <div className="card">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">AI Email Generator</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Campaign Brief *</label>
              <textarea
                value={brief}
                onChange={e => setBrief(e.target.value)}
                placeholder="Describe your email campaign: audience, goal, key message, call-to-action..."
                rows={4}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Subject Line (optional)</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="AI will generate if empty" className="w-full" />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Tone</label>
                <select value={tone} onChange={e => setTone(e.target.value)} className="w-full">
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="urgent">Urgent</option>
                  <option value="friendly">Friendly</option>
                  <option value="formal">Formal</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Template Style</label>
                <select value={template} onChange={e => setTemplate(e.target.value)} className="w-full">
                  <option value="">Auto-detect</option>
                  <option value="newsletter">Newsletter</option>
                  <option value="promotional">Promotional</option>
                  <option value="announcement">Announcement</option>
                  <option value="welcome">Welcome Email</option>
                  <option value="follow-up">Follow-up</option>
                </select>
              </div>
            </div>
            <button onClick={generateEmail} disabled={loading || !brief} className="btn-primary">
              {loading ? "Generating..." : "Generate Email with AI"}
            </button>
          </div>

          {htmlContent && (
            <div className="mt-6 pt-6 border-t border-[var(--border-secondary)]">
              <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-2">Edit HTML</h4>
              <textarea
                value={htmlContent}
                onChange={e => setHtmlContent(e.target.value)}
                rows={12}
                className="w-full font-mono text-xs"
              />
            </div>
          )}
        </div>
      )}

      {tab === "recipients" && (
        <div className="card">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Recipient List</h3>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Email Addresses (comma-separated)</label>
            <textarea
              value={recipients}
              onChange={e => setRecipients(e.target.value)}
              placeholder="john@example.com, jane@example.com, team@company.com"
              rows={6}
              className="w-full"
            />
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-2">
            {recipients.split(",").filter(e => e.trim()).length} recipient(s)
          </p>
        </div>
      )}

      {tab === "preview" && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Email Preview</h3>
              <div className="flex gap-2">
                <button onClick={sendTestEmail} disabled={loading || !htmlContent || !subject} className="btn-secondary text-xs">
                  Send Test
                </button>
                <button onClick={sendCampaign} disabled={loading || !htmlContent || !subject} className="btn-primary text-xs">
                  Send Campaign
                </button>
              </div>
            </div>
            {subject && (
              <div className="mb-2">
                <span className="text-xs text-[var(--text-tertiary)]">Subject:</span>
                <span className="text-sm text-[var(--text-primary)] ml-2 font-medium">{subject}</span>
              </div>
            )}
            {preheader && (
              <div className="mb-3">
                <span className="text-xs text-[var(--text-tertiary)]">Preheader:</span>
                <span className="text-xs text-[var(--text-secondary)] ml-2">{preheader}</span>
              </div>
            )}
            {htmlContent ? (
              <div className="rounded-lg border border-[var(--border-primary)] bg-white overflow-auto" style={{ height: "500px" }}>
                <iframe
                  srcDoc={htmlContent}
                  className="w-full h-full border-0"
                  title="Email Preview"
                  sandbox=""
                />
              </div>
            ) : (
              <p className="text-sm text-[var(--text-tertiary)] text-center py-12">
                Generate an email first to see the preview
              </p>
            )}
          </div>
          {plainText && (
            <div className="card">
              <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-2">Plain Text Version</h4>
              <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap">{plainText}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
