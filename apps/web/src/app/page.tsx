import { Navbar } from "@/components/marketing/navbar";
import { HeroSection } from "@/components/marketing/hero-section";
import { StatsBar } from "@/components/marketing/stats-bar";
import { FeaturesGrid } from "@/components/marketing/features-grid";
import { PlatformShowcase } from "@/components/marketing/platform-showcase";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { PricingSection } from "@/components/marketing/pricing-section";
import { TestimonialsSection } from "@/components/marketing/testimonials-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { CtaSection } from "@/components/marketing/cta-section";
import { Footer } from "@/components/marketing/footer";
import "@/styles/marketing.css";

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ReachPilot",
    description:
      "AI-powered marketing automation platform — manage campaigns across 9 social platforms from one dashboard. Auto-detect timezones, collaborate across teams, and publish everywhere.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://reachpilot.app",
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "USD",
        description: "3 platforms, 30 posts/month, basic analytics",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "49",
        priceCurrency: "USD",
        priceSpecification: { "@type": "UnitPriceSpecification", billingDuration: "P1M" },
        description: "All 9 platforms, unlimited posts, AI Content Studio",
      },
      {
        "@type": "Offer",
        name: "Agency",
        price: "299",
        priceCurrency: "USD",
        priceSpecification: { "@type": "UnitPriceSpecification", billingDuration: "P1M" },
        description: "Unlimited users, white-label, full API access, SSO",
      },
    ],
    creator: {
      "@type": "Organization",
      name: "ReachPilot",
      url: "https://reachpilot.app",
      foundingDate: "2026",
      founder: { "@type": "Person", name: "Daniel Hall" },
    },
    featureList: [
      "AI Content Generation",
      "9-Platform Publishing",
      "Smart Timezone Scheduling",
      "Campaign Analytics",
      "Team Collaboration",
      "Webhook Automation",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What platforms does ReachPilot support?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "ReachPilot supports 9 major platforms: Facebook, Instagram, TikTok, LinkedIn, Twitter/X, YouTube, Google Ads, Pinterest, and Snapchat.",
        },
      },
      {
        "@type": "Question",
        name: "How does ReachPilot handle timezones?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "ReachPilot auto-detects your timezone on signup — no setup needed. All scheduled posts display in your local time. Teams across different timezones each see times in their own timezone automatically.",
        },
      },
      {
        "@type": "Question",
        name: "Can I try ReachPilot for free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! The Free plan includes 1 user, 3 platforms, and 30 posts per month — no credit card required.",
        },
      },
    ],
  },
];

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main>
        <HeroSection />
        <StatsBar />
        <div className="section-divider mx-auto max-w-5xl" />
        <FeaturesGrid />
        <PlatformShowcase />
        <HowItWorks />
        <PricingSection />
        <TestimonialsSection />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
