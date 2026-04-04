import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Providers } from "./providers";
import { CookieConsent } from "@/components/cookie-consent";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#3b82f6",
};

export const metadata: Metadata = {
  title: {
    default: "ReachPilot | AI-Powered Marketing Automation",
    template: "%s | ReachPilot",
  },
  description: "Automate your marketing campaigns across every social platform. AI-powered scheduling, analytics, and campaign management from one dashboard.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://reachpilot.app"),
  alternates: { canonical: "./" },
  openGraph: {
    title: "ReachPilot | AI-Powered Marketing Automation",
    description: "Automate your marketing campaigns across every social platform.",
    siteName: "ReachPilot",
    type: "website",
    images: [{ url: "/icon-1024.png", width: 1024, height: 1024 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReachPilot | AI-Powered Marketing Automation",
    description: "Automate your marketing campaigns across every social platform.",
  },
  icons: {
    icon: "/icon-1024.png",
    apple: "/icon-1024.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://app.posthog.com" />
      </head>
      <body style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold"
          style={{ background: "var(--accent-blue)", color: "#fff" }}
        >
          Skip to main content
        </a>
        <Providers>{children}</Providers>
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  );
}
