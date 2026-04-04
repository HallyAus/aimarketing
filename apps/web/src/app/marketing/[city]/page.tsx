import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CITIES, getCityData, getAllCitySlugs } from "./data";

interface CityPageProps {
  params: Promise<{ city: string }>;
}

export async function generateStaticParams() {
  return getAllCitySlugs().map((city) => ({ city }));
}

export async function generateMetadata({
  params,
}: CityPageProps): Promise<Metadata> {
  const { city: slug } = await params;
  const city = getCityData(slug);
  if (!city) return {};

  const canonicalUrl = `https://reachpilot.au/marketing/${slug}`;

  return {
    title: city.metaTitle,
    description: city.metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: city.metaTitle,
      description: city.metaDescription,
      url: canonicalUrl,
      siteName: "ReachPilot",
      locale: "en_AU",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: city.metaTitle,
      description: city.metaDescription,
    },
  };
}

const FEATURES = [
  {
    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    title: "AI Content Studio",
    description:
      "Generate on-brand posts, ads, and email copy in seconds with locally-tuned AI.",
  },
  {
    icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    title: "9-Platform Publishing",
    description:
      "Publish to Instagram, Facebook, LinkedIn, X, TikTok, YouTube, Google, Pinterest, and Threads.",
  },
  {
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    title: "Smart Scheduling",
    description:
      "AI picks the best time to post for your audience's timezone and engagement patterns.",
  },
  {
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    title: "Campaign Analytics",
    description:
      "Track performance across every platform in one unified dashboard with AI insights.",
  },
];

const PLATFORMS = [
  "Instagram",
  "Facebook",
  "LinkedIn",
  "X (Twitter)",
  "TikTok",
  "YouTube",
  "Google Business",
  "Pinterest",
  "Threads",
];

const PRICING_TIERS = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    feature: "3 platforms, 30 posts/month",
    highlight: false,
  },
  {
    name: "Growth",
    price: "$49",
    period: "/mo",
    feature: "9 platforms, unlimited posts, AI content",
    highlight: true,
  },
  {
    name: "Agency",
    price: "$149",
    period: "/mo",
    feature: "Unlimited clients, white-label, priority support",
    highlight: false,
  },
];

function getLocalReasons(cityName: string, state: string, slug: string) {
  const reasons: Record<string, { title: string; text: string }[]> = {
    sydney: [
      {
        title: "Compete in Australia's biggest market",
        text: "With 200,000+ businesses fighting for attention from the CBD to Bondi, automation is the only way to maintain consistent presence across every platform.",
      },
      {
        title: "Reach Sydney's diverse demographics",
        text: "From Parramatta's multicultural market to the Eastern Suburbs' affluent consumers, AI-powered targeting ensures your content resonates with the right audience.",
      },
      {
        title: "Keep up with the Surry Hills pace",
        text: "Sydney's creative and startup scene moves fast. Smart scheduling and AI content generation mean you never miss a trend or a conversation.",
      },
    ],
    melbourne: [
      {
        title: "Match Melbourne's creative standard",
        text: "Melbourne audiences expect authentic, well-crafted content. AI content tools help you maintain that creative bar across every platform without burning out.",
      },
      {
        title: "Reach every pocket of Melbourne",
        text: "From the hipster cafes of Brunswick to the corporate towers of Collins Street, multi-platform publishing ensures you show up where your audience actually is.",
      },
      {
        title: "Stay ahead of Melbourne's fast-moving scene",
        text: "The city's food, arts, and nightlife scenes change weekly. Smart scheduling and trend-aware AI keep your content relevant and timely.",
      },
    ],
    brisbane: [
      {
        title: "Capture the 2032 growth wave",
        text: "With billions in Olympic infrastructure investment, Brisbane businesses that build their marketing engine now will reap the rewards for the next decade.",
      },
      {
        title: "Reach South East Queensland's sprawl",
        text: "Brisbane's metro area extends from Caboolture to the Gold Coast. Multi-platform automation ensures your message reaches this vast, connected region.",
      },
      {
        title: "Stand out in a rising market",
        text: "As Brisbane attracts more talent and investment from the southern states, competition is heating up. Automated, consistent marketing is your competitive edge.",
      },
    ],
    perth: [
      {
        title: "Bridge the isolation gap",
        text: "Perth's distance from the east coast makes digital marketing essential, not optional. Automation ensures your brand stays visible nationwide while you sleep.",
      },
      {
        title: "Reach the FIFO workforce",
        text: "With thousands of workers rotating between Perth and remote mine sites, social media is the primary way to reach this high-income demographic.",
      },
      {
        title: "Tap into Perth's startup energy",
        text: "The city's growing tech scene around Spacecubed and Flux needs marketing that moves as fast as their product cycles.",
      },
    ],
    adelaide: [
      {
        title: "Leverage the festival economy",
        text: "Adelaide's famous festivals — Fringe, WOMAD, and more — create seasonal surges that smart scheduling and content automation can fully capitalise on.",
      },
      {
        title: "Reach the Barossa and beyond",
        text: "From CBD professionals to Barossa Valley wine tourists, multi-platform publishing helps you reach Adelaide's diverse market segments.",
      },
      {
        title: "Compete with east coast agencies",
        text: "Adelaide businesses no longer need to hire expensive Sydney or Melbourne agencies. AI marketing automation delivers the same results at a fraction of the cost.",
      },
    ],
  };

  if (reasons[slug]) return reasons[slug];

  return [
    {
      title: `Reach ${cityName}'s growing market`,
      text: `${cityName}'s business community is growing fast. Marketing automation helps you maintain visibility across every platform without expanding your team.`,
    },
    {
      title: `Compete with capital city agencies`,
      text: `You don't need a big-city agency to run big-city marketing. ReachPilot gives ${cityName} businesses the same AI-powered tools used by agencies in Sydney and Melbourne.`,
    },
    {
      title: `Built for ${state} business conditions`,
      text: `From local regulations to seasonal trends, ReachPilot's AI understands the ${state} market and helps you create content that resonates with local audiences.`,
    },
  ];
}

