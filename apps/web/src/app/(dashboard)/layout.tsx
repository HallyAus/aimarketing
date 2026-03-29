import Link from "next/link";

export const dynamic = "force-dynamic";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: "grid" },
  { href: "/campaigns", label: "Campaigns", icon: "megaphone" },
  { href: "/analytics", label: "Analytics", icon: "chart" },
  { href: "/calendar", label: "Calendar", icon: "calendar" },
  { href: "/ai", label: "AI Studio", icon: "sparkle" },
  { href: "/templates", label: "Templates", icon: "copy" },
];

const SETTINGS_ITEMS = [
  { href: "/settings/connections", label: "Connections" },
  { href: "/settings/team", label: "Team" },
  { href: "/settings/billing", label: "Billing" },
];

function NavIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    grid: "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z",
    megaphone: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
    chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    sparkle: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
    copy: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",
  };
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={icons[type] ?? icons.grid} />
    </svg>
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Sidebar */}
      <aside
        className="hidden md:flex w-56 flex-col fixed inset-y-0 left-0 z-30"
        style={{ background: "var(--bg-secondary)", borderRight: "1px solid var(--border-secondary)" }}
      >
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white" style={{ background: "var(--accent-blue)" }}>
            AP
          </div>
          <span className="text-sm font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>AdPilot</span>
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-3 py-2" role="navigation" aria-label="Main navigation">
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium rounded-lg transition-colors"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--bg-hover)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                <NavIcon type={item.icon} />
                {item.label}
              </Link>
            ))}
          </div>

          {/* Settings section */}
          <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--border-secondary)" }}>
            <div className="section-label px-2.5 mb-2">Settings</div>
            <div className="space-y-0.5">
              {SETTINGS_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-2.5 py-1.5 text-[13px] rounded-lg transition-colors"
                  style={{ color: "var(--text-tertiary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--bg-hover)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-tertiary)";
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="px-5 py-4" style={{ borderTop: "1px solid var(--border-secondary)" }}>
          <div className="text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>AdPilot v1.0</div>
        </div>
      </aside>

      {/* Mobile header */}
      <header
        className="md:hidden fixed top-0 inset-x-0 z-30 px-4 py-3 flex items-center justify-between"
        style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-secondary)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black text-white" style={{ background: "var(--accent-blue)" }}>
            AP
          </div>
          <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>AdPilot</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 md:ml-56 min-h-screen">
        <div className="pt-14 md:pt-0 px-4 md:px-8 py-6 md:py-8 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
