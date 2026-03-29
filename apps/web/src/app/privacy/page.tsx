import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how AdPilot collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: March 29, 2026</p>

      <div className="prose prose-sm space-y-4">
        <h2 className="text-xl font-semibold mt-6">1. Information We Collect</h2>
        <p>AdPilot collects information you provide when creating an account, connecting social media platforms, and using our services. This includes your email address, name, and OAuth tokens for connected platforms.</p>

        <h2 className="text-xl font-semibold mt-6">2. How We Use Your Information</h2>
        <p>We use your information to provide our marketing agency platform services, including publishing content to social media platforms on your behalf, collecting analytics data, and managing campaigns.</p>

        <h2 className="text-xl font-semibold mt-6">3. Platform Data</h2>
        <p>When you connect social media accounts, we access platform APIs to publish content and retrieve engagement metrics. We only store aggregate analytics data — we do not store personal data of your audience or followers.</p>

        <h2 className="text-xl font-semibold mt-6">4. Data Security</h2>
        <p>All platform access tokens are encrypted at rest using AES-256-GCM encryption. We use secure HTTPS connections and follow industry best practices for data protection.</p>

        <h2 className="text-xl font-semibold mt-6">5. Data Retention</h2>
        <p>We retain your data for as long as your account is active. Analytics data is retained according to your plan tier. You can request deletion of your data at any time.</p>

        <h2 className="text-xl font-semibold mt-6">6. Third-Party Services</h2>
        <p>We integrate with social media platforms (Facebook, Instagram, TikTok, LinkedIn, Twitter/X, YouTube, Google Ads, Pinterest, Snapchat), Stripe for payments, and PostHog for feature management.</p>

        <h2 className="text-xl font-semibold mt-6">7. Your Rights</h2>
        <p>You have the right to access, export, correct, or delete your personal data. You can disconnect platform connections at any time through your dashboard settings.</p>

        <h2 className="text-xl font-semibold mt-6">8. Contact</h2>
        <p>For privacy inquiries, contact us at daniel@printforge.com.au</p>
      </div>
    </main>
  );
}
