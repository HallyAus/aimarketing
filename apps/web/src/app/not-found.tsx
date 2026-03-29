import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center" style={{ background: "var(--bg-primary)" }}>
      <div className="text-6xl font-bold mb-4" style={{ color: "var(--accent-blue)" }}>404</div>
      <h1 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Page not found</h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>The page you're looking for doesn't exist.</p>
      <Link href="/dashboard" className="btn-primary">Back to Dashboard</Link>
    </div>
  );
}
