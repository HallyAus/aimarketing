import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import "@/styles/marketing.css";

export const metadata: Metadata = {
  title: "Careers | AdPilot",
  description:
    "Join the AdPilot team. We're building AI-powered marketing automation for businesses everywhere.",
  openGraph: {
    title: "Careers | AdPilot",
    description:
      "Join the AdPilot team. We're building AI-powered marketing automation for businesses everywhere.",
    type: "website",
    url: "https://adpilot.au/careers",
  },
};

const qualities = [
  {
    title: "Builders Over Talkers",
    description:
      "We value people who ship. Whether it's code, design, copy, or strategy — show us what you've made.",
  },
  {
    title: "Global Mindset",
    description:
      "Our users span every timezone. We need people who think beyond their own market and build for a worldwide audience.",
  },
  {
    title: "AI-Native Thinkers",
    description:
      "You don't need to be an ML engineer, but you should be excited about what AI can do and have strong opinions about how it should be used responsibly.",
  },
  {
    title: "Low Ego, High Output",
    description:
      "Small team means everyone does a bit of everything. We want people who care more about outcomes than titles.",
  },
];

export default function CareersPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" style={{ background: "var(--bg-primary)" }}>
        <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="hero-glow" style={{ top: "-200px", left: "50%" }} />
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-16">
              <p
                className="marketing-label mb-4"
                style={{ color: "var(--accent-blue)" }}
              >
                Careers
              </p>
              <h1
                className="marketing-h1 mb-6"
                style={{ color: "var(--text-primary)" }}
              >
                We're Growing
              </h1>
              <p
                className="marketing-body max-w-2xl mx-auto"
                style={{ color: "var(--text-secondary)" }}
              >
                AdPilot is building the future of AI-powered marketing
                automation. We don't have open roles right now, but we're always
                interested in hearing from exceptional people.
              </p>
            </div>

            {/* What we look for */}
            <div className="mb-16">
              <h2
                className="marketing-h2 text-center mb-10"
                style={{ color: "var(--text-primary)" }}
              >
                What We Look For
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {qualities.map((q) => (
                  <div
                    key={q.title}
                    className="glass card-glow rounded-xl p-6"
                    style={{ borderColor: "var(--border-primary)" }}
                  >
                    <h3
                      className="text-lg font-semibold mb-2"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {q.title}
                    </h3>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {q.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Check back / General interest */}
            <div
              className="glass rounded-2xl p-8 md:p-12 text-center"
              style={{ borderColor: "var(--border-primary)" }}
            >
              <h2
                className="text-xl font-semibold mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                No Open Roles — Check Back Soon
              </h2>
              <p
                className="marketing-body max-w-xl mx-auto mb-6"
                style={{ color: "var(--text-secondary)" }}
              >
                We're a small, focused team that hires intentionally. If you
                think you'd be a great fit, we'd love to hear from you. Drop us
                a note with what you've built and why AdPilot interests you.
              </p>
              <a href="mailto:careers@adpilot.com.au" className="btn-cta">
                careers@adpilot.com.au
              </a>
              <p
                className="text-xs mt-6"
                style={{ color: "var(--text-secondary)" }}
              >
                Remote-friendly. We care about what you ship, not where you sit.
              </p>
            </div>

            {/* Link back */}
            <div className="text-center mt-12">
              <Link
                href="/about"
                className="text-sm font-medium"
                style={{ color: "var(--accent-blue)" }}
              >
                Learn more about AdPilot &rarr;
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
