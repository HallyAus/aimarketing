"use client";

import { useState } from "react";

const tiers = [
  {
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Perfect for getting started",
    cta: "Start Free",
    highlighted: false,
    features: [
      { text: "1 user", included: true },
      { text: "3 platforms", included: true },
      { text: "30 posts per month", included: true },
      { text: "Basic analytics", included: true },
      { text: "Auto timezone detection", included: true },
      { text: "Community support", included: true },
      { text: "AI content generation", included: false },
      { text: "Advanced analytics", included: false },
      { text: "API access", included: false },
    ],
    note: "No credit card required",
  },
  {
    name: "Pro",
    monthlyPrice: 49,
    yearlyPrice: 39,
    description: "For growing teams and agencies",
    cta: "Start Pro Trial",
    highlighted: true,
    features: [
      { text: "5 users", included: true },
      { text: "All 9 platforms", included: true },
      { text: "Unlimited posts", included: true },
      { text: "AI Content Studio", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Smart timezone scheduling", included: true },
      { text: "Priority support", included: true },
      { text: "Webhook automation", included: true },
    ],
    note: "Most popular",
  },
  {
    name: "Agency",
    monthlyPrice: 299,
    yearlyPrice: 239,
    description: "For large teams and enterprises",
    cta: "Contact Sales",
    highlighted: false,
    features: [
      { text: "Unlimited users", included: true },
      { text: "All 9 platforms", included: true },
      { text: "Unlimited posts", included: true },
      { text: "White-label reports", included: true },
      { text: "Full API access", included: true },
      { text: "Custom integrations", included: true },
      { text: "Dedicated support", included: true },
      { text: "SSO & audit trails", included: true },
    ],
    note: null,
  },
];

export function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 px-4" style={{ background: "var(--bg-secondary)" }}>
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span
            className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full mb-4"
            style={{
              background: "var(--accent-amber-muted)",
              color: "var(--accent-amber)",
            }}
          >
            Pricing
          </span>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Simple, Transparent{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--accent-amber), var(--accent-blue))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Pricing
            </span>
          </h2>
          <p
            className="text-base sm:text-lg max-w-2xl mx-auto mb-8"
            style={{ color: "var(--text-secondary)" }}
          >
            Start free. Upgrade when you are ready. No surprises.
          </p>

          {/* Annual Toggle */}
          <div className="flex items-center justify-center gap-3">
            <span
              className="text-sm font-medium"
              style={{ color: annual ? "var(--text-tertiary)" : "var(--text-primary)" }}
            >
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className="relative w-12 h-6 rounded-full transition-colors duration-300"
              style={{
                background: annual ? "var(--accent-blue)" : "var(--bg-hover)",
              }}
              aria-label="Toggle annual pricing"
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform duration-300"
                style={{
                  background: "#fff",
                  transform: annual ? "translateX(24px)" : "translateX(0)",
                }}
              />
            </button>
            <span
              className="text-sm font-medium"
              style={{ color: annual ? "var(--text-primary)" : "var(--text-tertiary)" }}
            >
              Annual
            </span>
            {annual && (
              <span
                className="px-2 py-0.5 text-xs font-semibold rounded-full"
                style={{
                  background: "var(--accent-emerald-muted)",
                  color: "var(--accent-emerald)",
                }}
              >
                Save 20%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {tiers.map((tier) => {
            const price = annual ? tier.yearlyPrice : tier.monthlyPrice;
            return (
              <div
                key={tier.name}
                className="relative rounded-2xl p-6 lg:p-8 transition-all duration-300"
                style={{
                  background: tier.highlighted
                    ? "var(--bg-tertiary)"
                    : "var(--bg-primary)",
                  border: tier.highlighted
                    ? "1px solid var(--accent-blue)"
                    : "1px solid var(--border-secondary)",
                  boxShadow: tier.highlighted
                    ? "0 0 40px rgba(59, 130, 246, 0.15), 0 0 4px rgba(59, 130, 246, 0.1)"
                    : "none",
                  transform: tier.highlighted ? "scale(1.02)" : "none",
                }}
              >
                {/* Recommended badge */}
                {tier.highlighted && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-semibold rounded-full"
                    style={{
                      background: "var(--accent-blue)",
                      color: "#fff",
                      boxShadow: "0 0 20px rgba(59, 130, 246, 0.4)",
                    }}
                  >
                    Recommended
                  </div>
                )}

                {/* Tier header */}
                <div className="mb-6">
                  <h3
                    className="text-lg font-bold mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {tier.name}
                  </h3>
                  <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                    {tier.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span
                      className="text-4xl font-extrabold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      ${price}
                    </span>
                    <span
                      className="text-sm mb-1"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      /mo
                    </span>
                  </div>
                  {annual && tier.monthlyPrice > 0 && (
                    <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                      <span style={{ textDecoration: "line-through" }}>
                        ${tier.monthlyPrice}/mo
                      </span>{" "}
                      billed annually
                    </p>
                  )}
                </div>

                {/* CTA */}
                <button
                  className="w-full py-3 px-4 text-sm font-semibold rounded-xl transition-all duration-200 mb-6"
                  style={{
                    background: tier.highlighted
                      ? "var(--accent-blue)"
                      : "var(--bg-elevated)",
                    color: tier.highlighted ? "#fff" : "var(--text-primary)",
                    border: tier.highlighted
                      ? "none"
                      : "1px solid var(--border-primary)",
                    boxShadow: tier.highlighted
                      ? "0 0 20px rgba(59, 130, 246, 0.3)"
                      : "none",
                  }}
                >
                  {tier.cta}
                </button>

                {/* Features */}
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature.text} className="flex items-center gap-3">
                      <span
                        className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full text-xs"
                        style={{
                          background: feature.included
                            ? "var(--accent-emerald-muted)"
                            : "var(--bg-elevated)",
                          color: feature.included
                            ? "var(--accent-emerald)"
                            : "var(--text-tertiary)",
                        }}
                      >
                        {feature.included ? (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M2.5 6L5 8.5L9.5 3.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path
                              d="M2.5 5H7.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span
                        className="text-sm"
                        style={{
                          color: feature.included
                            ? "var(--text-secondary)"
                            : "var(--text-tertiary)",
                        }}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Note */}
                {tier.note && !tier.highlighted && (
                  <p
                    className="mt-6 text-center text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {tier.note}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
