import { Metadata } from "next";
import Link from "next/link";
import { CITIES, CITIES_BY_STATE, STATES } from "./[city]/data";

export const metadata: Metadata = {
  title: "Marketing Automation for Australian Businesses | AdPilot",
  description:
    "AI-powered marketing automation for businesses across Australia. Find AdPilot in your city — Sydney, Melbourne, Brisbane, Perth, Adelaide, and 25+ more locations.",
  alternates: {
    canonical: "https://adpilot.au/marketing",
  },
  openGraph: {
    title: "Marketing Automation for Australian Businesses | AdPilot",
    description:
      "AI-powered marketing automation for businesses across Australia. Find AdPilot in your city.",
    url: "https://adpilot.au/marketing",
    siteName: "AdPilot",
    locale: "en_AU",
    type: "website",
  },
};

const STATE_ORDER = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "NT", "ACT"];

export default function MarketingIndexPage() {
  return (
    <div
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
      className="min-h-screen"
    >
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, var(--accent-blue-muted) 0%, transparent 60%)",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-12 sm:pt-28 sm:pb-16">
          <div className="text-center max-w-3xl mx-auto">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
              style={{
                background: "var(--accent-emerald-muted)",
                color: "var(--accent-emerald)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--accent-emerald)" }}
              />
              Serving 30+ Australian cities
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
              AdPilot for{" "}
              <span style={{ color: "var(--accent-blue)" }}>Australian</span>{" "}
              Businesses
            </h1>

            <p
              className="text-lg sm:text-xl mb-8"
              style={{ color: "var(--text-secondary)" }}
            >
              AI-powered marketing automation tailored for every major city
              across Australia. Find your city and discover how AdPilot can grow
              your business.
            </p>
          </div>
        </div>
      </section>

      {/* Cities by State */}
      <section>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
          {STATE_ORDER.map((stateCode) => {
            const citySlugs = CITIES_BY_STATE[stateCode];
            if (!citySlugs || citySlugs.length === 0) return null;

            return (
              <div key={stateCode} className="mb-12">
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="text-xl font-bold">
                    {STATES[stateCode]}
                  </h2>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: "var(--accent-blue-muted)",
                      color: "var(--accent-blue)",
                    }}
                  >
                    {stateCode}
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {citySlugs.map((slug) => {
                    const city = CITIES[slug];
                    if (!city) return null;
                    return (
                      <Link
                        key={slug}
                        href={`/marketing/${slug}`}
                        className="group p-5 rounded-xl transition-all"
                        style={{
                          background: "var(--bg-secondary)",
                          border: "1px solid var(--border-secondary)",
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-base group-hover:underline">
                            {city.name}
                          </h3>
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                            style={{
                              background: "var(--bg-elevated)",
                              color: "var(--text-tertiary)",
                            }}
                          >
                            {city.state}
                          </span>
                        </div>
                        <p
                          className="text-sm mb-3 line-clamp-2"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {city.headline}
                        </p>
                        <div className="flex items-center justify-between">
                          <span
                            className="text-xs font-medium"
                            style={{ color: "var(--accent-emerald)" }}
                          >
                            {city.localStats.businesses}
                          </span>
                          <svg
                            className="w-4 h-4 transition-transform group-hover:translate-x-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section
        style={{
          background: "var(--bg-secondary)",
          borderTop: "1px solid var(--border-secondary)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Don&apos;t see your city?
          </h2>
          <p
            className="mb-6"
            style={{ color: "var(--text-secondary)" }}
          >
            AdPilot works for every Australian business, no matter where you are.
            Start your free trial today.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center px-6 py-3 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: "var(--accent-blue)",
              color: "white",
            }}
          >
            Start Free Today
            <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
