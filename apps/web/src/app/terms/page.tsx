import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import "@/styles/marketing.css";

export const metadata: Metadata = {
  title: "Terms of Service | AdPilot",
  description:
    "Terms of service for AdPilot marketing automation platform. Subscription terms, data ownership, and user responsibilities.",
  openGraph: {
    title: "Terms of Service | AdPilot",
    description:
      "Terms of service for AdPilot — subscription terms, data ownership, and user responsibilities.",
    type: "website",
    url: "https://adpilot.au/terms",
  },
};

export default function TermsPage() {
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
          [DRAFT — REQUIRES LEGAL REVIEW] These terms of service are a working
          draft and have not yet been reviewed by a qualified legal professional.
        </div>

        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Terms of Service
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
              1. Acceptance of Terms
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              By creating an account or using AdPilot, you agree to these Terms
              of Service. AdPilot is a software-as-a-service (SaaS) marketing
              automation platform that enables you to create, schedule, and
              publish content across multiple social media platforms using
              AI-powered tools. If you do not agree to these terms, do not use
              AdPilot.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              2. Account Responsibility
            </h2>
            <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <p>
                You are responsible for maintaining the security of your account
                credentials and all activity that occurs under your account. You
                must have authorization to manage any social media accounts you
                connect to AdPilot.
              </p>
              <p>
                You must be at least 18 years old to create an account. If you
                are creating an account on behalf of a company, you represent
                that you have authority to bind that company to these terms.
              </p>
            </div>
          </section>

          {/* 3 */}
          <section>
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              3. Service Plans and Pricing
            </h2>
            <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <p>AdPilot offers the following subscription plans:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>
                  <strong style={{ color: "var(--text-primary)" }}>Free:</strong>{" "}
                  $0/month — limited features, ideal for individuals getting
                  started.
                </li>
                <li>
                  <strong style={{ color: "var(--text-primary)" }}>Pro:</strong>{" "}
                  $49/month (USD) — full AI content studio, all platforms,
                  advanced analytics.
                </li>
                <li>
                  <strong style={{ color: "var(--text-primary)" }}>Agency:</strong>{" "}
                  $299/month (USD) — unlimited client accounts, team
                  collaboration, priority support, custom webhooks.
                </li>
              </ul>
              <p>
                All prices are in US Dollars (USD). We accept international
                credit and debit cards via Stripe. Prices may change with 30
                days notice. Existing subscribers will be notified by email
                before any price change takes effect.
              </p>
            </div>
          </section>

          {/* 4 */}
          <section>
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              4. Billing and Cancellation
            </h2>
            <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
              [DRAFT — REQUIRES LEGAL REVIEW]
            </p>
            <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <p>
                Paid subscriptions are billed monthly in advance and
                automatically renew unless cancelled. You can cancel your
                subscription at any time from your account settings.
                Cancellation takes effect at the end of the current billing
                period — you retain access until then.
              </p>
              <p>
                We do not offer prorated refunds for partial months. If you
                downgrade from a paid plan to Free, you retain access to paid
                features until the end of your current billing cycle.
              </p>
              <p>
                <strong style={{ color: "var(--text-primary)" }}>Account deletion:</strong>{" "}
                You may request full account deletion at any time. Upon
                deletion, your account enters a 7-day grace period during which
                you can reactivate by logging in. After the grace period, all
                personal data, content, and connected platform tokens are
                permanently removed. Billing records are anonymized and retained
                per tax law requirements.
              </p>
              <p>
                <strong style={{ color: "var(--text-primary)" }}>Price changes:</strong>{" "}
                We will notify existing subscribers at least 30 days before any
                price change takes effect. Price changes apply at the start of
                the next billing cycle after the notice period.
              </p>
            </div>
          </section>

          {/* 5 */}
          <section>
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              5. Data Ownership
            </h2>
            <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
              [DRAFT — REQUIRES LEGAL REVIEW]
            </p>
            <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <p>
                <strong style={{ color: "var(--text-primary)" }}>
                  You own your content.
                </strong>{" "}
                All content you create, upload, or generate using AdPilot
                remains your intellectual property. We do not claim ownership of
                your content, including AI-generated content created at your
                direction.
              </p>
              <p>
                You grant AdPilot a limited, non-exclusive, worldwide license to
                store, process, and transmit your content solely for the purpose
                of providing the service (e.g., publishing to connected
                platforms, generating AI suggestions based on your brand voice).
                This license terminates when you delete your content or your
                account.
              </p>
              <p>
                <strong style={{ color: "var(--text-primary)" }}>AdPilot platform IP:</strong>{" "}
                The AdPilot platform, including its design, features, code, and
                documentation, is the intellectual property of AdPilot. Your
                subscription grants you a limited right to use the platform but
                does not transfer any ownership of platform IP.
              </p>
              <p>
                You can export your data at any time using the self-service data
                export feature in your account settings. Upon account deletion,
                we remove your content and personal data within 7 days (grace
                period) plus 30 days for backup purging.
              </p>
            </div>
          </section>

          {/* 6 */}
          <section>
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              6. Platform Compliance
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              You agree to comply with the terms of service of all connected
              social media platforms. AdPilot is not responsible for account
              suspensions, content removal, or other actions taken by third-party
              platforms as a result of content you publish through AdPilot.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              7. AI-Generated Content
            </h2>
            <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
              [DRAFT — REQUIRES LEGAL REVIEW]
            </p>
            <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <p>
                AdPilot uses AI (powered by Anthropic&apos;s Claude) to assist with
                content creation. AI-generated content is provided as
                suggestions only. You are responsible for reviewing, editing,
                and approving all content before publishing.
              </p>
              <p>
                <strong style={{ color: "var(--text-primary)" }}>Disclaimer:</strong>{" "}
                AdPilot does not guarantee that AI-generated content is accurate,
                factually correct, original, or suitable for any specific
                purpose. AI-generated content may contain errors, biases, or
                inaccuracies. You assume full responsibility for all content
                published through the platform, including any consequences of
                publishing AI-generated content that may violate platform Terms
                of Service, applicable laws, or third-party rights.
              </p>
              <p>
                <strong style={{ color: "var(--text-primary)" }}>AI content labeling:</strong>{" "}
                Some jurisdictions and social media platforms require disclosure
                when content is AI-generated. AdPilot provides an option to
                label posts as AI-generated. It is your responsibility to comply
                with applicable disclosure requirements in your jurisdiction.
              </p>
              <p>
                <strong style={{ color: "var(--text-primary)" }}>Data usage:</strong>{" "}
                Content you submit for AI processing (prompts, brand voice
                settings, post content) is sent to Anthropic for processing.
                AdPilot does not use your content to train AI models. Refer to
                Anthropic&apos;s privacy policy for their data handling practices.
              </p>
            </div>
          </section>

          {/* 8 */}
          <section>
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              8. Uptime and Availability
            </h2>
            <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
              [DRAFT — REQUIRES LEGAL REVIEW]
            </p>
            <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <p>
                We target 99.9% uptime for the AdPilot platform, measured
                monthly. Scheduled maintenance windows will be communicated at
                least 48 hours in advance via email and our{" "}
                <Link href="/status" style={{ color: "var(--accent-blue)" }}>
                  status page
                </Link>
                .
              </p>
              <p>
                <strong style={{ color: "var(--text-primary)" }}>Service credits:</strong>{" "}
                If monthly uptime falls below 99.9% (excluding scheduled
                maintenance and third-party outages), Pro and Agency plan
                subscribers may request a service credit for the affected
                period. Credits are applied to future billing cycles and do not
                exceed 30% of your monthly subscription fee.
              </p>
              <p>
                We are not liable for downtime caused by third-party platform
                outages (e.g., Facebook API downtime), force majeure events, or
                circumstances beyond our reasonable control.
              </p>
            </div>
          </section>

          {/* 9 */}
          <section>
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              9. Data Usage
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              We process your data as described in our{" "}
              <Link href="/privacy" style={{ color: "var(--accent-blue)" }}>
                Privacy Policy
              </Link>
              . By connecting social media accounts, you authorize AdPilot to
              access platform APIs on your behalf using OAuth 2.0 with PKCE.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              10. Limitation of Liability
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              AdPilot is provided "as is" without warranties of any kind, either
              express or implied. We are not liable for any indirect, incidental,
              special, consequential, or punitive damages arising from the use
              of our platform, including but not limited to failed post
              publications, data loss, or revenue loss. Our total liability is
              limited to the amount you paid us in the 12 months preceding the
              claim.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              11. Termination
            </h2>
            <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <p>
                You can cancel your account at any time. Upon cancellation, we
                will revoke all platform connections and delete your data within
                30 days.
              </p>
              <p>
                We reserve the right to suspend or terminate accounts that
                violate these terms, engage in abusive behavior, or use AdPilot
                to publish content that violates applicable law.
              </p>
            </div>
          </section>

          {/* 12 */}
          <section>
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              12. Governing Law
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              These terms are governed by the laws of New South Wales, Australia.
              Any disputes arising from these terms or your use of AdPilot will
              be resolved in the courts of New South Wales, Australia. Nothing in
              these terms limits your rights under mandatory consumer protection
              laws in your jurisdiction.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              13. Changes to These Terms
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              We may update these terms from time to time. Material changes will
              be communicated via email at least 30 days before they take effect.
              Continued use of AdPilot after changes take effect constitutes
              acceptance of the updated terms.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              14. Contact
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              For questions about these terms, contact us at{" "}
              <a
                href="mailto:support@adpilot.com.au"
                style={{ color: "var(--accent-blue)" }}
              >
                support@adpilot.com.au
              </a>
              .
            </p>
          </section>
        </div>

        <div
          className="mt-12 pt-8 text-center"
          style={{ borderTop: "1px solid var(--border-primary)" }}
        >
          <Link
            href="/privacy"
            className="text-sm font-medium mr-6"
            style={{ color: "var(--accent-blue)" }}
          >
            Privacy Policy &rarr;
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
