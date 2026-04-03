"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  source: string | null;
  createdAt: string;
  page: { id: string; name: string; platform: string } | null;
}

const CRM_PROVIDERS = [
  { value: "hubspot", label: "HubSpot", description: "Sync contacts, deals, and companies" },
  { value: "pipedrive", label: "Pipedrive", description: "Sync leads and deal pipeline" },
  { value: "salesforce", label: "Salesforce", description: "Enterprise CRM integration" },
];

export default function CrmPage() {
  const [tab, setTab] = useState<"leads" | "connections" | "add">("leads");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Add lead form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newSource, setNewSource] = useState("manual");

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch("/api/crm");
      if (!res.ok) throw new Error("Failed to load leads");
      const data = await res.json();
      setLeads(data.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const addLead = async () => {
    if (!newName || !newEmail) return;
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, email: newEmail, company: newCompany || undefined, source: newSource }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to add lead");
      }
      setSuccess("Lead added");
      setNewName("");
      setNewEmail("");
      setNewCompany("");
      setTab("leads");
      fetchLeads();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add lead");
    } finally {
      setActionLoading(false);
    }
  };

  const connectCRM = async (provider: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect", provider }),
      });
      const data = await res.json();
      setSuccess(data.message);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setActionLoading(false);
    }
  };

  const syncLeads = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      const data = await res.json();
      setSuccess(data.message);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteLead = async (leadId: string) => {
    try {
      const res = await fetch(`/api/crm?leadId=${leadId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      fetchLeads();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="CRM Integration" subtitle="Connect your CRM to sync leads automatically \— manage contacts and deal stages" />
        <div className="flex gap-2">
          <button onClick={syncLeads} disabled={actionLoading} className="btn-secondary text-sm">Sync to CRM</button>
          <button onClick={() => setTab("add")} className="btn-primary text-sm">Add Lead</button>
        </div>
      </div>

      {success && <div className="alert alert-success mb-4">{success}</div>}
      {error && <div className="alert alert-error mb-4">{error}</div>}

      <div className="tab-bar mb-6">
        {(["leads", "connections", "add"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`tab-item ${tab === t ? "tab-item-active" : ""}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "leads" && (
        loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-lg" />)}
          </div>
        ) : leads.length === 0 ? (
          <EmptyState title="No leads yet" description="Add leads manually or connect a social platform to capture leads automatically." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--text-tertiary)] border-b border-[var(--border-secondary)]">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Email</th>
                  <th className="pb-2 pr-4">Company</th>
                  <th className="pb-2 pr-4">Source</th>
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id} className="table-row">
                    <td className="py-2 pr-4 text-sm font-medium text-[var(--text-primary)]">{lead.name}</td>
                    <td className="py-2 pr-4 text-xs text-[var(--accent-blue)]">{lead.email}</td>
                    <td className="py-2 pr-4 text-xs">{lead.company ?? "-"}</td>
                    <td className="py-2 pr-4"><span className="badge badge-neutral text-[10px]">{lead.source ?? "manual"}</span></td>
                    <td className="py-2 pr-4 text-xs text-[var(--text-tertiary)]">{new Date(lead.createdAt).toLocaleDateString()}</td>
                    <td className="py-2">
                      <button onClick={() => deleteLead(lead.id)} className="btn-danger text-xs">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === "connections" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CRM_PROVIDERS.map(crm => (
            <div key={crm.value} className="card card-hover">
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{crm.label}</h4>
              <p className="text-xs text-[var(--text-tertiary)] mb-3">{crm.description}</p>
              <div className="flex items-center justify-between">
                <span className="badge badge-neutral text-[10px]">Not Connected</span>
                <button
                  onClick={() => connectCRM(crm.value)}
                  disabled={actionLoading}
                  className="btn-primary text-xs"
                >
                  Connect
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "add" && (
        <div className="card max-w-lg">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Add New Lead</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Name *</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="John Doe" className="w-full" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Email *</label>
              <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="john@example.com" className="w-full" type="email" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Company</label>
              <input value={newCompany} onChange={e => setNewCompany(e.target.value)} placeholder="Acme Inc" className="w-full" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Source</label>
              <select value={newSource} onChange={e => setNewSource(e.target.value)} className="w-full">
                <option value="manual">Manual Entry</option>
                <option value="social">Social Media</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="event">Event</option>
              </select>
            </div>
            <button onClick={addLead} disabled={actionLoading || !newName || !newEmail} className="btn-primary">
              {actionLoading ? "Adding..." : "Add Lead"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
