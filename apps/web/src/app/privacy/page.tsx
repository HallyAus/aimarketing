import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how AdPilot collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto p-8" style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <h1 className="text-3xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Privacy Policy</h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>Last updated: March 29, 2026</p>

      <div className="prose prose-sm prose-invert space-y-4">
        <h2 className="text-xl font-semibold mt-6" style={{ color: "var(--text-primary)" }}>1. Information We Collect</h2>
        <p style={{ color: "var(--text-secondary)" }}>AdPilot collects information you provide when creating an account, connecting social media platforms, and using our services. This includes your email address, name, and OAuth tokens for connected platforms.</p>

        <h2 className="text-xl font-semibold mt-6" style={{ color: "var(--text-primary)" }}>2. How We Use Your Information</h2>
        <p style={{ color: "var(--text-secondary)" }}>We use your information to provide our marketing agency platform services, including publishing content to social media platforms on your behalf, collecting analytics data, and managing campaigns.</p>

        <h2 className="text-xl font-semibold mt-6" style={{ color: "var(--text-primary)" }}>3. Platform Data</h2>
        <p style={{ color: "var(--text-secondary)" }}>When you connect social media accounts, we access platform APIs to publish content and retrieve engagement metrics. We only store aggregate analytics data — we do not store personal data of your audience or followers.</p>

        <h2 className="text-xl font-semibold mt-6" style={{ color: "var(--text-primary)" }}>4. Data Security</h2>
        <p style={{ color: "var(--text-secondary)" }}>All platform access tokens are encrypted at rest using AES-256-GCM encryption. We use secure HTTPS connections and follow industry best practices for data protection.</p>

        <h2 className="text-xl font-semibold mt-6" style={{ color: "var(--text-primary)" }}>5. Data Retention</h2>
        <p style={{ color: "var(--text-secondary)" }}>We retain your data for as long as your account is active. Analytics data is retained according to your plan tier. You can request deletion of your data at any time.</p>

        <h2 className="text-xl font-semibold mt-6" style={{ color: "var(--text-primary)" }}>6. Third-Party Services</h2>
        <p style={{ color: "var(--text-secondary)" }}>We integrate with social media platforms (Facebook, Instagram, TikTok, LinkedIn, Twitter/X, YouTube, Google Ads, Pinterest, Snapchat), Stripe for payments, and PostHog for feature management.</p>

        <h2 className="text-xl font-semibold mt-6" style={{ color: "var(--text-primary)" }}>7. Your Rights</h2>
        <p style={{ color: "var(--text-secondary)" }}>You have the right to access, export, correct, or delete your personal data. You can disconnect platform connections at any time through your dashboard settings.</p>

        <h2 className="text-xl font-semibold mt-6" style={{ color: "var(--text-primary)" }}>8. Contact</h2>
        <p style={{ color: "var(--text-secondary)" }}>For privacy inquiries, contact us at daniel@printforge.com.au</p>
      </div>
    </main>
  );
}
