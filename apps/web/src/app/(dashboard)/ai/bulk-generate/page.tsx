"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ClientAccountBanner, useActiveAccount } from "@/components/client-account-banner";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ActiveAccount {
  id: string;
  platform: string;
  name: string;
  type: "page" | "account";
  connectionId: string;
}

interface Campaign {
  id: string;
  name: string;
}

interface GeneratedPost {
  platform: string;
  content: string;
  suggestedTime?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TONES = [
  "professional",
  "casual",
  "humorous",
  "urgent",
  "inspirational",
  "educational",
];

const DURATION_PRESETS = [
  { label: "1 week (7 posts)", value: 7 },
  { label: "2 weeks (14 posts)", value: 14 },
  { label: "1 month (30 posts)", value: 30 },
  { label: "Custom", value: 0 },
];

const FREQUENCY_OPTIONS = [
  { label: "Every 6 hours", value: 360 },
  { label: "Every 8 hours", value: 480 },
  { label: "Every 12 hours", value: 720 },
  { label: "Every 24 hours", value: 1440 },
  { label: "Every 48 hours", value: 2880 },
];

const PLATFORM_META: Record<string, { color: string; label: string }> = {
  FACEBOOK: { color: "#1877F2", label: "Facebook" },
  INSTAGRAM: { color: "#E4405F", label: "Instagram" },
  LINKEDIN: { color: "#0A66C2", label: "LinkedIn" },
  TWITTER_X: { color: "#1DA1F2", label: "Twitter/X" },
  TIKTOK: { color: "#00F2EA", label: "TikTok" },
  YOUTUBE: { color: "#FF0000", label: "YouTube" },
  GOOGLE_ADS: { color: "#4285F4", label: "Google Ads" },
  PINTEREST: { color: "#BD081C", label: "Pinterest" },
  SNAPCHAT: { color: "#FFFC00", label: "Snapchat" },
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function BulkGeneratePage() {
  const globalActiveAccount = useActiveAccount();

  // Data
  const [accounts, setAccounts] = useState<ActiveAccount[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Form state
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [topic, setTopic] = useState("");
  const [durationPreset, setDurationPreset] = useState(7);
  const [customCount, setCustomCount] = useState(7);
  const [frequency, setFrequency] = useState(1440);
  const [tone, setTone] = useState("professional");
  const [campaignId, setCampaignId] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });

  // Progress state
  const [phase, setPhase] = useState<"idle" | "generating" | "scheduling" | "done" | "error">("idle");
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [totalNeeded, setTotalNeeded] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const postCount = durationPreset === 0 ? customCount : durationPreset;
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  // Fetch accounts + campaigns on mount
  useEffect(() => {
    async function load() {
      try {
        const [accRes, campRes] = await Promise.all([
          fetch("/api/accounts/active"),
          fetch("/api/campaigns"),
        ]);
        if (accRes.ok) {
          const accData = await accRes.json();
          const list: ActiveAccount[] = accData.accounts ?? [];
          setAccounts(list);
          // Pre-select the global active account if set, otherwise first account
          const globalId = globalActiveAccount?.id;
          if (globalId && list.some((a) => a.id === globalId)) {
            setSelectedAccountId(globalId);
          } else if (list.length > 0) {
            setSelectedAccountId(list[0]!.id);
          }
        }
        if (campRes.ok) {
          const campData = await campRes.json();
          const list: Campaign[] = campData.data ?? [];
          setCampaigns(list);
          if (list.length > 0) setCampaignId(list[0]!.id);
        }
      } catch {
        // silently fail
      }
      setLoadingAccounts(false);
    }
    load();
  }, []);

  // Generate & Schedule
  const handleGenerate = useCallback(async () => {
    if (!selectedAccount || !campaignId || !topic.trim()) return;

    setPhase("generating");
    setErrorMsg("");
    setSuccessMsg("");
    setGeneratedPosts([]);
    setGeneratedCount(0);
    setScheduledCount(0);
    setTotalNeeded(postCount);

    const allPosts: GeneratedPost[] = [];
    const batchSize = 10; // Generate up to 10 posts per API call
    const batches = Math.ceil(postCount / batchSize);

    try {
      for (let b = 0; b < batches; b++) {
        const remaining = postCount - allPosts.length;
        const thisBatch = Math.min(remaining, batchSize);

        const isUrl = topic.startsWith("http://") || topic.startsWith("https://");

        const res = await fetch("/api/ai/url-to-posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: isUrl ? topic : `https://example.com/topic?q=${encodeURIComponent(topic)}`,
            platformIds: [selectedAccount.platform],
            postsPerPlatform: thisBatch,
            tone,
            ...(isUrl ? {} : { topicOverride: topic }),
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Generation failed" }));
          throw new Error(err.error ?? "Generation failed");
        }

        const data = await res.json();
        const posts: GeneratedPost[] = data.posts ?? [];
        allPosts.push(...posts);
        setGeneratedCount(allPosts.length);
        setGeneratedPosts([...allPosts]);
      }

      // Now schedule all posts
      setPhase("scheduling");

      const startAt = new Date(startDate);
      if (isNaN(startAt.getTime()) || startAt <= new Date()) {
        startAt.setTime(Date.now() + 60 * 60 * 1000); // 1 hour from now fallback
      }

      const scheduleRes = await fetch("/api/posts/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posts: allPosts.map((p) => ({
            content: p.content,
            platform: selectedAccount.platform,
            pageId: selectedAccount.id,
            pageName: selectedAccount.name,
          })),
          campaignId,
          startAt: startAt.toISOString(),
          intervalMinutes: frequency,
          pageId: selectedAccount.id,
          pageName: selectedAccount.name,
        }),
      });

      if (!scheduleRes.ok) {
        const err = await scheduleRes.json().catch(() => ({ error: "Scheduling failed" }));
        throw new Error(err.error ?? "Scheduling failed");
      }

      const schedData = await scheduleRes.json();
      setScheduledCount(schedData.scheduledCount ?? allPosts.length);

      const freqLabel = FREQUENCY_OPTIONS.find((f) => f.value === frequency)?.label ?? `${frequency} minutes`;
      const accountName = selectedAccount.name;
      const platformLabel = PLATFORM_META[selectedAccount.platform]?.label ?? selectedAccount.platform;
      setSuccessMsg(
        `${schedData.scheduledCount ?? allPosts.length} posts scheduled for ${accountName} (${platformLabel}), posting ${freqLabel.toLowerCase()} starting ${new Date(startDate).toLocaleString()}.`,
      );
      setPhase("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "An error occurred");
      setPhase("error");
    }
  }, [selectedAccount, campaignId, topic, postCount, tone, startDate, frequency]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div>
      <PageHeader
        title="Bulk Generate Posts"
        subtitle={globalActiveAccount ? `Generate and schedule a week or month of posts for any page in one click \— ${globalActiveAccount.name}` : "Generate and schedule a week or month of posts for any page in one click"}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "AI Studio", href: "/ai" },
          { label: "Bulk Generate" },
        ]}
      />

      <ClientAccountBanner account={globalActiveAccount} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ---------- Left: Form ---------- */}
        <div className="lg:col-span-3 space-y-5">
          {/* Account selector */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Account / Page
            </label>
            {loadingAccounts ? (
              <div className="text-xs text-[var(--text-tertiary)]">Loading accounts...</div>
            ) : accounts.length === 0 ? (
              <div className="text-sm text-[var(--text-tertiary)]">
                No accounts connected.{" "}
                <Link href="/settings/connections" className="text-[var(--accent-blue)] hover:underline">
                  Connect one
                </Link>
              </div>
            ) : (
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {PLATFORM_META[a.platform]?.label ?? a.platform} - {a.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* URL or topic */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              URL or Topic
            </label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="https://example.com/blog-post or a topic like 'Summer sale 30% off'"
              className="w-full rounded-md px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              Paste a URL to generate posts from its content, or type a topic directly.
            </p>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Number of Posts
            </label>
            <div className="flex gap-2 flex-wrap">
              {DURATION_PRESETS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDurationPreset(d.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    durationPreset === d.value
                      ? "bg-[var(--accent-blue-muted)] text-[var(--accent-blue)] border-[var(--accent-blue)]"
                      : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            {durationPreset === 0 && (
              <input
                type="number"
                min={1}
                max={100}
                value={customCount}
                onChange={(e) => setCustomCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                className="mt-2 w-32 rounded-md px-3 py-2 text-sm"
                placeholder="Number of posts"
              />
            )}
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Posting Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(parseInt(e.target.value))}
              className="w-full rounded-md px-3 py-2 text-sm"
            >
              {FREQUENCY_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm"
            >
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Campaign */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Campaign
            </label>
            {campaigns.length === 0 ? (
              <div className="text-sm text-[var(--text-tertiary)]">
                No campaigns found.{" "}
                <Link href="/campaigns" className="text-[var(--accent-blue)] hover:underline">
                  Create one
                </Link>
              </div>
            ) : (
              <select
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm"
              >
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Start date */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm"
            />
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={phase === "generating" || phase === "scheduling" || !topic.trim() || !campaignId || !selectedAccountId}
            className="btn-primary text-sm disabled:opacity-50 min-h-[44px] w-full"
          >
            {phase === "generating"
              ? `Generating... ${generatedCount}/${totalNeeded} posts`
              : phase === "scheduling"
                ? "Scheduling posts..."
                : "Generate & Schedule"}
          </button>
        </div>

        {/* ---------- Right: Progress / Results ---------- */}
        <div className="lg:col-span-2">
          <div
            className="rounded-lg p-4 min-h-[300px]"
            style={{
              border: "1px solid var(--border-primary)",
              background: "var(--bg-secondary)",
            }}
          >
            {phase === "idle" && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <svg className="w-10 h-10 mb-3 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <p className="text-sm text-[var(--text-tertiary)]">
                  Configure your settings and click Generate & Schedule to create posts in bulk.
                </p>
              </div>
            )}

            {(phase === "generating" || phase === "scheduling") && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  {phase === "generating" ? "Generating Posts..." : "Scheduling Posts..."}
                </h3>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-[var(--bg-tertiary)]">
                  <div
                    className="h-2 rounded-full bg-[var(--accent-blue)] transition-all duration-500"
                    style={{
                      width: `${phase === "generating" ? (generatedCount / totalNeeded) * 100 : 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {phase === "generating"
                    ? `${generatedCount} / ${totalNeeded} posts generated`
                    : `Scheduling ${generatedCount} posts...`}
                </p>

                {/* Show generated posts preview */}
                {generatedPosts.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                    {generatedPosts.slice(0, 5).map((p, i) => (
                      <div
                        key={i}
                        className="text-xs p-2 rounded"
                        style={{
                          background: "var(--bg-tertiary)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border-primary)",
                        }}
                      >
                        <span className="font-medium text-[var(--text-primary)]">#{i + 1}</span>{" "}
                        {p.content.slice(0, 120)}
                        {p.content.length > 120 ? "..." : ""}
                      </div>
                    ))}
                    {generatedPosts.length > 5 && (
                      <p className="text-xs text-[var(--text-tertiary)]">
                        + {generatedPosts.length - 5} more posts
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {phase === "done" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[var(--status-live)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">All Done!</h3>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">{successMsg}</p>

                {/* Preview first 5 */}
                <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                  {generatedPosts.slice(0, 5).map((p, i) => (
                    <div
                      key={i}
                      className="text-xs p-2 rounded"
                      style={{
                        background: "var(--bg-tertiary)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border-primary)",
                      }}
                    >
                      <span className="font-medium text-[var(--text-primary)]">#{i + 1}</span>{" "}
                      {p.content.slice(0, 120)}
                      {p.content.length > 120 ? "..." : ""}
                    </div>
                  ))}
                  {generatedPosts.length > 5 && (
                    <p className="text-xs text-[var(--text-tertiary)]">
                      + {generatedPosts.length - 5} more posts
                    </p>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Link
                    href="/calendar"
                    className="btn-primary text-xs px-3 py-1.5"
                  >
                    View Calendar
                  </Link>
                  <button
                    onClick={() => {
                      setPhase("idle");
                      setGeneratedPosts([]);
                      setTopic("");
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    Generate More
                  </button>
                </div>
              </div>
            )}

            {phase === "error" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[var(--status-error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Error</h3>
                </div>
                <p className="text-sm text-[var(--status-error)]">{errorMsg}</p>
                {generatedPosts.length > 0 && (
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {generatedCount} posts were generated before the error.
                  </p>
                )}
                <button
                  onClick={() => setPhase("idle")}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
