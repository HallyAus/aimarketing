"use client";

import Link from "next/link";

const benefits = [
  {
    title: "Free Forever Plan",
    description:
      "Start with 3 platforms, 30 posts/month, and AI content generation. No credit card required.",
    icon: "\u{1F381}",
    color: "var(--accent-blue)",
  },
  {
    title: "Smart Timezone Scheduling",
    description:
      "Auto-detect your timezone on signup. Schedule posts for when your audience is online \— across every timezone.",
    icon: "\u{1F30D}",
    color: "var(--accent-purple)",
  },
  {
    title: "9-Platform Publishing",
    description:
      "Manage Facebook, Instagram, TikTok, LinkedIn, Twitter, YouTube, Google Ads, Pinterest, and Snapchat from one dashboard.",
    icon: "\u{1F4E1}",
    color: "var(--accent-emerald)",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 px-4" style={{ background: "var(--bg-primary)" }}>
      <style>{`
        .benefit-card {
          transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .benefit-card:hover {
          transform: translateY(-4px);
        }
      `}</style>

      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span
            className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full mb-4"
            style={{
              background: "var(--accent-purple-muted)",
              color: "var(--accent-purple)",
            }}
          >
            Early Access
          </span>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Be One of Our{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--accent-purple), var(--accent-blue))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              First Users
            </span>
          </h2>
          <p
            className="text-base sm:text-lg max-w-2xl mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            AdPilot is in public beta. Join thousands of teams already automating their marketing.
          </p>
        </div>

        {/* Benefit Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="benefit-card relative rounded-2xl p-6 lg:p-8"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-secondary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--border-primary)";
                e.currentTarget.style.boxShadow =
                  "0 8px 30px rgba(0, 0, 0, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-secondary)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Icon */}
              <div
                className="flex items-center justify-center w-12 h-12 rounded-xl text-2xl mb-5"
                style={{
                  background: `color-mix(in srgb, ${b.color} 15%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${b.color} 25%, transparent)`,
                }}
              >
                {b.icon}
              </div>

              {/* Title */}
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                {b.title}
              </h3>

              {/* Description */}
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {b.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/signup"
            className="inline-block px-10 py-4 text-base font-semibold rounded-xl transition-all"
            style={{
              background: "var(--accent-blue)",
              color: "#fff",
              boxShadow:
                "0 0 30px rgba(59, 130, 246, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)",
            }}
          >
            Start Free
          </Link>
        </div>
      </div>
    </section>
  );
}
