"use client";

import { useEffect, useRef } from "react";

const features = [
  {
    icon: "🎨",
    title: "AI Content Studio",
    description:
      "Generate posts, improve copy, and create images with Claude AI. Your brand voice, amplified by artificial intelligence.",
  },
  {
    icon: "📡",
    title: "9-Platform Publishing",
    description:
      "Publish to Facebook, Instagram, TikTok, LinkedIn, Twitter, YouTube, Google Ads, Pinterest, and Snapchat from one place.",
  },
  {
    icon: "🕐",
    title: "Smart Scheduling",
    description:
      "AI-optimized posting times across every timezone. We auto-detect your timezone on signup \u2014 zero config. Your team sees their local time. Your audience gets posts when they\u2019re online.",
  },
  {
    icon: "📊",
    title: "Campaign Analytics",
    description:
      "Real-time performance tracking across all platforms in one unified dashboard. Know what works, instantly.",
  },
  {
    icon: "👥",
    title: "Team Collaboration",
    description:
      "Role-based access, approval workflows, and audit trails. Keep your team aligned and your brand consistent.",
  },
  {
    icon: "🔗",
    title: "Webhook Automation",
    description:
      "Real-time platform notifications, automated responses, and event-driven workflows that react instantly.",
  },
];

export function FeaturesGrid() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("feature-card-visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    const cards = gridRef.current?.querySelectorAll(".feature-card");
    cards?.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" className="py-24 px-4" style={{ background: "var(--bg-primary)" }}>
      <style>{`
        @keyframes featureCardIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .feature-card {
          opacity: 0;
          transform: translateY(30px);
        }
        .feature-card-visible {
          animation: featureCardIn 0.6s ease-out forwards;
        }
        .feature-card-visible:nth-child(2) { animation-delay: 0.1s; }
        .feature-card-visible:nth-child(3) { animation-delay: 0.2s; }
        .feature-card-visible:nth-child(4) { animation-delay: 0.3s; }
        .feature-card-visible:nth-child(5) { animation-delay: 0.4s; }
        .feature-card-visible:nth-child(6) { animation-delay: 0.5s; }
      `}</style>

      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span
            className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full mb-4"
            style={{
              background: "var(--accent-blue-muted)",
              color: "var(--accent-blue)",
            }}
          >
            Features
          </span>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Everything You Need to{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Dominate
            </span>
          </h2>
          <p
            className="text-base sm:text-lg max-w-2xl mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            A complete marketing automation platform built for teams that move fast.
          </p>
        </div>

        {/* Grid */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="feature-card group relative rounded-2xl p-6 transition-all duration-300"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-secondary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-blue)";
                e.currentTarget.style.boxShadow =
                  "0 0 30px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(59, 130, 246, 0.1)";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-secondary)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* Glow accent on hover (top border) */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px opacity-0 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, var(--accent-blue), transparent)",
                }}
              />

              <div
                className="flex items-center justify-center w-12 h-12 rounded-xl text-2xl mb-4"
                style={{
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border-primary)",
                }}
              >
                {feature.icon}
              </div>
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
