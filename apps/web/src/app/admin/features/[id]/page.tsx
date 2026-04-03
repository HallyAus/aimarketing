import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { FeatureFlagForm } from "./feature-flag-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Feature Flag | Admin" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FeatureFlagEditPage({ params }: Props) {
  const { id } = await params;

  if (id === "new") {
    return (
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 24 }}>
          Create Feature Flag
        </h1>
        <FeatureFlagForm flag={null} />
      </div>
    );
  }

  const flag = await prisma.featureFlag.findUnique({
    where: { id },
  });

  if (!flag) notFound();

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 24 }}>
        Edit Feature Flag
      </h1>
      <FeatureFlagForm
        flag={{
          id: flag.id,
          key: flag.key,
          name: flag.name,
          description: flag.description || "",
          enabled: flag.enabled,
          enabledForTiers: flag.enabledForTiers,
          enabledForOrgs: flag.enabledForOrgs,
        }}
      />
    </div>
  );
}
