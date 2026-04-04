import Link from "next/link";
import { EmptyState } from "@/components/empty-state";

function PostIcon() {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

export function NoPosts() {
  return (
    <EmptyState
      icon={<PostIcon />}
      title="No posts yet"
      description="Create your first post with AI. ReachPilot can generate, schedule, and publish content for you automatically."
      action={
        <div className="flex items-center gap-3">
          <Link href="/campaigns/new" className="btn-primary text-sm">
            Create Post
          </Link>
          <Link href="/ai/bulk-generate" className="btn-secondary text-sm">
            Let AI Write One
          </Link>
        </div>
      }
    />
  );
}
