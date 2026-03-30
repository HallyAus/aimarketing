import Link from "next/link";
import { getCityData } from "./data";

interface CityLayoutProps {
  children: React.ReactNode;
  params: Promise<{ city: string }>;
}

export default async function CityLayout({
  children,
  params,
}: CityLayoutProps) {
  const { city: slug } = await params;
  const city = getCityData(slug);

  return (
    <>
      {/* Breadcrumb Navigation */}
      <nav
        className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-0"
        style={{ background: "var(--bg-primary)" }}
        aria-label="Breadcrumb"
      >
        <ol className="flex items-center gap-1.5 text-xs">
          <li>
            <Link
              href="/"
              className="transition-colors"
              style={{ color: "var(--text-tertiary)" }}
            >
              Home
            </Link>
          </li>
          <li style={{ color: "var(--text-tertiary)" }} aria-hidden="true">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li>
            <Link
              href="/marketing"
              className="transition-colors"
              style={{ color: "var(--text-tertiary)" }}
            >
              Marketing
            </Link>
          </li>
          {city && (
            <>
              <li style={{ color: "var(--text-tertiary)" }} aria-hidden="true">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </li>
              <li>
                <span style={{ color: "var(--text-secondary)" }}>
                  {city.name}
                </span>
              </li>
            </>
          )}
        </ol>
      </nav>
      {children}
    </>
  );
}
