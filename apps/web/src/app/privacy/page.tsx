import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import "@/styles/marketing.css";

export const metadata: Metadata = {
  title: "Privacy Policy | AdPilot",
  description:
    "Learn how AdPilot collects, uses, and protects your data. Covers GDPR, Australian Privacy Act, and CCPA compliance.",
  openGraph: {
    title: "Privacy Policy | AdPilot",
    description:
      "How AdPilot collects, uses, and protects your data across all jurisdictions.",
    type: "website",
    url: "https://adpilot.au/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main
        id="main-content"
        className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20"
        style={{ background: "var(--bg-primary)", minHeight: "100vh" }}
      >
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Privacy Policy
        </h1>
        <p className="text-sm mb-10" style={{ color: "var(--text-secondary)" }}>
          Last updated: April 3, 2026
        </p>

        <div className="space-y-8">
          {/* 1 */}
          <section>
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              1. Information We Collect
            </h2>
            <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <p>
                <strong style={{ color: "var(--text-primary)" }}>Account information:</strong>{" "}
                When you create an AdPilot account, we collect your name, email
                address, company name (if provided), and timezone.
              </p>
              <p>
                <strong style={{ color: "var(--text-primary)" }}>OAuth tokens:</strong>{" "}
                When you connect social media platforms, we receive and store
                OAuth access tokens and refresh tokens. These tokens are
                encrypted at rest using AES-256-GCM and are used solely to
                publish content, retrieve analytics, and manage your connected
                accounts on your behalf.
              </p>
              <p>
                <strong style={{ color: "var(--text-primary)" }}>Usage data:</strong>{" "}
                We collect information about how you interact with AdPilot,
                including features used, content created, posts scheduled, and
                analytics viewed. This helps us improve the platform.
              </p>
              <p>
                <strong style={{ color: "var(--text-primary)" }}>Payment information:</strong>{" "}
                Payment processing is handled by Stripe. We do not store credit
                card numbers. We receive and store your Stripe customer ID,
                subscription status, and billing history.
              </p>
            </div>
          </section>

          {/* 2 */}
          <section>
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              2. How We Use Your Information
            </h2>
            <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <p>
                We use your information to provide and improve AdPilot's
                marketing automation services, including: generating AI-powered
                content, publishing to connected social media platforms,
                collecting and displaying analytics, managing your subscription,
                and sending transactional emails (account confirmations,
                password resets, billing receipts).
              </p>
              <p>
                We may send product updates and feature announcements. You can
                unsubscribe from marketing emails at any time.
              </p>
            </div>
          </section>

          {/* 3 */}
          <section>
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              3. Platform Data and OAuth Tokens
            </h2>
            <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <p>
                When you connect social media accounts, we access platform APIs
                using OAuth 2.0 with PKCE. We request minimal permissions —
                only what is required for publishing, scheduling, and analytics
                retrieval.
              </p>
              <p>
                OAuth tokens are encrypted at rest using AES-256-GCM and are
                never shared with third parties. You can revoke any platform
                connection at any time from your dashboard, which immediately
                invalidates stored tokens.
              </p>
              <p>
                We store aggregate analytics data from connected platforms. We
                do not store personal data of your audience or followers.
              </p>
            </div>
          </section>

          {/* 4 */}
          <section>
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              4. Cookies and Tracking
            </h2>
            <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <p>
                <strong style={{ color: "var(--text-primary)" }}>Essential cookies:</strong>{" "}
                We use session cookies for authentication and security. These
                are required for the platform to function.
              </p>
              <p>
                <strong style={{ color: "var(--text-primary)" }}>Analytics cookies:</strong>{" "}
                We use PostHog for product analytics and feature management.
                PostHog data is used to understand how users interact with
                AdPilot and to improve the product. You can opt out of analytics
                tracking in your account settings.
              </p>
              <p>
                We do not use third-party advertising cookies. We do not sell
                your data to advertisers or data brokers.
              </p>
            </div>
          </section>

          {/* 5 */}
          <section>
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              5. Data Security
            </h2>
            <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <p>
                All platform access tokens are encrypted at rest using
                AES-256-GCM. All data in transit is protected with TLS 1.3. We
                use secure HTTPS connections, enforce HSTS headers, and follow
                industry best practices for data protection.
              </p>
              <p>
                Our infrastructure runs on Vercel and AWS with automated
                security scanning, DDoS protection, and geographic redundancy.
              </p>
            </div>
          </section>

          {/* 6 */}
          <section>
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              6. Data Retention
            </h2>
            <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <p>
                We retain your account data for as long as your account is
                active. Analytics data is retained according to your plan tier.
                Upon account cancellation, we delete your personal data,
                content, and OAuth tokens within 30 days.
              </p>
              <p>
                Backups containing your data are purged within 90 days of
                deletion. You can request immediate deletion at any time by
                contacting{" "}
                <a
                  href="mailto:support@adpilot.com.au"
                  style={{ color: "var(--accent-blue)" }}
                >
                  support@adpilot.com.au
                </a>
                .
              </p>
            </div>
          </section>

          {/* 7 */}
          <section>
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              7. International Data Transfers
            </h2>
            <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <p>
                AdPilot is built in Australia and serves users globally. User
                data is primarily stored in US-based data centers via Vercel and
                AWS. International data transfers are protected using Standard
                Contractual Clauses (SCCs) where applicable.
              </p>
              <p>
                For users subject to specific data residency requirements, we
                support data processing agreements (DPAs). Contact us for
                details.
              </p>
            </div>
          </section>

          {/* 8 */}
          <section>
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              8. Third-Party Services
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              We integrate with social media platforms (Facebook, Instagram,
              TikTok, LinkedIn, X/Twitter, YouTube, Google Ads, Pinterest,
              Snapchat), Stripe for payment processing, PostHog for product
              analytics, and Anthropic (Claude AI) for content generation. Each
              third-party service has its own privacy policy governing their use
              of data.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              9. Your Rights
            </h2>
            <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <p>
                Regardless of your location, you have the following rights
                regarding your personal data:
              </p>
              <ul className="list-disc ml-5 space-y-1">
                <li>
                  <strong style={{ color: "var(--text-primary)" }}>Access:</strong>{" "}
                  Request a copy of all personal data we hold about you.
                </li>
                <li>
                  <strong style={{ color: "var(--text-primary)" }}>Correction:</strong>{" "}
                  Request correction of inaccurate personal data.
                </li>
                <li>
                  <strong style={{ color: "var(--text-primary)" }}>Deletion:</strong>{" "}
                  Request deletion of your personal data. We will delete your
                  data within 30 days, subject to legal retention obligations.
                </li>
                <li>
                  <strong style={{ color: "var(--text-primary)" }}>Portability:</strong>{" "}
                  Request an export of your data in a machine-readable format
                  (JSON or CSV).
                </li>
                <li>
                  <strong style={{ color: "var(--text-primary)" }}>Restriction:</strong>{" "}
                  Request that we limit how we process your data.
                </li>
                <li>
                  <strong style={{ color: "var(--text-primary)" }}>Disconnection:</strong>{" "}
                  Revoke platform connections at any time through your dashboard
                  settings, immediately invalidating stored tokens.
                </li>
              </ul>
            </div>
          </section>

          {/* 10 */}
          <section>
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              10. GDPR (European Economic Area)
            </h2>
            <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <p>
                If you are in the EEA, our legal bases for processing your data
                are: contract performance (providing the AdPilot service),
                legitimate interest (improving our product), and consent (where
                applicable, such as marketing emails).
              </p>
              <p>
                You may exercise your GDPR rights — including the right to
                erasure, data portability, and objection to processing — by
                contacting{" "}
                <a
                  href="mailto:privacy@adpilot.com.au"
                  style={{ color: "var(--accent-blue)" }}
                >
                  privacy@adpilot.com.au
                </a>
                .
              </p>
            </div>
          </section>

          {/* 11 */}
          <section>
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              11. Australian Privacy Act
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              AdPilot complies with the Australian Privacy Principles (APPs)
              under the Privacy Act 1988 (Cth). We collect only necessary
              personal information, maintain a transparent privacy policy, and
              provide access and correction mechanisms. If you believe we have
              breached the APPs, you may lodge a complaint with us or with the
              Office of the Australian Information Commissioner (OAIC).
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              12. CCPA (California)
            </h2>
            <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <p>
                California residents have the right to know what personal
                information we collect, request deletion of that information,
                and opt out of the sale of personal information. AdPilot does
                not sell personal data.
              </p>
              <p>
                To exercise your CCPA rights, contact{" "}
                <a
                  href="mailto:privacy@adpilot.com.au"
                  style={{ color: "var(--accent-blue)" }}
                >
                  privacy@adpilot.com.au
                </a>
                .
              </p>
            </div>
          </section>

          {/* 13 */}
          <section>
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              13. Contact
            </h2>
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              <p>
                For privacy inquiries, contact us at{" "}
                <a
                  href="mailto:privacy@adpilot.com.au"
                  style={{ color: "var(--accent-blue)" }}
                >
                  privacy@adpilot.com.au
                </a>
                .
              </p>
              <p className="mt-2">
                For security issues, contact{" "}
                <a
                  href="mailto:security@adpilot.com.au"
                  style={{ color: "var(--accent-blue)" }}
                >
                  security@adpilot.com.au
                </a>
                .
              </p>
            </div>
          </section>
        </div>

        <div
          className="mt-12 pt-8 text-center"
          style={{ borderTop: "1px solid var(--border-primary)" }}
        >
          <Link
            href="/terms"
            className="text-sm font-medium mr-6"
            style={{ color: "var(--accent-blue)" }}
          >
            Terms of Service &rarr;
          </Link>
          <Link
            href="/security"
            className="text-sm font-medium"
            style={{ color: "var(--accent-blue)" }}
          >
            Security &rarr;
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
