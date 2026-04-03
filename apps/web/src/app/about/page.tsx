import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import "@/styles/marketing.css";

export const metadata: Metadata = {
  title: "About AdPilot | AI-Powered Marketing Automation",
  description:
    "AdPilot is on a mission to make AI-powered marketing accessible to every business, everywhere. Built in Australia for the world.",
  openGraph: {
    title: "About AdPilot | AI-Powered Marketing Automation",
    description:
      "Making AI-powered marketing accessible to every business, everywhere.",
    type: "website",
    url: "https://adpilot.au/about",
  },
};

const values = [
  {
    title: "Accessible by Default",
    description:
      "Great marketing tools shouldn't require enterprise budgets. Our free tier is a real product, not a crippled trial.",
  },
  {
    title: "AI as Co-Pilot",
    description:
      "AI handles the mechanical work so you can focus on strategy and creativity. We augment marketers, we don't replace them.",
  },
  {
    title: "Global First",
    description:
      "Built for every timezone, every market, every business size. From solo founders to growing agencies worldwide.",
  },
  {
    title: "Ship Every Week",
    description:
      "We believe in continuous improvement. Small, frequent releases beat big, infrequent launches every time.",
  },
];

const platforms = [
  "Facebook",
  "Instagram",
  "TikTok",
  "LinkedIn",
  "X (Twitter)",
  "YouTube",
  "Google Ads",
  "Pinterest",
  "Snapchat",
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" style={{ background: "var(--bg-primary)" }}>
        {/* Hero */}
        <section
          className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8"
          style={{ overflow: "hidden" }}
        >
          <div className="hero-glow" style={{ top: "-200px", left: "30%" }} />
          <div className="mx-auto max-w-4xl text-center">
            <p
              className="marketing-label mb-4"
              style={{ color: "var(--accent-blue)" }}
            >
              About AdPilot
            </p>
            <h1
              className="marketing-h1 mb-6"
              style={{ color: "var(--text-primary)" }}
            >
              Making AI-powered marketing{" "}
              <span className="gradient-text">accessible to every business</span>
            </h1>
            <p
              className="marketing-body max-w-2xl mx-auto"
              style={{ color: "var(--text-secondary)" }}
            >
              We believe every business — from solo founders to growing agencies
              — deserves access to intelligent marketing automation. AdPilot
              puts the power of AI-driven content creation, scheduling, and
              analytics into one platform anyone can use.
            </p>
          </div>
        </section>

        {/* Founding Story */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div
              className="glass rounded-2xl p-8 md:p-12"
              style={{ borderColor: "var(--border-primary)" }}
            >
              <h2
                className="marketing-h2 mb-6"
                style={{ color: "var(--text-primary)" }}
              >
                Our Story
              </h2>
              <div className="space-y-4 marketing-body">
                <p style={{ color: "var(--text-secondary)" }}>
                  AdPilot was born out of frustration. Founder Daniel Hall was
                  managing social media across multiple projects, switching
                  between five dashboards, copying content between platforms, and
                  losing track of what was scheduled where. The existing tools
                  were either too expensive or too limited.
                </p>
                <p style={{ color: "var(--text-secondary)" }}>
                  Built in Australia, AdPilot was global from day one. Operating
                  across Australian, Asian, European, and American timezones
                  meant timezone handling wasn't an afterthought — it was a core
                  requirement from the first line of code.
                </p>
                <p style={{ color: "var(--text-secondary)" }}>
                  When we integrated Claude AI, the product transformed. Instead
                  of just scheduling posts, users could generate entire content
                  calendars. Instead of manually adapting content for each
                  platform, AI handled the adaptation while preserving brand
                  voice. That's the product we ship today — and we improve it
                  every week.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technology */}
        <section
          className="py-20 px-4 sm:px-6 lg:px-8"
          style={{ background: "var(--bg-secondary)" }}
        >
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2
                className="marketing-h2 mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                Powered by Cutting-Edge AI
              </h2>
              <p
                className="marketing-body max-w-2xl mx-auto"
                style={{ color: "var(--text-secondary)" }}
              >
                AdPilot combines Claude AI with deep platform integrations to
                deliver marketing automation that actually understands your
                brand.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass card-glow rounded-xl p-6">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 text-lg font-bold"
                  style={{
                    background: "rgba(59, 130, 246, 0.15)",
                    color: "var(--accent-blue)",
                  }}
                >
                  AI
                </div>
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Claude AI Integration
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Generate platform-optimized content, analyze performance
                  patterns, and get actionable recommendations — all powered by
                  Anthropic's Claude.
                </p>
              </div>

              <div className="glass card-glow rounded-xl p-6">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 text-lg font-bold"
                  style={{
                    background: "rgba(139, 92, 246, 0.15)",
                    color: "var(--accent-purple)",
                  }}
                >
                  9
                </div>
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  9-Platform Publishing
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Publish to{" "}
                  {platforms.map((p, i) => (
                    <span key={p}>
                      {p}
                      {i < platforms.length - 1 ? ", " : ""}
                    </span>
                  ))}{" "}
                  from a single dashboard.
                </p>
              </div>

              <div className="glass card-glow rounded-xl p-6">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 text-lg font-bold"
                  style={{
                    background: "rgba(59, 130, 246, 0.15)",
                    color: "var(--accent-blue)",
                  }}
                >
                  TZ
                </div>
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Timezone Intelligence
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Automatic timezone detection, staggered publishing across
                  regions, and DST-aware scheduling for global audiences.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2
                className="marketing-h2 mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                What We Believe
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {values.map((value) => (
                <div
                  key={value.title}
                  className="glass card-glow rounded-xl p-6"
                >
                  <h3
                    className="text-lg font-semibold mb-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {value.title}
                  </h3>
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section
          className="py-20 px-4 sm:px-6 lg:px-8"
          style={{ background: "var(--bg-secondary)" }}
        >
          <div className="mx-auto max-w-3xl text-center">
            <h2
              className="marketing-h2 mb-6"
              style={{ color: "var(--text-primary)" }}
            >
              Built by Makers
            </h2>
            <p
              className="marketing-body mb-4"
              style={{ color: "var(--text-secondary)" }}
            >
              Built by makers who believe every business deserves great
              marketing. We're a small, focused team shipping fast and learning
              from every user.
            </p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Interested in joining us?{" "}
              <Link
                href="/careers"
                className="font-medium"
                style={{ color: "var(--accent-blue)" }}
              >
                Check our careers page
              </Link>
              .
            </p>
          </div>
        </section>

        {/* Vision + CTA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2
              className="marketing-h2 mb-6"
              style={{ color: "var(--text-primary)" }}
            >
              Our Vision
            </h2>
            <p
              className="marketing-body mb-8"
              style={{ color: "var(--text-secondary)" }}
            >
              A single dashboard where any business, anywhere in the world, can
              manage their entire social media presence with AI as their
              co-pilot. We're democratizing marketing automation — one feature,
              one integration, one user at a time.
            </p>
            <Link href="/signup" className="btn-cta">
              Start Free
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
