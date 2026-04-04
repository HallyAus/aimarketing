import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Setup | ReachPilot",
};

export default function SetupLayout({
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
