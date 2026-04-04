import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import "@/styles/marketing.css";

export const metadata: Metadata = {
  title: "System Status | ReachPilot",
  description:
    "Current operational status of ReachPilot services. Uptime, incidents, and service health.",
  openGraph: {
    title: "System Status | ReachPilot",
    description: "Current operational status of ReachPilot services.",
    type: "website",
    url: "https://reachpilot.au/status",
  },
};

const services = [
  { name: "Web App", status: "Operational" },
  { name: "API", status: "Operational" },
  { name: "Publishing Engine", status: "Operational" },
  { name: "Analytics", status: "Operational" },
  { name: "Webhooks", status: "Operational" },
];

export default function StatusPage() {
  const lastUpdated = new Date().toISOString();

  return (
    <>
      <Navbar />
      <main id="main-content" style={{ background: "var(--bg-primary)" }}>
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-12">
              <p
                className="marketing-label mb-4"
                style={{ color: "var(--accent-blue)" }}
              >
                Status
              </p>
              <h1
                className="marketing-h1 mb-6"
                style={{ color: "var(--text-primary)" }}
              >
                System Status
              </h1>
            </div>

            {/* Overall status */}
            <div
              className="glass rounded-2xl p-8 text-center mb-8"
              style={{ borderColor: "var(--border-primary)" }}
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ background: "#22c55e" }}
                />
                <h2
                  className="text-2xl font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  All Systems Operational
                </h2>
              </div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                99.9% uptime over the last 90 days
              </p>
            </div>

            {/* Service list */}
            <div
              className="glass rounded-2xl overflow-hidden"
              style={{ borderColor: "var(--border-primary)" }}
            >
              {services.map((service, i) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between px-6 py-4"
                  style={{
                    borderBottom:
                      i < services.length - 1
                        ? "1px solid var(--border-primary)"
                        : "none",
                  }}
                >
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {service.name}
                  </span>
                  <span className="flex items-center gap-2 text-sm">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: "#22c55e" }}
                    />
                    <span style={{ color: "#22c55e" }}>{service.status}</span>
                  </span>
                </div>
              ))}
            </div>

            {/* Last updated */}
            <p
              className="text-center text-xs mt-6"
              style={{ color: "var(--text-secondary)" }}
            >
              Last updated: {lastUpdated}
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
