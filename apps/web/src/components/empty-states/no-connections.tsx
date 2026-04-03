import Link from "next/link";
import { EmptyState } from "@/components/empty-state";

function ConnectionIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function NoConnections() {
  return (
    <EmptyState
      icon={<ConnectionIcon />}
      title="Connect your social accounts to get started"
      description="Link your Facebook, Instagram, LinkedIn, or other platforms so AdPilot can publish and manage your content."
      action={
        <Link href="/settings/connections" className="btn-primary text-sm">
          Connect Account
        </Link>
      }
    />
  );
}
