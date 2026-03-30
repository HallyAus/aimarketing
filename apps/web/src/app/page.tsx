import Link from "next/link";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "AdPilot",
  "description": "AI-powered marketing automation platform",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "USD",
    "lowPrice": "0",
    "highPrice": "299"
  },
  "creator": {
    "@type": "Organization",
    "name": "AdPilot"
  }
};

export default function Home() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center p-6 md:p-12 lg:p-24"
      style={{ background: "var(--bg-primary)" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="text-center max-w-xl">
        <div className="section-label mb-4">Marketing Intelligence Platform</div>
        <h1
          className="text-3xl md:text-5xl font-bold mb-4 tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          AdPilot
        </h1>
        <p
          className="text-lg mb-10"
          style={{ color: "var(--text-secondary)" }}
        >
          Automated marketing agency platform — AI-powered campaigns, scheduling, and analytics across every channel.
        </p>
        <Link href="/dashboard" className="btn-primary text-base px-8 py-3">
          Get Started
        </Link>
      </div>
    </main>
  );
}
