import Link from "next/link";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main
        id="main-content"
        className="flex flex-col items-center justify-center text-center px-4"
        style={{ background: "var(--bg-primary)", minHeight: "80vh", paddingTop: "6rem" }}
      >
        <div
          className="text-8xl font-extrabold mb-4"
          style={{
            background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </div>
        <h1
          className="text-2xl font-bold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Page not found
        </h1>
        <p
          className="text-base mb-8 max-w-md"
          style={{ color: "var(--text-secondary)" }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-4">
          <Link href="/" className="btn-primary">
            Back to Home
          </Link>
          <Link href="/contact" className="btn-ghost">
            Contact Support
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
