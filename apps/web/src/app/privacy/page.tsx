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
        <div
          className="mb-6 rounded-lg px-4 py-3 text-sm font-medium"
          style={{
            background: "var(--bg-tertiary)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-primary)",
          }}
        >
          [DRAFT — REQUIRES LEGAL REVIEW] This privacy policy is a working draft
          and has not yet been reviewed by a qualified legal professional.
        </div>

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
            <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
              [DRAFT — REQUIRES LEGAL REVIEW]
            </p>
            <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <p>
                AdPilot uses a cookie consent banner that appears before any
                non-essential cookies are loaded (GDPR requirement). You can
                manage your cookie preferences at any time using the
                &quot;Cookie Preferences&quot; link in the page footer.
              </p>
              <p>
                <strong style={{ color: "var(--text-primary)" }}>Essential cookies (always on):</strong>{" "}
                Session cookies for authentication, CSRF protection tokens, and
                the cookie consent preference itself ({`adpilot-consent`}).
                These are required for the platform to function and cannot be
                disabled.
              </p>
              <p>
                <strong style={{ color: "var(--text-primary)" }}>Analytics cookies (opt-in):</strong>{" "}
                We use PostHog for product analytics and feature management.
                PostHog is only loaded if you consent to analytics cookies.
                PostHog data is used to understand how users interact with
                AdPilot and to improve the product.
              </p>
              <p>
                <strong style={{ color: "var(--text-primary)" }}>Marketing cookies (opt-in):</strong>{" "}
                Third-party tracking pixels and marketing tools. Currently
                AdPilot does not use marketing cookies, but this category is
                reserved for future use and requires your explicit consent.
              </p>
              <p>
                We do not sell your data to advertisers or data brokers. We do
                not use third-party advertising cookies without your consent.
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
            <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
              [DRAFT — REQUIRES LEGAL REVIEW]
            </p>
            <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <p>We retain data for the following periods:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>
                  <strong style={{ color: "var(--text-primary)" }}>Account data:</strong>{" "}
                  Retained while your account is active.
                </li>
                <li>
                  <strong style={{ color: "var(--text-primary)" }}>Posts and campaigns:</strong>{" "}
                  Retained while your account is active; deleted 7 days after
                  account deletion request (grace period).
                </li>
                <li>
                  <strong style={{ color: "var(--text-primary)" }}>Analytics snapshots:</strong>{" "}
                  Retained according to your plan tier (Free: 30 days, Pro: 1
                  year, Agency: 2 years).
                </li>
                <li>
                  <strong style={{ color: "var(--text-primary)" }}>OAuth tokens:</strong>{" "}
                  Revoked and deleted immediately upon disconnection or account
                  deletion.
                </li>
                <li>
                  <strong style={{ color: "var(--text-primary)" }}>Invoices and billing records:</strong>{" "}
                  Anonymized upon account deletion but retained for 7 years per
                  Australian tax law requirements.
                </li>
                <li>
                  <strong style={{ color: "var(--text-primary)" }}>Audit logs:</strong>{" "}
                  Retained for 90 days, then anonymized. Anonymized logs may be
                  retained for security and compliance purposes.
                </li>
                <li>
                  <strong style={{ color: "var(--text-primary)" }}>Backups:</strong>{" "}
                  Purged within 90 days of data deletion.
                </li>
              </ul>
              <p>
                Upon account deletion, we initiate a 7-day grace period. After
                this period, personal data, content, and OAuth tokens are
                permanently deleted. You can request immediate deletion at any
                time by contacting{" "}
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
              8. Third-Party Services (Subprocessors)
            </h2>
            <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
              [DRAFT — REQUIRES LEGAL REVIEW] We share data with the following
              third-party service providers (subprocessors) to operate AdPilot:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ color: "var(--text-secondary)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                    <th className="text-left py-2 pr-4 font-medium" style={{ color: "var(--text-primary)" }}>Service</th>
                    <th className="text-left py-2 pr-4 font-medium" style={{ color: "var(--text-primary)" }}>Purpose</th>
                    <th className="text-left py-2 font-medium" style={{ color: "var(--text-primary)" }}>Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border-primary)" }}>
                  <tr><td className="py-2 pr-4">Vercel</td><td className="py-2 pr-4">Hosting and edge functions</td><td className="py-2">US (global edge)</td></tr>
                  <tr><td className="py-2 pr-4">Neon (PostgreSQL)</td><td className="py-2 pr-4">Primary database</td><td className="py-2">US</td></tr>
                  <tr><td className="py-2 pr-4">Stripe</td><td className="py-2 pr-4">Payment processing</td><td className="py-2">US</td></tr>
                  <tr><td className="py-2 pr-4">Anthropic (Claude AI)</td><td className="py-2 pr-4">AI content generation</td><td className="py-2">US</td></tr>
                  <tr><td className="py-2 pr-4">Resend</td><td className="py-2 pr-4">Transactional email</td><td className="py-2">US</td></tr>
                  <tr><td className="py-2 pr-4">PostHog</td><td className="py-2 pr-4">Product analytics (with consent)</td><td className="py-2">US/EU</td></tr>
                  <tr><td className="py-2 pr-4">Facebook / Instagram (Meta)</td><td className="py-2 pr-4">Social publishing and analytics</td><td className="py-2">US</td></tr>
                  <tr><td className="py-2 pr-4">LinkedIn (Microsoft)</td><td className="py-2 pr-4">Social publishing and analytics</td><td className="py-2">US</td></tr>
                  <tr><td className="py-2 pr-4">X / Twitter</td><td className="py-2 pr-4">Social publishing and analytics</td><td className="py-2">US</td></tr>
                  <tr><td className="py-2 pr-4">TikTok (ByteDance)</td><td className="py-2 pr-4">Social publishing and analytics</td><td className="py-2">US/Singapore</td></tr>
                  <tr><td className="py-2 pr-4">YouTube (Google)</td><td className="py-2 pr-4">Video publishing and analytics</td><td className="py-2">US</td></tr>
                  <tr><td className="py-2 pr-4">Pinterest</td><td className="py-2 pr-4">Social publishing and analytics</td><td className="py-2">US</td></tr>
                  <tr><td className="py-2 pr-4">Google Ads</td><td className="py-2 pr-4">Advertising management</td><td className="py-2">US</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm mt-3" style={{ color: "var(--text-secondary)" }}>
              Each third-party service has its own privacy policy governing their
              use of data. We encourage you to review their policies directly.
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
            <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
              [DRAFT — REQUIRES LEGAL REVIEW]
            </p>
            <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <p>
                Regardless of your location, you have the following rights
                regarding your personal data:
              </p>
              <ul className="list-disc ml-5 space-y-1">
                <li>
                  <strong style={{ color: "var(--text-primary)" }}>Access (Data Export):</strong>{" "}
                  Request a copy of all personal data we hold about you. You can
                  use the self-service data export in your account settings, which
                  provides a machine-readable JSON file containing your profile,
                  posts, analytics, and connection metadata.
                </li>
                <li>
                  <strong style={{ color: "var(--text-primary)" }}>Correction:</strong>{" "}
                  Request correction of inaccurate personal data. You can edit
                  your name, email, timezone, and locale in your account settings.
                </li>
                <li>
                  <strong style={{ color: "var(--text-primary)" }}>Deletion:</strong>{" "}
                  Request deletion of your personal data. You can initiate account
                  deletion from your account settings. Accounts are marked for
                  deletion with a 7-day grace period, after which all personal
                  data is permanently removed. Invoices are anonymized for tax
                  compliance.
                </li>
                <li>
                  <strong style={{ color: "var(--text-primary)" }}>Portability:</strong>{" "}
                  Request an export of your data in a machine-readable format
                  (JSON). Available via the data export feature.
                </li>
                <li>
                  <strong style={{ color: "var(--text-primary)" }}>Restriction:</strong>{" "}
                  Request that we limit how we process your data.
                </li>
                <li>
                  <strong style={{ color: "var(--text-primary)" }}>Objection:</strong>{" "}
                  Object to processing of your personal data where we rely on
                  legitimate interest as the legal basis.
                </li>
                <li>
                  <strong style={{ color: "var(--text-primary)" }}>Do Not Sell (CCPA):</strong>{" "}
                  AdPilot does not sell personal data to third parties.
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
              13. Children&apos;s Privacy
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              [DRAFT — REQUIRES LEGAL REVIEW] AdPilot is not directed at
              children under the age of 16. We do not knowingly collect personal
              information from children under 16. If we become aware that a
              child under 16 has provided us with personal data, we will take
              steps to delete that information promptly.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              14. Changes to This Policy
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              We may update this privacy policy from time to time. Material
              changes will be communicated via email at least 30 days before they
              take effect. The &quot;Last updated&quot; date at the top of this
              page indicates when the policy was last revised. Continued use of
              AdPilot after changes take effect constitutes acceptance of the
              updated policy.
            </p>
          </section>

          {/* 15 */}
          <section>
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              15. Contact
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
