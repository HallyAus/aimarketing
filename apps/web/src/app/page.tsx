import Link from "next/link";

export default function Home() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center p-24"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="text-center max-w-xl">
        <div className="section-label mb-4">Marketing Intelligence Platform</div>
        <h1
          className="text-5xl font-bold mb-4 tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          AdPilot
        </h1>
        <p
          className="text-lg mb-10"
          style={{ color: "var(--text-secondary)" }}
        >
          Automated marketing agency platform — AI-powered campaigns, scheduling, and analytics across every channel.
        </p>
        <Link href="/dashboard" className="btn-primary text-base px-8 py-3">
          Get Started
        </Link>
      </div>
    </main>
  );
}
