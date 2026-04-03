import { AnnouncementForm } from "./announcement-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Create Announcement | Admin" };

export default function NewAnnouncementPage() {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 24 }}>
        Create Announcement
      </h1>
      <AnnouncementForm announcement={null} />
    </div>
  );
}
