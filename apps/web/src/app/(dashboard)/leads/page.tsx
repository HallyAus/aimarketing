"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { ClientAccountBanner, useActiveAccount } from "@/components/client-account-banner";

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  source: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export default function LeadsPage() {
  const activeAccount = useActiveAccount();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [newLead, setNewLead] = useState({ name: "", email: "", company: "", source: "" });
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const pageId = activeAccount?.id;
      const qs = pageId ? `?pageId=${encodeURIComponent(pageId)}` : "";
      const res = await fetch(`/api/leads${qs}`);
      if (!res.ok) throw new Error("Failed to load leads");
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [activeAccount?.id]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  async function addLead() {
    if (!newLead.name.trim() || !newLead.email.trim()) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLead),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add lead");
      }
      setNewLead({ name: "", email: "", company: "", source: "" });
      setShowForm(false);
      fetchLeads();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setAdding(false);
    }
  }

  async function deleteLead(id: string) {
    try {
      await fetch(`/api/leads?id=${id}`, { method: "DELETE" });
      setLeads((prev) => prev.filter((l) => l.id !== id));
      setSelectedLeads((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch {
      // silently fail
    }
  }

  function exportCSV() {
    const leadsToExport =
      selectedLeads.size > 0
        ? leads.filter((l) => selectedLeads.has(l.id))
        : leads;

    const headers = ["Name", "Email", "Company", "Source", "Date"];
    const rows = leadsToExport.map((l) => [
      l.name,
      l.email,
      l.company || "",
      l.source || "",
      new Date(l.createdAt).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleSelect(id: string) {
    setSelectedLeads((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map((l) => l.id)));
    }
  }

  const filteredLeads = leads.filter(
    (l) =>
      !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      (l.company && l.company.toLowerCase().includes(search.toLowerCase()))
  );

  // Generate embeddable form HTML
  const embedCode = `<!-- AdPilot Lead Capture Form -->
<div id="adpilot-lead-form">
  <form id="adpilot-form" style="max-width:400px;font-family:system-ui,sans-serif;">
    <div style="margin-bottom:12px;">
      <label style="display:block;font-size:14px;margin-bottom:4px;color:#333;">Name *</label>
      <input type="text" name="name" required style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;" />
    </div>
    <div style="margin-bottom:12px;">
      <label style="display:block;font-size:14px;margin-bottom:4px;color:#333;">Email *</label>
      <input type="email" name="email" required style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;" />
    </div>
    <div style="margin-bottom:12px;">
      <label style="display:block;font-size:14px;margin-bottom:4px;color:#333;">Company</label>
      <input type="text" name="company" style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;" />
    </div>
    <button type="submit" style="width:100%;padding:10px;background:#3b82f6;color:white;border:none;border-radius:6px;font-size:14px;cursor:pointer;">
      Get Started
    </button>
    <p id="adpilot-msg" style="margin-top:8px;font-size:13px;display:none;"></p>
  </form>
</div>
<script>
document.getElementById('adpilot-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const form = e.target;
  const msg = document.getElementById('adpilot-msg');
  try {
    const res = await fetch('${typeof window !== "undefined" ? window.location.origin : ""}/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.value,
        email: form.email.value,
        company: form.company.value,
        source: 'embed-form'
      })
    });
    if (res.ok) {
      msg.style.display = 'block';
      msg.style.color = '#10b981';
      msg.textContent = 'Thank you! We will be in touch.';
      form.reset();
    } else {
      throw new Error('Failed');
    }
  } catch {
    msg.style.display = 'block';
    msg.style.color = '#ef4444';
    msg.textContent = 'Something went wrong. Please try again.';
  }
});
</script>`;

  return (
    <div className="w-full">
      <PageHeader
        title="Lead Capture"
        subtitle={activeAccount ? `Contacts captured from your forms and social channels \u2014 export, filter, and manage \u2014 ${activeAccount.name}` : "Contacts captured from your forms and social channels \u2014 export, filter, and manage"}
        breadcrumbs={[{ label: "Leads" }]}
        action={
          <div className="flex gap-2">
            <button onClick={() => setShowEmbed(!showEmbed)} className="btn-secondary">
              {showEmbed ? "Hide" : "Embed"} Form
            </button>
            <button onClick={() => setShowForm(!showForm)} className="btn-secondary">
              + Add Lead
            </button>
            <button onClick={exportCSV} className="btn-primary" disabled={leads.length === 0}>
              Export CSV {selectedLeads.size > 0 ? `(${selectedLeads.size})` : ""}
            </button>
          </div>
        }
      />

      <ClientAccountBanner account={activeAccount} onClear={() => fetchLeads()} />

      {error && <div className="alert alert-error mb-6">{error}</div>}

      {/* Embed Form Generator */}
      {showEmbed && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
              Embeddable Form Code
            </h3>
            <button
              onClick={() => {
                navigator.clipboard.writeText(embedCode);
              }}
              className="btn-primary text-xs"
            >
              Copy Code
            </button>
          </div>
          <p className="text-sm mb-3" style={{ color: "var(--text-tertiary)" }}>
            Paste this HTML/JS snippet into any webpage to capture leads directly into AdPilot.
          </p>
          <pre
            className="text-xs overflow-auto p-4 rounded-lg"
            style={{
              background: "var(--bg-tertiary)",
              color: "var(--text-secondary)",
              maxHeight: "300px",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}
          >
            {embedCode}
          </pre>
        </div>
      )}

      {/* Add Lead Form */}
      {showForm && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Add Lead Manually
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="section-label block mb-1">Name *</label>
              <input
                type="text"
                value={newLead.name}
                onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                placeholder="John Doe"
                className="w-full"
              />
            </div>
            <div>
              <label className="section-label block mb-1">Email *</label>
              <input
                type="email"
                value={newLead.email}
                onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                placeholder="john@example.com"
                className="w-full"
              />
            </div>
            <div>
              <label className="section-label block mb-1">Company</label>
              <input
                type="text"
                value={newLead.company}
                onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                placeholder="Acme Inc"
                className="w-full"
              />
            </div>
            <div>
              <label className="section-label block mb-1">Source</label>
              <input
                type="text"
                value={newLead.source}
                onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                placeholder="website, ad, referral..."
                className="w-full"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={addLead}
              disabled={adding || !newLead.name.trim() || !newLead.email.trim()}
              className="btn-primary"
            >
              {adding ? "Adding..." : "Add Lead"}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search leads by name, email, or company..."
          className="w-full sm:w-96"
        />
      </div>

      {/* Leads Table */}
      <div className="card">
        {loading && <div className="skeleton h-64 rounded-lg" />}
        {!loading && filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              {search ? "No leads match your search." : "No leads captured yet. Create an embeddable form or connect your landing pages to start collecting contacts."}
            </p>
          </div>
        )}
        {!loading && filteredLeads.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border-secondary)" }}>
                  <th className="text-left py-3 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left py-3 px-3 font-semibold" style={{ color: "var(--text-tertiary)" }}>
                    Name
                  </th>
                  <th className="text-left py-3 px-3 font-semibold" style={{ color: "var(--text-tertiary)" }}>
                    Email
                  </th>
                  <th className="text-left py-3 px-3 font-semibold" style={{ color: "var(--text-tertiary)" }}>
                    Company
                  </th>
                  <th className="text-left py-3 px-3 font-semibold" style={{ color: "var(--text-tertiary)" }}>
                    Source
                  </th>
                  <th className="text-left py-3 px-3 font-semibold" style={{ color: "var(--text-tertiary)" }}>
                    Date
                  </th>
                  <th className="py-3 px-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="table-row">
                    <td className="py-2 px-3">
                      <input
                        type="checkbox"
                        checked={selectedLeads.has(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="py-2 px-3 font-medium" style={{ color: "var(--text-primary)" }}>
                      {lead.name}
                    </td>
                    <td className="py-2 px-3" style={{ color: "var(--text-secondary)" }}>
                      {lead.email}
                    </td>
                    <td className="py-2 px-3" style={{ color: "var(--text-secondary)" }}>
                      {lead.company || "-"}
                    </td>
                    <td className="py-2 px-3">
                      {lead.source ? (
                        <span className="badge badge-info">{lead.source}</span>
                      ) : (
                        <span style={{ color: "var(--text-tertiary)" }}>-</span>
                      )}
                    </td>
                    <td className="py-2 px-3" style={{ color: "var(--text-tertiary)" }}>
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => deleteLead(lead.id)}
                        className="btn-ghost text-xs"
                        style={{ color: "var(--accent-red)", minHeight: "auto" }}
                      >
                        Del
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: "var(--border-secondary)" }}>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""}
              {selectedLeads.size > 0 ? ` (${selectedLeads.size} selected)` : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
