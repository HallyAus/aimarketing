"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";

const TEMPLATES = [
  { value: "product-launch", label: "Product Launch", description: "Showcase a new product with features, pricing, and CTA" },
  { value: "lead-gen", label: "Lead Generation", description: "Capture leads with a compelling offer and form" },
  { value: "event", label: "Event", description: "Promote an event with schedule, speakers, and registration" },
  { value: "webinar", label: "Webinar", description: "Drive webinar signups with topic overview and speaker bio" },
];

export default function LandingPageBuilderPage() {
  const [template, setTemplate] = useState("product-launch");
  const [brief, setBrief] = useState("");
  const [brandName, setBrandName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [htmlOutput, setHtmlOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCode, setShowCode] = useState(false);

  const generatePage = async () => {
    if (!brief) return;
    setLoading(true);
    setError("");
    try {
      const aiRes = await fetch("/api/email/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          brief: `Create a complete, modern landing page HTML for: ${brief}

Template style: ${TEMPLATES.find(t => t.value === template)?.label}
Brand name: ${brandName || "Brand"}
Primary color: ${primaryColor}

The landing page should include:
- Hero section with headline, subheadline, and CTA button
- Features/benefits section (3-4 items)
- Social proof / testimonials section
- Pricing or offer section (if applicable)
- FAQ section
- Footer with links

Use inline CSS. Make it responsive. Use the primary color throughout.
Return the full HTML document that can be opened directly in a browser.`,
          tone: "professional",
          template: "landing-page",
        }),
      });

      if (!aiRes.ok) {
        const data = await aiRes.json();
        throw new Error(data.error ?? "Generation failed");
      }

      const data = await aiRes.json();
      setHtmlOutput(data.htmlBody ?? data.plainText ?? "");
      setSuccess("Landing page generated");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const exportHtml = () => {
    const blob = new Blob([htmlOutput], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `landing-page-${template}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccess("HTML exported");
    setTimeout(() => setSuccess(""), 3000);
  };

  const copyHtml = async () => {
    await navigator.clipboard.writeText(htmlOutput);
    setSuccess("HTML copied to clipboard");
    setTimeout(() => setSuccess(""), 2000);
  };

  return (
    <div>
      <PageHeader title="Landing Page Builder" subtitle="AI creates campaign-specific landing pages \u2014 choose a template, customize, and export" />

      {success && <div className="alert alert-success mb-4 mt-4">{success}</div>}
      {error && <div className="alert alert-error mb-4 mt-4">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Config panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Configuration</h3>

            <div className="mb-4">
              <label className="block text-xs text-[var(--text-secondary)] mb-2">Template</label>
              <div className="space-y-2">
                {TEMPLATES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTemplate(t.value)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      template === t.value
                        ? "bg-[var(--accent-blue-muted)] border-[var(--accent-blue)]"
                        : "border-[var(--border-primary)] hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    <span className="text-xs font-medium text-[var(--text-primary)]">{t.label}</span>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{t.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Brand Name</label>
              <input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="Your Brand" className="w-full" />
            </div>

            <div className="mb-4">
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Primary Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-8 h-8 rounded border-0 p-0 cursor-pointer" />
                <input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="flex-1" />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Page Brief *</label>
              <textarea
                value={brief}
                onChange={e => setBrief(e.target.value)}
                placeholder="Describe your landing page: product, audience, key message, CTA..."
                rows={5}
                className="w-full"
              />
            </div>

            <button onClick={generatePage} disabled={loading || !brief} className="btn-primary w-full">
              {loading ? "Generating..." : "Generate Landing Page"}
            </button>
          </div>
        </div>

        {/* Preview panel */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {showCode ? "HTML Source" : "Live Preview"}
              </h3>
              <div className="flex gap-2">
                {htmlOutput && (
                  <>
                    <button onClick={() => setShowCode(!showCode)} className="btn-ghost text-xs">
                      {showCode ? "Preview" : "View Code"}
                    </button>
                    <button onClick={copyHtml} className="btn-secondary text-xs">Copy HTML</button>
                    <button onClick={exportHtml} className="btn-primary text-xs">Export HTML</button>
                  </>
                )}
              </div>
            </div>

            {htmlOutput ? (
              showCode ? (
                <textarea
                  value={htmlOutput}
                  onChange={e => setHtmlOutput(e.target.value)}
                  rows={30}
                  className="w-full font-mono text-xs"
                />
              ) : (
                <div className="rounded-lg border border-[var(--border-primary)] bg-white overflow-auto" style={{ height: "600px" }}>
                  <iframe
                    srcDoc={htmlOutput}
                    className="w-full h-full border-0"
                    title="Landing Page Preview"
                    sandbox="allow-scripts"
                  />
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-[400px]">
                <p className="text-sm text-[var(--text-tertiary)]">
                  {loading ? "Generating your landing page..." : "Configure and generate to see a preview"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
