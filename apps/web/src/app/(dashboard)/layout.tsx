import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-gray-50 p-4">
        <div className="font-bold text-lg mb-8">AdPilot</div>
        <nav className="space-y-1">
          <Link href="/dashboard" className="block rounded px-3 py-2 text-sm hover:bg-gray-200">
            Dashboard
          </Link>
          <Link href="/campaigns" className="block rounded px-3 py-2 text-sm hover:bg-gray-200">
            Campaigns
          </Link>
          <Link href="/analytics" className="block rounded px-3 py-2 text-sm hover:bg-gray-200">
            Analytics
          </Link>
          <Link href="/calendar" className="block rounded px-3 py-2 text-sm hover:bg-gray-200">
            Calendar
          </Link>
          <Link href="/templates" className="block rounded px-3 py-2 text-sm hover:bg-gray-200">
            Templates
          </Link>
          <div className="pt-4 mt-4 border-t">
            <div className="text-xs font-medium text-gray-400 uppercase mb-2">Settings</div>
            <Link href="/settings/connections" className="block rounded px-3 py-2 text-sm hover:bg-gray-200">
              Connections
            </Link>
            <Link href="/settings/team" className="block rounded px-3 py-2 text-sm hover:bg-gray-200">
              Team
            </Link>
            <Link href="/settings/billing" className="block rounded px-3 py-2 text-sm hover:bg-gray-200">
              Billing
            </Link>
          </div>
        </nav>
        <div className="absolute bottom-4 text-xs text-gray-400">
          AdPilot
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
