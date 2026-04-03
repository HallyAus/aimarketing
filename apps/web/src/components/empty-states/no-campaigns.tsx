import Link from "next/link";
import { EmptyState } from "@/components/empty-state";

function CampaignIcon() {
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
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

export function NoCampaigns() {
  return (
    <EmptyState
      icon={<CampaignIcon />}
      title="No campaigns yet"
      description="Campaigns help you organize and schedule your posts. Create one to start planning your content."
      action={
        <Link href="/campaigns/new" className="btn-primary text-sm">
          Create Campaign
        </Link>
      }
    />
  );
}
