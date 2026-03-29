import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

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
  openGraph: {
    title: "AdPilot | AI-Powered Marketing Automation",
    description: "Automate your marketing campaigns across every social platform.",
    siteName: "AdPilot",
    type: "website",
    images: [{ url: "/icon-1024.png", width: 1024, height: 1024 }],
  },
  twitter: {
    card: "summary",
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
    <html lang="en">
      <body style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
