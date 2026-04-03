"use client";

import { useState } from "react";

const faqs = [
  {
    question: "What platforms does AdPilot support?",
    answer:
      "AdPilot supports 9 major platforms: Facebook, Instagram, TikTok, LinkedIn, Twitter/X, YouTube, Google Ads, Pinterest, and Snapchat. Connect all your accounts and manage them from a single dashboard.",
  },
  {
    question: "How does the AI content generation work?",
    answer:
      "Our AI Content Studio is powered by Claude AI. It learns your brand voice from your existing content and generates on-brand posts, ad copy, and captions. You can generate from scratch, improve existing copy, or create variations for A/B testing. All content is editable before publishing.",
  },
  {
    question: "Can I try AdPilot for free?",
    answer:
      "Yes! Our Free plan includes 1 user, 3 platforms, and 30 posts per month — no credit card required. You can upgrade to Pro or Agency at any time as your needs grow.",
  },
  {
    question: "How does team collaboration work?",
    answer:
      "AdPilot offers role-based access control so you can assign different permissions to team members. Content approval workflows let managers review and approve posts before they go live. Full audit trails track every change for accountability.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. We use end-to-end encryption, store data in SOC 2 compliant data centers, and never share your data with third parties. OAuth connections to social platforms use industry-standard security protocols with minimal required permissions.",
  },
  {
    question: "Can I connect multiple accounts per platform?",
    answer:
      "Yes. On Pro and Agency plans, you can connect multiple accounts per platform. This is perfect for agencies managing multiple clients or businesses with multiple brand pages.",
  },
  {
    question: "What analytics does AdPilot provide?",
    answer:
      "AdPilot provides real-time analytics across all connected platforms, including engagement rates, reach, impressions, click-through rates, and audience demographics. Pro and Agency plans include advanced analytics with custom reports and trend analysis.",
  },
  {
    question: "Do you offer global support?",
    answer:
      "AdPilot is built in Australia and used by teams worldwide. We offer support across all timezones with response within 24 hours. Pro and Agency plans include priority and dedicated support.",
  },
  {
    question: "How does AdPilot handle timezones?",
    answer:
      "AdPilot auto-detects your timezone the moment you sign up \u2014 no setup needed. All scheduled posts display in your local time. If you have a team spread across timezones, each member sees times in their own timezone automatically. Our Smart Scheduling AI also considers your audience\u2019s timezones to recommend optimal posting windows.",
  },
  {
    question: "Can I schedule posts for a different timezone?",
    answer:
      "Yes. Your timezone is auto-detected but you can override it anytime. You can also set audience timezones per platform so AdPilot optimizes posting times for when your followers are actually online.",
  },
  {
    question: "Does AdPilot support teams across timezones?",
    answer:
      "Absolutely. Each team member sees the content calendar in their own local timezone. A post scheduled for \u20189:00 AM\u2019 shows each person the correct time in their timezone. No confusion, no manual conversion.",
  },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className="transition-transform duration-300 flex-shrink-0"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 px-4" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-3xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span
            className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full mb-4"
            style={{
              background: "var(--accent-blue-muted)",
              color: "var(--accent-blue)",
            }}
          >
            FAQ
          </span>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Frequently Asked{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Questions
            </span>
          </h2>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="rounded-xl overflow-hidden transition-all duration-200"
                style={{
                  background: "var(--bg-secondary)",
                  border: isOpen
                    ? "1px solid var(--accent-blue)"
                    : "1px solid var(--border-secondary)",
                  boxShadow: isOpen
                    ? "0 0 20px rgba(59, 130, 246, 0.08)"
                    : "none",
                }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left transition-colors"
                  style={{ color: "var(--text-primary)" }}
                >
                  <span className="text-sm font-semibold">{faq.question}</span>
                  <span style={{ color: "var(--text-tertiary)" }}>
                    <ChevronIcon open={isOpen} />
                  </span>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    maxHeight: isOpen ? "500px" : "0",
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <p
                    className="px-6 pb-5 text-sm leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
