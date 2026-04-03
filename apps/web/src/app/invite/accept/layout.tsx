import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accept Invitation | AdPilot",
};

export default function InviteAcceptLayout({
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
