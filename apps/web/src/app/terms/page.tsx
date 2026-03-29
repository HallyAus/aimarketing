export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: March 29, 2026</p>

      <div className="prose prose-sm space-y-4">
        <h2 className="text-xl font-semibold mt-6">1. Acceptance of Terms</h2>
        <p>By using AdPilot, you agree to these terms. AdPilot is a marketing agency platform that helps you manage social media campaigns across multiple platforms.</p>

        <h2 className="text-xl font-semibold mt-6">2. Account Responsibility</h2>
        <p>You are responsible for maintaining the security of your account and all content published through AdPilot. You must have authorization to manage any social media accounts you connect.</p>

        <h2 className="text-xl font-semibold mt-6">3. Platform Compliance</h2>
        <p>You agree to comply with the terms of service of all connected social media platforms. AdPilot is not responsible for account suspensions resulting from content that violates platform policies.</p>

        <h2 className="text-xl font-semibold mt-6">4. Service Plans</h2>
        <p>AdPilot offers Free, Pro ($49/mo), and Agency ($149/mo) plans with varying feature limits. Plan details are available on our pricing page.</p>

        <h2 className="text-xl font-semibold mt-6">5. Data Usage</h2>
        <p>We process your data as described in our Privacy Policy. By connecting social media accounts, you authorize AdPilot to access platform APIs on your behalf.</p>

        <h2 className="text-xl font-semibold mt-6">6. Limitation of Liability</h2>
        <p>AdPilot is provided "as is" without warranties. We are not liable for any damages arising from the use of our platform, including failed post publications or data loss.</p>

        <h2 className="text-xl font-semibold mt-6">7. Termination</h2>
        <p>You can cancel your account at any time. Upon cancellation, we will revoke all platform connections and delete your data within 30 days.</p>

        <h2 className="text-xl font-semibold mt-6">8. Contact</h2>
        <p>For questions about these terms, contact us at daniel@printforge.com.au</p>
      </div>
    </main>
  );
}
