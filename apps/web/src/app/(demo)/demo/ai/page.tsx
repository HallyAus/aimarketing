"use client";

import { useState } from "react";

const DEMO_POST = `The healthcare landscape is shifting -- and the organizations leading the charge aren't just adopting technology, they're reimagining the patient experience from the ground up.

At Meridian Health, we've spent the last 18 months building MediSync Pro: a connected health platform that brings together wearable data, EHR systems, and real-time clinical insights into one unified dashboard.

The results so far:
- 47% reduction in patient readmission rates
- 3.2x faster diagnosis for chronic conditions
- 92% patient satisfaction score (up from 74%)

But the real breakthrough isn't the technology itself. It's the shift in mindset -- from reactive treatment to proactive, personalized care.

Healthcare innovation isn't about replacing human judgment. It's about giving clinicians the tools to make better decisions, faster.

What's the biggest challenge your organization faces in adopting connected health solutions? I'd love to hear your perspective.

#HealthcareInnovation #DigitalHealth #MediSyncPro #PatientCare #HealthTech`;

const CAMPAIGN_IDEAS = [
  {
    title: "\"Day in the Life\" Provider Series",
    description:
      "A 12-part video series following healthcare providers using MediSync Pro in real clinical settings. Each episode highlights a different use case -- from rural telehealth to urban ER workflows. Optimized for LinkedIn (long-form) and TikTok (60-sec cuts).",
    platforms: ["LinkedIn", "TikTok", "YouTube"],
    objective: "Brand Awareness + Trust",
    estimatedReach: "450K - 1.2M impressions",
  },
  {
    title: "Patient Outcome Spotlight Campaign",
    description:
      "Monthly data-driven posts featuring anonymized patient outcome improvements. Use carousel format on Instagram, thread format on Twitter, and infographic posts on LinkedIn. Include CTAs to download the full case study.",
    platforms: ["Instagram", "Twitter", "LinkedIn"],
    objective: "Lead Generation",
    estimatedReach: "280K - 600K impressions",
  },
  {
    title: "Healthcare Innovation Challenge",
    description:
      "Interactive UGC campaign inviting healthcare professionals to share their biggest workflow challenges. Top submissions get featured and win early access to MediSync Pro 2.0. Drives engagement and generates product feedback simultaneously.",
    platforms: ["LinkedIn", "Twitter", "Instagram"],
    objective: "Engagement + Product Research",
    estimatedReach: "180K - 400K impressions",
  },
];

export default function DemoAIStudioPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
        AI Studio
      </h1>
      <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
        Generate content, images, and campaign ideas with AI.
      </p>

      {/* Tabs — static for demo */}
      <div
        className="flex gap-1 mb-6 overflow-x-auto"
        style={{ borderBottom: "1px solid var(--border-primary)" }}
      >
        {[
          { id: "post", label: "Generate Post", active: true },
          { id: "improve", label: "Improve Post", active: false },
          { id: "ideas", label: "Campaign Ideas", active: false },
          { id: "image", label: "Create Image", active: false },
        ].map((tab) => (
          <button
            key={tab.id}
            className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium whitespace-nowrap min-h-[44px]"
            style={{
              borderBottom: tab.active
                ? "2px solid var(--accent-blue)"
                : "2px solid transparent",
              marginBottom: "-1px",
              color: tab.active ? "var(--accent-blue)" : "var(--text-secondary)",
              background: "transparent",
            }}
            onClick={() => !tab.active && setShowModal(true)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Generated Post — pre-filled */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* Config panel */}
        <div className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Platform
            </label>
            <div
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-primary)",
              }}
            >
              LINKEDIN
            </div>
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Topic / Description
            </label>
            <div
              className="w-full rounded-md px-3 py-2 text-sm min-h-[100px]"
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-primary)",
              }}
            >
              Write a thought leadership post about our new MediSync Pro connected health
              platform launch, highlighting patient outcome improvements and inviting
              discussion from healthcare professionals
            </div>
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Tone
            </label>
            <div
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-primary)",
              }}
            >
              professional
            </div>
          </div>
          <div className="flex gap-4">
            <label
              className="flex items-center gap-2 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              <input type="checkbox" checked readOnly />
              Include hashtags
            </label>
            <label
              className="flex items-center gap-2 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              <input type="checkbox" checked={false} readOnly />
              Include emojis
            </label>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary text-sm min-h-[44px]"
          >
            Generate Post
          </button>
        </div>

        {/* Output — pre-filled with demo content */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              className="block text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Generated Content
            </label>
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{
                background: "var(--accent-emerald-muted)",
                color: "var(--accent-emerald)",
              }}
            >
              <svg
                className="w-2.5 h-2.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              AI Generated
            </span>
          </div>
          <div
            className="rounded-lg p-4 min-h-[200px] whitespace-pre-wrap text-sm"
            style={{
              border: "1px solid var(--border-primary)",
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
            }}
          >
            {DEMO_POST}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="mt-2 text-sm"
            style={{ color: "var(--accent-blue)" }}
          >
            Copy to clipboard
          </button>
        </div>
      </div>

      {/* Campaign Ideas Section */}
      <div className="section-label mb-3">AI-Generated Campaign Ideas</div>
      <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
        Based on: Healthcare technology company, targeting B2B + B2C audiences
      </p>
      <div className="space-y-4 mb-6">
        {CAMPAIGN_IDEAS.map((idea) => (
          <div key={idea.title} className="card">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3
                className="text-sm font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {idea.title}
              </h3>
              <span className="badge badge-info text-[10px] flex-shrink-0">
                {idea.objective}
              </span>
            </div>
            <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
              {idea.description}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-1">
                {idea.platforms.map((p) => (
                  <span key={p} className="badge badge-neutral text-[10px]">
                    {p}
                  </span>
                ))}
              </div>
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Est. reach: {idea.estimatedReach}
              </span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="btn-primary text-sm"
      >
        Generate More Ideas
      </button>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="rounded-xl p-6 max-w-md w-full text-center"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-primary)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background:
                  "linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(59,130,246,0.2) 100%)",
              }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                style={{ color: "var(--accent-blue)" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                />
              </svg>
            </div>
            <h3
              className="text-lg font-bold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              AI Generation Available in Full Version
            </h3>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
              Generate unlimited posts, campaign ideas, and social media images with
              ReachPilot&apos;s AI engine. Book a call to see it in action.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary text-sm"
              >
                Back to Demo
              </button>
              <a href="/signin" className="btn-primary text-sm inline-flex items-center gap-1.5">
                Book a Strategy Call
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