export default async function CityPage({ params }: CityPageProps) {
  const { city: slug } = await params;
  const city = getCityData(slug);

  if (!city) notFound();

  const reasons = getLocalReasons(city.name, city.state, slug);
  const canonicalUrl = `https://reachpilot.au/marketing/${slug}`;

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: city.metaTitle,
    description: city.metaDescription,
    url: canonicalUrl,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://reachpilot.au",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Marketing",
          item: "https://reachpilot.au/marketing",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: city.name,
          item: canonicalUrl,
        },
      ],
    },
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `ReachPilot - ${city.name}`,
    description: city.description,
    url: canonicalUrl,
    address: {
      "@type": "PostalAddress",
      addressLocality: city.name,
      addressRegion: city.state,
      addressCountry: "AU",
    },
    areaServed: {
      "@type": "City",
      name: city.name,
      containedInPlace: {
        "@type": "State",
        name: city.state,
      },
    },
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ReachPilot",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "AI-powered marketing automation platform for Australian businesses.",
    offers: [
      {
        "@type": "Offer",
        price: "0",
        priceCurrency: "AUD",
        name: "Starter",
      },
      {
        "@type": "Offer",
        price: "49",
        priceCurrency: "AUD",
        name: "Growth",
      },
      {
        "@type": "Offer",
        price: "149",
        priceCurrency: "AUD",
        name: "Agency",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareSchema),
        }}
      />

      <div
        style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
        className="min-h-screen"
      >
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, var(--accent-blue-muted) 0%, transparent 60%)",
            }}
          />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
              style={{
                background: "var(--accent-blue-muted)",
                color: "var(--accent-blue)",
                border: "1px solid rgba(59, 130, 246, 0.25)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--accent-emerald)" }}
              />
              Built for {city.state} businesses
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6 max-w-4xl">
              Marketing Automation for{" "}
              <span style={{ color: "var(--accent-blue)" }}>{city.name}</span>{" "}
              Businesses
            </h1>

            <p
              className="text-lg sm:text-xl max-w-3xl mb-8"
              style={{ color: "var(--text-secondary)" }}
            >
              {city.heroSubtitle}
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center px-6 py-3 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: "var(--accent-blue)",
                  color: "white",
                }}
              >
                Start Free
                <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center px-6 py-3 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-primary)",
                }}
              >
                See Pricing
              </Link>
            </div>

            <div
              className="mt-12 grid grid-cols-2 gap-6 max-w-md"
            >
              <div>
                <div className="text-2xl font-bold" style={{ color: "var(--accent-blue)" }}>
                  {city.localStats.businesses.split(" ")[0]}
                </div>
                <div className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
                  local businesses
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: "var(--accent-emerald)" }}>
                  {city.localStats.digitalAdSpend.split(" ")[0]}
                </div>
                <div className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
                  annual digital ad spend
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Local Context Section */}
        <section
          style={{
            background: "var(--bg-secondary)",
            borderTop: "1px solid var(--border-secondary)",
            borderBottom: "1px solid var(--border-secondary)",
          }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <div className="max-w-3xl mb-12">
              <p
                className="text-base sm:text-lg leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {city.localContext}
              </p>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold mb-8">
              Why {city.name} businesses choose{" "}
              <span style={{ color: "var(--accent-blue)" }}>ReachPilot</span>
            </h2>

            <div className="grid sm:grid-cols-3 gap-6">
              {reasons.map((reason, i) => (
                <div
                  key={i}
                  className="p-6 rounded-xl"
                  style={{
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border-secondary)",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-4 text-sm font-bold"
                    style={{
                      background: "var(--accent-blue-muted)",
                      color: "var(--accent-blue)",
                    }}
                  >
                    {i + 1}
                  </div>
                  <h3 className="font-semibold mb-2">{reason.title}</h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {reason.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Preview */}
        <section>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <div className="text-center mb-12">
              <div
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: "var(--accent-blue)" }}
              >
                Platform Features
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">
                Everything {city.name} businesses need to grow
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map((feature, i) => (
                <div
                  key={i}
                  className="p-6 rounded-xl transition-all"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-secondary)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                    style={{ background: "var(--accent-blue-muted)" }}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      style={{ color: "var(--accent-blue)" }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d={feature.icon}
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Platform Grid */}
        <section
          style={{
            background: "var(--bg-secondary)",
            borderTop: "1px solid var(--border-secondary)",
            borderBottom: "1px solid var(--border-secondary)",
          }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                Connect all your {city.name} business accounts
              </h2>
              <p style={{ color: "var(--text-secondary)" }}>
                Publish to 9 platforms from one dashboard
              </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-4">
              {PLATFORMS.map((platform) => (
                <div
                  key={platform}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl text-center"
                  style={{
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border-secondary)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      background: "var(--accent-blue-muted)",
                      color: "var(--accent-blue)",
                    }}
                  >
                    {platform[0]}
                  </div>
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {platform}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing CTA */}
        <section>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                Simple, transparent pricing
              </h2>
              <p style={{ color: "var(--text-secondary)" }}>
                Start free, upgrade when you are ready
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {PRICING_TIERS.map((tier) => (
                <div
                  key={tier.name}
                  className="p-6 rounded-xl text-center relative"
                  style={{
                    background: tier.highlight
                      ? "var(--bg-tertiary)"
                      : "var(--bg-secondary)",
                    border: tier.highlight
                      ? "2px solid var(--accent-blue)"
                      : "1px solid var(--border-secondary)",
                  }}
                >
                  {tier.highlight && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold"
                      style={{
                        background: "var(--accent-blue)",
                        color: "white",
                      }}
                    >
                      Most Popular
                    </div>
                  )}
                  <div
                    className="text-sm font-medium mb-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {tier.name}
                  </div>
                  <div className="text-3xl font-bold mb-1">
                    {tier.price}
                    <span
                      className="text-sm font-normal"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {tier.period}
                    </span>
                  </div>
                  <p
                    className="text-sm mb-4"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {tier.feature}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link
                href="/signup"
                className="inline-flex items-center px-6 py-3 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: "var(--accent-blue)",
                  color: "white",
                }}
              >
                Start free in {city.name}
                <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Business Types */}
        <section
          style={{
            background: "var(--bg-secondary)",
            borderTop: "1px solid var(--border-secondary)",
            borderBottom: "1px solid var(--border-secondary)",
          }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Perfect for {city.name}&apos;s{" "}
              <span style={{ color: "var(--accent-blue)" }}>
                {(city.businessTypes[0] ?? "local").toLowerCase()}
              </span>{" "}
              businesses
            </h2>
            <p
              className="mb-8"
              style={{ color: "var(--text-secondary)" }}
            >
              And many more industries across {city.name}
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {city.businessTypes.map((type) => (
                <div
                  key={type}
                  className="p-4 rounded-xl text-center"
                  style={{
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border-secondary)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{
                      background: "var(--accent-emerald-muted)",
                    }}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      style={{ color: "var(--accent-emerald)" }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Local SEO Section */}
        <section>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                Serving {city.name}, {city.state} and surrounding areas
              </h2>
              <p
                className="mb-6"
                style={{ color: "var(--text-secondary)" }}
              >
                ReachPilot is built for Australian businesses by Australians. Your
                data stays onshore, your content is optimised for local audiences,
                and our support team understands your market.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: "var(--accent-emerald-muted)",
                    color: "var(--accent-emerald)",
                  }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Australian-owned and operated
                </span>
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: "var(--accent-emerald-muted)",
                    color: "var(--accent-emerald)",
                  }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Data hosted in Australia
                </span>
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: "var(--accent-emerald-muted)",
                    color: "var(--accent-emerald)",
                  }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  AEST/AWST support hours
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section
          className="relative overflow-hidden"
          style={{
            background: "var(--bg-secondary)",
            borderTop: "1px solid var(--border-secondary)",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 100%, var(--accent-blue-muted) 0%, transparent 60%)",
            }}
          />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
              Ready to grow your {city.name} business?
            </h2>
            <p
              className="text-lg mb-8 max-w-2xl mx-auto"
              style={{ color: "var(--text-secondary)" }}
            >
              Join thousands of businesses using ReachPilot to automate
              their marketing across 9 platforms. Start with our free plan — no
              credit card required.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center px-8 py-4 rounded-lg text-base font-semibold transition-all"
              style={{
                background: "var(--accent-blue)",
                color: "white",
              }}
            >
              Start Free Today
              <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <p
              className="text-sm mt-4"
              style={{ color: "var(--text-tertiary)" }}
            >
              Free forever on Starter plan. No credit card needed.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
