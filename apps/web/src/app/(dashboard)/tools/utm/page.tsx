"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ClientAccountBanner, useActiveAccount } from "@/components/client-account-banner";

interface UtmLink {
  id: string;
  url: string;
  source: string;
  medium: string;
  campaign: string;
  term: string | null;
  content: string | null;
  clicks: number;
  createdAt: string;
  post: { id: string; content: string; platform: string } | null;
}

export default function UtmBuilderPage() {
  const activeAccount = useActiveAccount();
  const [links, setLinks] = useState<UtmLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form fields
  const [baseUrl, setBaseUrl] = useState("");
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaign, setCampaign] = useState("");
  const [term, setTerm] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const generatedUrl = useMemo(() => {
    if (!baseUrl) return "";
    try {
      const u = new URL(baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`);
      if (source) u.searchParams.set("utm_source", source);
      if (medium) u.searchParams.set("utm_medium", medium);
      if (campaign) u.searchParams.set("utm_campaign", campaign);
      if (term) u.searchParams.set("utm_term", term);
      if (content) u.searchParams.set("utm_content", content);
      return u.toString();
    } catch {
      return "";
    }
  }, [baseUrl, source, medium, campaign, term, content]);

  const fetchLinks = useCallback(async () => {
    try {
      const pageId = activeAccount?.id;
      const qs = pageId ? `?pageId=${encodeURIComponent(pageId)}` : "";
      const res = await fetch(`/api/utm${qs}`);
      if (!res.ok) throw new Error("Failed to load links");
      const data = await res.json();
      setLinks(data.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load links");
    } finally {
      setLoading(false);
    }
  }, [activeAccount?.id]);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const saveLink = async () => {
    if (!baseUrl || !source || !medium || !campaign) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/utm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`,
          source, medium, campaign,
          term: term || undefined,
          content: content || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }
      setSuccess("UTM link saved");
      setBaseUrl("");
      setSource("");
      setMedium("");
      setCampaign("");
      setTerm("");
      setContent("");
      fetchLinks();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setSuccess("Copied to clipboard");
    setTimeout(() => setSuccess(""), 2000);
  };

  const deleteLink = async (linkId: string) => {
    try {
      const res = await fetch(`/api/utm?linkId=${linkId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      fetchLinks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <div>
      <PageHeader title="UTM Link Builder" subtitle={activeAccount ? `Showing: ${activeAccount.name}` : "Create trackable campaign URLs with UTM parameters"} />
      <ClientAccountBanner account={activeAccount} onClear={() => fetchLinks()} />

      {success && <div className="alert alert-success mb-4 mt-4">{success}</div>}
      {error && <div className="alert alert-error mb-4 mt-4">{error}</div>}

      {/* Builder form */}
      <div className="card mt-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Build Your URL</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Website URL *</label>
            <input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="https://example.com/landing-page" className="w-full" />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Source * (utm_source)</label>
            <input value={source} onChange={e => setSource(e.target.value)} placeholder="facebook, twitter, newsletter" className="w-full" />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Medium * (utm_medium)</label>
            <input value={medium} onChange={e => setMedium(e.target.value)} placeholder="social, email, cpc" className="w-full" />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Campaign * (utm_campaign)</label>
            <input value={campaign} onChange={e => setCampaign(e.target.value)} placeholder="spring-sale, product-launch" className="w-full" />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Term (utm_term)</label>
            <input value={term} onChange={e => setTerm(e.target.value)} placeholder="running+shoes" className="w-full" />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Content (utm_content)</label>
            <input value={content} onChange={e => setContent(e.target.value)} placeholder="logo-link, header-banner" className="w-full" />
          </div>
        </div>

        {/* Generated URL preview */}
        {generatedUrl && (
          <div className="mt-4 p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Generated URL</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-[var(--accent-blue)] break-all">{generatedUrl}</code>
              <button onClick={() => copyUrl(generatedUrl)} className="btn-secondary text-xs flex-shrink-0">Copy</button>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={saveLink}
            disabled={saving || !baseUrl || !source || !medium || !campaign}
            className="btn-primary text-sm"
          >
            {saving ? "Saving..." : "Save & Track"}
          </button>
          <button onClick={() => copyUrl(generatedUrl)} disabled={!generatedUrl} className="btn-secondary text-sm">
            Copy URL
          </button>
        </div>
      </div>

      {/* History */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Link History</h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-lg" />)}
          </div>
        ) : links.length === 0 ? (
          <EmptyState title="No UTM links yet" description="Create your first UTM-tagged link above." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--text-tertiary)] border-b border-[var(--border-secondary)]">
                  <th className="pb-2 pr-4">URL</th>
                  <th className="pb-2 pr-4">Source</th>
                  <th className="pb-2 pr-4">Medium</th>
                  <th className="pb-2 pr-4">Campaign</th>
                  <th className="pb-2 pr-4">Clicks</th>
                  <th className="pb-2 pr-4">Created</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {links.map(link => (
                  <tr key={link.id} className="table-row">
                    <td className="py-2 pr-4 max-w-[200px] truncate text-xs text-[var(--accent-blue)]">{link.url}</td>
                    <td className="py-2 pr-4 text-xs">{link.source}</td>
                    <td className="py-2 pr-4 text-xs">{link.medium}</td>
                    <td className="py-2 pr-4 text-xs">{link.campaign}</td>
                    <td className="py-2 pr-4 text-xs font-medium">{link.clicks}</td>
                    <td className="py-2 pr-4 text-xs text-[var(--text-tertiary)]">{new Date(link.createdAt).toLocaleDateString()}</td>
                    <td className="py-2">
                      <div className="flex gap-1">
                        <button onClick={() => copyUrl(link.url)} className="btn-ghost text-xs">Copy</button>
                        <button onClick={() => deleteLink(link.id)} className="btn-danger text-xs">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
