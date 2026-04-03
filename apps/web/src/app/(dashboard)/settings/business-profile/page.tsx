"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";

interface BusinessProfile {
  businessName: string;
  websiteUrl: string;
  industry: string;
  targetAudience: string;
  competitorUrls: string[];
  brandKeywords: string;
}

const EMPTY_PROFILE: BusinessProfile = {
  businessName: "",
  websiteUrl: "",
  industry: "",
  targetAudience: "",
  competitorUrls: [""],
  brandKeywords: "",
};

export default function BusinessProfilePage() {
  const [profile, setProfile] = useState<BusinessProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetch("/api/organizations/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.businessProfile) {
          const bp = data.businessProfile;
          setProfile({
            businessName: bp.businessName ?? "",
            websiteUrl: bp.websiteUrl ?? "",
            industry: bp.industry ?? "",
            targetAudience: bp.targetAudience ?? "",
            competitorUrls: bp.competitorUrls?.length ? bp.competitorUrls : [""],
            brandKeywords: bp.brandKeywords ?? "",
          });
        }
        if (data.orgName && !data.businessProfile?.businessName) {
          setProfile((p) => ({ ...p, businessName: data.orgName }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function addCompetitorUrl() {
    if (profile.competitorUrls.length < 5) {
      setProfile({ ...profile, competitorUrls: [...profile.competitorUrls, ""] });
    }
  }

  function removeCompetitorUrl(idx: number) {
    setProfile({
      ...profile,
      competitorUrls: profile.competitorUrls.filter((_, i) => i !== idx),
    });
  }

  function updateCompetitorUrl(idx: number, val: string) {
    const copy = [...profile.competitorUrls];
    copy[idx] = val;
    setProfile({ ...profile, competitorUrls: copy });
  }

  async function save() {
    setSaving(true);
    setFeedback("");
    try {
      const res = await fetch("/api/organizations/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessProfile: {
            ...profile,
            competitorUrls: profile.competitorUrls.filter((u) => u.trim()),
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setFeedback("Profile saved successfully!");
    } catch {
      setFeedback("Error saving profile");
    }
    setSaving(false);
    setTimeout(() => setFeedback(""), 4000);
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Business Profile" subtitle="Tell AdPilot about your business \— AI uses this to create more relevant content" breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Settings", href: "/settings" }, { label: "Business Profile" }]} />
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-10 rounded-md" style={{ background: "var(--bg-tertiary)" }} />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Business Profile"
        subtitle="Tell AdPilot about your business \— AI uses this to create more relevant content"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Settings", href: "/settings" },
          { label: "Business Profile" },
        ]}
      />

      <div className="max-w-2xl space-y-5">
        <div>
          <label htmlFor="bp-name" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Business Name</label>
          <input
            id="bp-name"
            value={profile.businessName}
            onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
            placeholder="Your business name"
            className="w-full rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="bp-website" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Website URL</label>
          <input
            id="bp-website"
            value={profile.websiteUrl}
            onChange={(e) => setProfile({ ...profile, websiteUrl: e.target.value })}
            placeholder="https://yourwebsite.com"
            className="w-full rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="bp-industry" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Industry / Niche</label>
          <input
            id="bp-industry"
            value={profile.industry}
            onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
            placeholder="e.g. E-commerce, SaaS, Restaurant, Real Estate"
            className="w-full rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="bp-audience" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Target Audience</label>
          <textarea
            id="bp-audience"
            value={profile.targetAudience}
            onChange={(e) => setProfile({ ...profile, targetAudience: e.target.value })}
            rows={3}
            placeholder="Describe your target audience: demographics, interests, pain points..."
            className="w-full rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Competitor URLs (up to 5)</label>
          {profile.competitorUrls.map((u, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                value={u}
                onChange={(e) => updateCompetitorUrl(i, e.target.value)}
                placeholder={`https://competitor${i + 1}.com`}
                className="flex-1 rounded-md px-3 py-2 text-sm"
              />
              {profile.competitorUrls.length > 1 && (
                <button onClick={() => removeCompetitorUrl(i)} className="text-sm px-2 min-h-[44px]" style={{ color: "var(--accent-red)" }}>Remove</button>
              )}
            </div>
          ))}
          {profile.competitorUrls.length < 5 && (
            <button onClick={addCompetitorUrl} className="text-sm" style={{ color: "var(--accent-blue)" }}>+ Add competitor URL</button>
          )}
        </div>

        <div>
          <label htmlFor="bp-keywords" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Brand Keywords (comma-separated)</label>
          <input
            id="bp-keywords"
            value={profile.brandKeywords}
            onChange={(e) => setProfile({ ...profile, brandKeywords: e.target.value })}
            placeholder="e.g. innovative, sustainable, premium, affordable"
            className="w-full rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button onClick={save} disabled={saving} className="btn-primary text-sm min-h-[44px]">
            {saving ? "Saving..." : "Save Profile"}
          </button>
          {feedback && (
            <span className="text-sm font-medium" style={{ color: feedback.includes("Error") ? "var(--accent-red)" : "var(--accent-emerald)" }}>
              {feedback}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
