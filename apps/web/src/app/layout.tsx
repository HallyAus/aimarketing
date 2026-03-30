import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

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
    default: "AdPilot | AI-Powered Marketing Automation",
    template: "%s | AdPilot",
  },
  description: "Automate your marketing campaigns across every social platform. AI-powered scheduling, analytics, and campaign management from one dashboard.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://adpilot.app"),
  alternates: { canonical: "./" },
  openGraph: {
    title: "AdPilot | AI-Powered Marketing Automation",
    description: "Automate your marketing campaigns across every social platform.",
    siteName: "AdPilot",
    type: "website",
    images: [{ url: "/icon-1024.png", width: 1024, height: 1024 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AdPilot | AI-Powered Marketing Automation",
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
