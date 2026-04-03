import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { SignupForm } from "./signup-form";
import "@/styles/marketing.css";

export const metadata: Metadata = {
  title: "Join the Waitlist | AdPilot",
  description:
    "Get early access to AdPilot — AI-powered marketing automation for businesses everywhere. Free to start.",
  openGraph: {
    title: "Join the Waitlist | AdPilot",
    description:
      "Get early access to AdPilot — AI-powered marketing automation for businesses everywhere.",
    type: "website",
    url: "https://adpilot.au/signup",
  },
};

const perks = [
  "AI-powered content creation with Claude",
  "Publish to 9 platforms from one dashboard",
  "Timezone-aware scheduling for global audiences",
  "Free tier — no credit card required",
];

export default function SignupPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" style={{ background: "var(--bg-primary)" }}>
        <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="hero-glow" style={{ top: "-200px", left: "50%" }} />
          <div
            className="hero-glow-purple"
            style={{ top: "-100px", right: "20%" }}
          />
          <div className="mx-auto max-w-xl">
            <div className="text-center mb-10">
              <p
                className="marketing-label mb-4"
                style={{ color: "var(--accent-blue)" }}
              >
                Early Access
              </p>
              <h1
                className="marketing-h1 mb-6"
                style={{ color: "var(--text-primary)" }}
              >
                Join the{" "}
                <span className="gradient-text">Waitlist</span>
              </h1>
              <p
                className="marketing-body"
                style={{ color: "var(--text-secondary)" }}
              >
                Be among the first to experience AI-powered marketing
                automation. We're onboarding users in batches.
              </p>
            </div>

            <SignupForm />

            {/* Perks */}
            <div className="mt-10">
              <ul className="space-y-3">
                {perks.map((perk) => (
                  <li
                    key={perk}
                    className="flex items-center gap-3 text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: "rgba(59, 130, 246, 0.15)",
                        color: "var(--accent-blue)",
                        fontSize: "0.7rem",
                      }}
                    >
                      &#10003;
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>
            </div>

            <p
              className="text-center text-xs mt-8"
              style={{ color: "var(--text-secondary)" }}
            >
              By signing up, you agree to our{" "}
              <Link href="/terms" style={{ color: "var(--accent-blue)" }}>
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" style={{ color: "var(--accent-blue)" }}>
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
