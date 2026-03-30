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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "AdPilot",
  description:
    "AI-powered marketing automation platform — manage campaigns across 9 social platforms from one dashboard",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://adpilot.au",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "AUD",
    lowPrice: "0",
    highPrice: "299",
    offerCount: "3",
  },
  creator: {
    "@type": "Organization",
    name: "AdPilot",
    url: "https://adpilot.au",
  },
  featureList: [
    "AI Content Generation",
    "9-Platform Publishing",
    "Smart Scheduling",
    "Campaign Analytics",
    "Team Collaboration",
    "Webhook Automation",
  ],
};

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
