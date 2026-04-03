import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { ContactForm } from "./contact-form";
import "@/styles/marketing.css";

export const metadata: Metadata = {
  title: "Contact Us | AdPilot",
  description:
    "Get in touch with the AdPilot team. We respond within 24 hours across all timezones.",
  openGraph: {
    title: "Contact Us | AdPilot",
    description:
      "Get in touch with the AdPilot team. We respond within 24 hours across all timezones.",
    type: "website",
    url: "https://adpilot.au/contact",
  },
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" style={{ background: "var(--bg-primary)" }}>
        <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="hero-glow" style={{ top: "-200px", left: "50%" }} />
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <p
                className="marketing-label mb-4"
                style={{ color: "var(--accent-blue)" }}
              >
                Contact
              </p>
              <h1
                className="marketing-h1 mb-6"
                style={{ color: "var(--text-primary)" }}
              >
                Get in Touch
              </h1>
              <p
                className="marketing-body max-w-2xl mx-auto"
                style={{ color: "var(--text-secondary)" }}
              >
                Have a question about AdPilot? Want to discuss which plan is
                right for your business? We're here to help.
              </p>
            </div>

            <ContactForm />

            {/* Support info */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div
                className="glass rounded-xl p-6 text-center"
                style={{ borderColor: "var(--border-primary)" }}
              >
                <h3
                  className="text-sm font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Email Support
                </h3>
                <a
                  href="mailto:support@adpilot.com.au"
                  className="text-sm font-medium"
                  style={{ color: "var(--accent-blue)" }}
                >
                  support@adpilot.com.au
                </a>
                <p
                  className="text-xs mt-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  We respond within 24 hours across all timezones
                </p>
              </div>

              <div
                className="glass rounded-xl p-6 text-center"
                style={{ borderColor: "var(--border-primary)" }}
              >
                <h3
                  className="text-sm font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Self-Service Help
                </h3>
                <Link
                  href="/docs"
                  className="text-sm font-medium"
                  style={{ color: "var(--accent-blue)" }}
                >
                  Browse Documentation
                </Link>
                <p
                  className="text-xs mt-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Guides, API reference, and integration docs
                </p>
              </div>

              <div
                className="glass rounded-xl p-6 text-center"
                style={{ borderColor: "var(--border-primary)" }}
              >
                <h3
                  className="text-sm font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Security Issues
                </h3>
                <a
                  href="mailto:security@adpilot.com.au"
                  className="text-sm font-medium"
                  style={{ color: "var(--accent-blue)" }}
                >
                  security@adpilot.com.au
                </a>
                <p
                  className="text-xs mt-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Responsible disclosure and security concerns
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
