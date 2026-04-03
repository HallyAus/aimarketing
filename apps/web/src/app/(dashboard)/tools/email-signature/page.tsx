"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { DESIGN_THEMES } from "@/lib/image-gen/themes";

export default function EmailSignaturePage() {
  /* ── Form state ─────────────────────────────────────────────── */
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [theme, setTheme] = useState("clean-minimal");

  /* ── Result state ───────────────────────────────────────────── */
  const [signatureHtml, setSignatureHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copySuccess, setCopySuccess] = useState("");

  /* ── Validation ─────────────────────────────────────────────── */
  const isValid = name.trim() && title.trim() && company.trim() && email.trim();

  /* ── Generate ───────────────────────────────────────────────── */
  async function generate() {
    if (!isValid) return;
    setLoading(true);
    setError("");
    setSignatureHtml("");

    try {
      const res = await fetch("/api/ai/email-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          title: title.trim(),
          company: company.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          website: website.trim() || undefined,
          theme,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as Record<string, string>).error ?? "Generation failed");
      }

      const data = await res.json();
      setSignatureHtml(data.html ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate signature");
    } finally {
      setLoading(false);
    }
  }

  /* ── Copy HTML source ───────────────────────────────────────── */
  async function copyHtml() {
    if (!signatureHtml) return;
    await navigator.clipboard.writeText(signatureHtml);
    setCopySuccess("HTML copied!");
    setTimeout(() => setCopySuccess(""), 2500);
  }

  /* ── Copy rendered (for paste into email clients) ───────────── */
  async function copyRendered() {
    if (!signatureHtml) return;
    try {
      const blob = new Blob([signatureHtml], { type: "text/html" });
      const clipItem = new ClipboardItem({ "text/html": blob });
      await navigator.clipboard.write([clipItem]);
      setCopySuccess("Signature copied — paste into Gmail, Outlook, Apple Mail!");
    } catch {
      // Fallback: copy HTML source
      await navigator.clipboard.writeText(signatureHtml);
      setCopySuccess("HTML source copied (paste into your email client's HTML editor)");
    }
    setTimeout(() => setCopySuccess(""), 3500);
  }

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div>
      <PageHeader
        title="Email Signature Generator"
        subtitle="AI generates a professional HTML email signature styled to your chosen theme"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Tools", href: "/tools/utm" },
          { label: "Email Signature" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* ── CONFIG PANEL ─────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              Your Details
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Job Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Senior Marketing Manager"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Company *
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Corp"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@acmecorp.com"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Website (optional)
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://acmecorp.com"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* ── THEME SELECTOR ──────────────────────────────── */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              Design Theme
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {DESIGN_THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className="text-left px-2.5 py-2 rounded-lg transition-colors"
                  style={{
                    background: theme === t.id ? "var(--accent-blue-muted)" : "var(--bg-tertiary)",
                    color: theme === t.id ? "var(--accent-blue)" : "var(--text-secondary)",
                    border: `1px solid ${theme === t.id ? "var(--accent-blue)" : "var(--border-primary)"}`,
                  }}
                >
                  <div className="text-xs font-semibold">{t.name}</div>
                  <div className="text-[10px] mt-0.5 opacity-70">{t.description.split(",")[0]}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generate}
            disabled={loading || !isValid}
            className="btn-primary w-full text-sm py-3 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Signature"}
          </button>
        </div>

        {/* ── PREVIEW PANEL ────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Feedback banners */}
          {copySuccess && (
            <div className="alert alert-success text-sm">{copySuccess}</div>
          )}
          {error && (
            <div className="alert alert-error text-sm">
              {error}
              <button onClick={() => setError("")} className="ml-auto text-xs underline">Dismiss</button>
            </div>
          )}

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Preview
              </h3>
              {signatureHtml && (
                <div className="flex gap-2">
                  <button onClick={copyHtml} className="btn-secondary text-xs">
                    Copy HTML
                  </button>
                  <button onClick={copyRendered} className="btn-primary text-xs">
                    Copy to Clipboard
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div
                  className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mb-4"
                  style={{ borderColor: "var(--accent-blue)", borderTopColor: "transparent" }}
                />
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Designing your signature...
                </p>
              </div>
            ) : signatureHtml ? (
              <>
                {/* Rendered preview */}
                <div
                  className="rounded-lg p-6 mb-4 overflow-auto"
                  style={{
                    background: "#ffffff",
                    border: "1px solid var(--border-primary)",
                    minHeight: "120px",
                  }}
                >
                  <div dangerouslySetInnerHTML={{ __html: signatureHtml }} />
                </div>

                {/* HTML source */}
                <details className="mt-2">
                  <summary
                    className="text-xs font-medium cursor-pointer select-none"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    View HTML source
                  </summary>
                  <textarea
                    readOnly
                    value={signatureHtml}
                    rows={10}
                    className="w-full font-mono text-xs mt-2"
                    style={{
                      background: "var(--bg-tertiary)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-primary)",
                      borderRadius: 6,
                      padding: 12,
                      resize: "vertical",
                    }}
                  />
                </details>

                {/* Usage instructions */}
                <div
                  className="mt-4 rounded-lg p-4 text-xs space-y-1"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                >
                  <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    How to use your signature
                  </p>
                  <p>
                    <strong>Gmail:</strong> Settings → See all settings → General → Signature → Create new → click the HTML icon (&lt;&gt;) and paste the HTML source.
                  </p>
                  <p>
                    <strong>Outlook:</strong> File → Options → Mail → Signatures → New → paste using the HTML editor.
                  </p>
                  <p>
                    <strong>Apple Mail:</strong> Preferences → Signatures → create a new signature, then quit Mail, find the signature file in ~/Library/Mail, and replace its content with the HTML source.
                  </p>
                  <p className="mt-1">
                    Or click <strong>Copy to Clipboard</strong> and paste directly into a rich-text email client that accepts formatted pastes.
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: "var(--text-tertiary)", marginBottom: 12 }}
                >
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                  Fill in your details and choose a theme to generate your signature
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
