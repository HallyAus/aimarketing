import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "daniel@agenticconsciousness.com.au";
const ADMIN_NAME = "Daniel";
const ADMIN_ORG_NAME = "ReachPilot Admin";
const ADMIN_ORG_SLUG = "reachpilot-admin";

const FEATURE_FLAGS = [
  {
    key: "ai_content_studio",
    name: "AI Content Studio",
    description: "AI-powered content generation and editing tools",
    enabledForTiers: ["PRO", "AGENCY"],
  },
  {
    key: "smart_scheduling",
    name: "Smart Scheduling",
    description: "AI-optimized post scheduling based on audience activity",
    enabledForTiers: ["PRO", "AGENCY"],
  },
  {
    key: "webhook_automation",
    name: "Webhook Automation",
    description: "Custom webhook rules for automated workflows",
    enabledForTiers: ["PRO", "AGENCY"],
  },
  {
    key: "advanced_analytics",
    name: "Advanced Analytics",
    description: "Deep analytics with custom reports and insights",
    enabledForTiers: ["PRO", "AGENCY"],
  },
  {
    key: "white_label_reports",
    name: "White Label Reports",
    description: "Branded performance reports for client delivery",
    enabledForTiers: ["AGENCY"],
  },
  {
    key: "api_access",
    name: "API Access",
    description: "REST API access with key management",
    enabledForTiers: ["PRO", "AGENCY"],
  },
  {
    key: "team_collaboration",
    name: "Team Collaboration",
    description: "Multi-user collaboration with approval workflows",
    enabledForTiers: ["PRO", "AGENCY"],
  },
  {
    key: "sso",
    name: "Single Sign-On (SSO)",
    description: "SAML/OIDC single sign-on for organizations",
    enabledForTiers: ["AGENCY"],
  },
  {
    key: "audit_trails",
    name: "Audit Trails",
    description: "Full audit log of all actions within the organization",
    enabledForTiers: ["AGENCY"],
  },
] as const;

async function main() {
  console.log("Seeding admin user and feature flags...");

  // ── Create or update SUPER_ADMIN user ──────────────────────────────
  const password = process.env.ADMIN_SEED_PASSWORD ?? "admin123";
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      systemRole: "SUPER_ADMIN",
      // Only update password if user had none (don't overwrite an existing one)
    },
    create: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      password: hashedPassword,
      emailVerified: new Date(),
      systemRole: "SUPER_ADMIN",
      onboardingComplete: true,
    },
  });

  // If the user existed but had no password, set it
  const existingUser = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { password: true },
  });
  if (!existingUser?.password) {
    await prisma.user.update({
      where: { email: ADMIN_EMAIL },
      data: { password: hashedPassword },
    });
  }

  console.log(`  User: ${user.email} (${user.id}) — SUPER_ADMIN`);

  // ── Create or update admin organization ────────────────────────────
  const org = await prisma.organization.upsert({
    where: { slug: ADMIN_ORG_SLUG },
    update: {},
    create: {
      name: ADMIN_ORG_NAME,
      slug: ADMIN_ORG_SLUG,
      plan: "AGENCY",
      billingEmail: ADMIN_EMAIL,
    },
  });

  console.log(`  Org: ${org.name} (${org.id})`);

  // ── Create membership with OWNER role ──────────────────────────────
  await prisma.membership.upsert({
    where: { userId_orgId: { userId: user.id, orgId: org.id } },
    update: { role: "OWNER" },
    create: {
      userId: user.id,
      orgId: org.id,
      role: "OWNER",
      acceptedAt: new Date(),
    },
  });

  console.log(`  Membership: OWNER`);

  // ── Seed feature flags ─────────────────────────────────────────────
  for (const flag of FEATURE_FLAGS) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {
        name: flag.name,
        description: flag.description,
        enabledForTiers: [...flag.enabledForTiers],
      },
      create: {
        key: flag.key,
        name: flag.name,
        description: flag.description,
        enabled: true,
        enabledForTiers: [...flag.enabledForTiers],
        enabledForOrgs: [],
      },
    });
    console.log(`  Flag: ${flag.key} — [${flag.enabledForTiers.join(", ")}]`);
  }

  console.log("Admin seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
