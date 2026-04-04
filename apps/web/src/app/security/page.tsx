import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import "@/styles/marketing.css";

export const metadata: Metadata = {
  title: "Security | ReachPilot",
  description:
    "How ReachPilot protects your data. Encryption, OAuth security, infrastructure, compliance, and responsible disclosure.",
  openGraph: {
    title: "Security | ReachPilot",
    description:
      "How ReachPilot protects your data. Encryption, compliance, and infrastructure security.",
    type: "website",
    url: "https://reachpilot.au/security",
  },
};

const sections = [
  {
    title: "Data Encryption",
    content: [
      "All data at rest is encrypted using AES-256-GCM, including OAuth tokens, user data, and analytics. Platform access tokens receive an additional layer of application-level encryption before storage.",
      "All data in transit is protected with TLS 1.3. We enforce HSTS headers and certificate pinning on all API endpoints. Internal service-to-service communication uses mutual TLS.",
    ],
  },
  {
    title: "OAuth Security",
    content: [
      "All platform integrations use OAuth 2.0 with PKCE (Proof Key for Code Exchange) to prevent authorization code interception attacks. We request minimal permissions — only what's required for publishing, scheduling, and analytics.",
      "OAuth tokens are encrypted at rest and rotated automatically when platforms support refresh tokens. You can revoke any platform connection instantly from your dashboard, which immediately invalidates all stored tokens.",
    ],
  },
  {
    title: "Infrastructure",
    content: [
      "ReachPilot runs on Vercel and AWS infrastructure with automatic scaling, DDoS protection, and geographic redundancy. Our database layer uses encrypted connections with row-level security.",
      "We are actively working toward SOC 2 Type II certification. Our infrastructure follows the principle of least privilege, with automated security scanning on every deployment.",
    ],
  },
  {
    title: "Compliance",
    content: [
      "GDPR: ReachPilot complies with the General Data Protection Regulation. EU users can exercise their rights to access, rectification, erasure, data portability, and restriction of processing. We maintain records of processing activities and have designated a data protection contact.",
      "Australian Privacy Act: As an Australian-built platform, ReachPilot complies with the Australian Privacy Principles (APPs). We maintain a transparent privacy policy, collect only necessary personal information, and provide access and correction mechanisms.",
      "CCPA: California residents have the right to know what personal information we collect, request deletion, and opt out of the sale of personal information. ReachPilot does not sell personal data.",
    ],
  },
  {
    title: "Data Residency",
    content: [
      "User data is primarily stored in US-based data centers with Vercel and AWS. For users subject to data residency requirements, we support data processing agreements (DPAs) that outline cross-border transfer safeguards.",
      "International data transfers are protected using Standard Contractual Clauses (SCCs) where applicable. Contact us for a copy of our DPA or for specific data residency questions.",
    ],
  },
];

export default function SecurityPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" style={{ background: "var(--bg-primary)" }}>
        <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="hero-glow" style={{ top: "-200px", left: "40%" }} />
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-16">
              <p
                className="marketing-label mb-4"
                style={{ color: "var(--accent-blue)" }}
              >
                Security
              </p>
              <h1
                className="marketing-h1 mb-6"
                style={{ color: "var(--text-primary)" }}
              >
                Security at ReachPilot
              </h1>
              <p
                className="marketing-body max-w-2xl mx-auto"
                style={{ color: "var(--text-secondary)" }}
              >
                Protecting your data and your connected accounts is fundamental
                to everything we build. Here's how we keep your information
                safe.
              </p>
            </div>

            <div className="space-y-10">
              {sections.map((section) => (
                <div
                  key={section.title}
                  className="glass rounded-xl p-6 md:p-8"
                  style={{ borderColor: "var(--border-primary)" }}
                >
                  <h2
                    className="text-xl font-semibold mb-4"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {section.title}
                  </h2>
                  <div className="space-y-3">
                    {section.content.map((paragraph, i) => (
                      <p
                        key={i}
                        className="text-sm leading-relaxed"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Responsible Disclosure */}
            <div
              className="glass rounded-2xl p-8 md:p-12 mt-10 text-center"
              style={{
                borderColor: "var(--accent-blue)",
                borderWidth: "1px",
              }}
            >
              <h2
                className="text-xl font-semibold mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                Responsible Disclosure
              </h2>
              <p
                className="text-sm mb-4 max-w-lg mx-auto"
                style={{ color: "var(--text-secondary)" }}
              >
                If you discover a security vulnerability in ReachPilot, please
                report it responsibly. We take all reports seriously and will
                respond promptly.
              </p>
              <a
                href="mailto:security@reachpilot.com.au"
                className="btn-cta"
              >
                security@reachpilot.com.au
              </a>
              <p
                className="text-xs mt-4"
                style={{ color: "var(--text-secondary)" }}
              >
                Please do not publicly disclose vulnerabilities before we have
                had a chance to investigate and address them.
              </p>
            </div>

            <div className="text-center mt-10">
              <Link
                href="/privacy"
                className="text-sm font-medium mr-6"
                style={{ color: "var(--accent-blue)" }}
              >
                Privacy Policy &rarr;
              </Link>
              <Link
                href="/terms"
                className="text-sm font-medium"
                style={{ color: "var(--accent-blue)" }}
              >
                Terms of Service &rarr;
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
