import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Email | ReachPilot",
};

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
      }}
    >
      {children}
    </div>
  );
}
