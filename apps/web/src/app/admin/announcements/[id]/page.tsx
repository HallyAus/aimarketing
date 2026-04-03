import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { AnnouncementForm } from "../new/announcement-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Announcement | Admin" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditAnnouncementPage({ params }: Props) {
  const { id } = await params;

  const announcement = await prisma.announcement.findUnique({
    where: { id },
  });

  if (!announcement) notFound();

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 24 }}>
        Edit Announcement
      </h1>
      <AnnouncementForm
        announcement={{
          id: announcement.id,
          title: announcement.title,
          body: announcement.body,
          type: announcement.type,
          isActive: announcement.isActive,
          showFrom: announcement.showFrom
            ? announcement.showFrom.toISOString().slice(0, 16)
            : "",
          showUntil: announcement.showUntil
            ? announcement.showUntil.toISOString().slice(0, 16)
            : "",
          targetTiers: announcement.targetTiers,
        }}
      />
    </div>
  );
}
