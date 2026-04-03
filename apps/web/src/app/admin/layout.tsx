import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import AdminSidebar from "./components/admin-sidebar";
import { SessionProvider } from "next-auth/react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin | AdPilot",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/admin/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { systemRole: true, name: true, email: true },
  });

  if (
    !user ||
    (user.systemRole !== "ADMIN" && user.systemRole !== "SUPER_ADMIN")
  ) {
    redirect("/admin/login?error=forbidden");
  }

  // Build breadcrumbs server-side is not practical with App Router,
  // so we pass user info and let the client components handle it.
  return (
    <SessionProvider session={session}>
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "var(--bg-primary)",
        }}
      >
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header
            className="shrink-0 flex items-center gap-4 px-6 lg:px-8 py-3"
            style={{
              borderBottom: "1px solid var(--border-primary)",
              background: "var(--bg-primary)",
            }}
          >
            {/* Spacer for mobile hamburger */}
            <div className="w-8 lg:hidden" />

            {/* Breadcrumbs placeholder */}
            <nav
              className="flex-1 text-sm"
              style={{ color: "var(--text-tertiary)" }}
              aria-label="Breadcrumbs"
            >
              <span style={{ color: "var(--text-secondary)" }}>Admin</span>
            </nav>

            {/* Global search */}
            <div className="relative hidden md:block" style={{ width: 280 }}>
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "var(--text-tertiary)" }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search users, orgs, content..."
                className="w-full rounded-lg pl-9 pr-4 py-2 text-sm"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-primary)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </header>

          {/* Main content */}
          <main
            className="flex-1 p-6 lg:p-8 overflow-x-auto"
            style={{ background: "var(--bg-primary)" }}
          >
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
