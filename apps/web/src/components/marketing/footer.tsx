"use client";

import Link from "next/link";

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Integrations", href: "#platforms" },
      { label: "AI Studio", href: "#features" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "API", href: "/api" },
      { label: "Status", href: "/status" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Security", href: "/security" },
    ],
  },
];

function TwitterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
      <path d="M4 20l6.768 -6.768m2.46 -2.46L20 4" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer
      style={{
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border-secondary)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3
                className="text-sm font-semibold uppercase tracking-wider mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                {column.title}
              </h3>
              <ul className="space-y-3">
                {column.links.map((link) => {
                  const isInternal = link.href.startsWith("/");
                  const linkProps = {
                    className: "text-sm transition-colors",
                    style: { color: "var(--text-tertiary)" } as React.CSSProperties,
                    onMouseEnter: (e: React.MouseEvent<HTMLAnchorElement>) => {
                      e.currentTarget.style.color = "var(--text-primary)";
                    },
                    onMouseLeave: (e: React.MouseEvent<HTMLAnchorElement>) => {
                      e.currentTarget.style.color = "var(--text-tertiary)";
                    },
                  };
                  return (
                    <li key={link.label}>
                      {isInternal ? (
                        <Link href={link.href} {...linkProps}>
                          {link.label}
                        </Link>
                      ) : (
                        <a href={link.href} {...linkProps}>
                          {link.label}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div
          className="mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid var(--border-secondary)" }}
        >
          <div className="flex items-center gap-4">
            <span
              className="text-sm font-bold"
              style={{
                background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              AdPilot
            </span>
            <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              &copy; {new Date().getFullYear()} AdPilot. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Built in Australia badge */}
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full"
              style={{
                background: "var(--bg-tertiary)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-primary)",
              }}
            >
              <span>🇦🇺</span> Built in Australia, used worldwide
            </span>

            {/* Social icons */}
            <div className="flex items-center gap-2">
              {[
                { icon: <TwitterIcon />, href: "https://twitter.com/adpilot", label: "Twitter" },
                { icon: <LinkedInIcon />, href: "https://linkedin.com/company/adpilot", label: "LinkedIn" },
                { icon: <GitHubIcon />, href: "https://github.com/adpilot", label: "GitHub" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
                  style={{ color: "var(--text-tertiary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--text-primary)";
                    e.currentTarget.style.background = "var(--bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-tertiary)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
