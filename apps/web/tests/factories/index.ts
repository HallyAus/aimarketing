import { faker } from "@faker-js/faker";
import { prisma } from "@/lib/db";
import type {
  Plan,
  Role,
  Platform,
  PostStatus,
} from "@reachpilot/db";

// ---------------------------------------------------------------------------
// User factory
// ---------------------------------------------------------------------------
interface CreateTestUserOptions {
  email?: string;
  name?: string;
  password?: string;
  timezone?: string;
  status?: "ACTIVE" | "SUSPENDED" | "BANNED" | "PENDING_VERIFICATION" | "DEACTIVATED";
  systemRole?: "USER" | "ADMIN" | "SUPER_ADMIN";
}

export async function createTestUser(overrides: CreateTestUserOptions = {}) {
  return prisma.user.create({
    data: {
      email: overrides.email ?? faker.internet.email(),
      name: overrides.name ?? faker.person.fullName(),
      password: overrides.password ?? faker.string.alphanumeric(60), // bcrypt-length placeholder
      timezone: overrides.timezone ?? "UTC",
      status: overrides.status ?? "ACTIVE",
      systemRole: overrides.systemRole ?? "USER",
    },
  });
}

// ---------------------------------------------------------------------------
// Organization factory
// ---------------------------------------------------------------------------
interface CreateTestOrgOptions {
  name?: string;
  slug?: string;
  plan?: Plan;
  stripeCustomerId?: string;
}

export async function createTestOrg(overrides: CreateTestOrgOptions = {}) {
  return prisma.organization.create({
    data: {
      name: overrides.name ?? faker.company.name(),
      slug: overrides.slug ?? faker.helpers.slugify(faker.company.name()).toLowerCase() + "-" + faker.string.nanoid(6),
      plan: overrides.plan ?? "FREE",
      stripeCustomerId: overrides.stripeCustomerId ?? undefined,
    },
  });
}

// ---------------------------------------------------------------------------
// Membership factory
// ---------------------------------------------------------------------------
interface CreateTestMembershipOptions {
  userId: string;
  orgId: string;
  role?: Role;
}

export async function createTestMembership(options: CreateTestMembershipOptions) {
  return prisma.membership.create({
    data: {
      userId: options.userId,
      orgId: options.orgId,
      role: options.role ?? "OWNER",
    },
  });
}

// ---------------------------------------------------------------------------
// PlatformConnection factory (needed for Page)
// ---------------------------------------------------------------------------
interface CreateTestConnectionOptions {
  orgId: string;
  connectedBy: string;
  platform?: Platform;
  accessToken?: string;
  platformUserId?: string;
}

export async function createTestConnection(options: CreateTestConnectionOptions) {
  return prisma.platformConnection.create({
    data: {
      orgId: options.orgId,
      platform: options.platform ?? "FACEBOOK",
      accessToken: options.accessToken ?? faker.string.alphanumeric(128),
      platformUserId: options.platformUserId ?? faker.string.nanoid(15),
      connectedBy: options.connectedBy,
      scopes: ["pages_manage_posts", "pages_read_engagement"],
      status: "ACTIVE",
    },
  });
}

// ---------------------------------------------------------------------------
// Page factory
// ---------------------------------------------------------------------------
interface CreateTestPageOptions {
  orgId: string;
  connectionId: string;
  platform?: Platform;
  platformPageId?: string;
  name?: string;
  accessToken?: string;
}

export async function createTestPage(options: CreateTestPageOptions) {
  return prisma.page.create({
    data: {
      orgId: options.orgId,
      connectionId: options.connectionId,
      platform: options.platform ?? "FACEBOOK",
      platformPageId: options.platformPageId ?? faker.string.nanoid(15),
      name: options.name ?? faker.company.name() + " Page",
      accessToken: options.accessToken ?? faker.string.alphanumeric(128),
    },
  });
}

// ---------------------------------------------------------------------------
// Post factory
// ---------------------------------------------------------------------------
interface CreateTestPostOptions {
  orgId: string;
  pageId?: string;
  campaignId?: string;
  platform?: Platform;
  content?: string;
  status?: PostStatus;
  scheduledAt?: Date;
}

export async function createTestPost(options: CreateTestPostOptions) {
  return prisma.post.create({
    data: {
      orgId: options.orgId,
      pageId: options.pageId ?? undefined,
      campaignId: options.campaignId ?? undefined,
      platform: options.platform ?? "FACEBOOK",
      content: options.content ?? faker.lorem.paragraph(),
      status: options.status ?? "DRAFT",
      scheduledAt: options.scheduledAt ?? undefined,
      mediaUrls: [],
    },
  });
}

// ---------------------------------------------------------------------------
// Full test context: user + org + membership + connection + page
// ---------------------------------------------------------------------------
interface TestContext {
  user: Awaited<ReturnType<typeof createTestUser>>;
  org: Awaited<ReturnType<typeof createTestOrg>>;
  membership: Awaited<ReturnType<typeof createTestMembership>>;
  connection: Awaited<ReturnType<typeof createTestConnection>>;
  page: Awaited<ReturnType<typeof createTestPage>>;
}

export async function createTestContext(): Promise<TestContext> {
  const user = await createTestUser();
  const org = await createTestOrg();
  const membership = await createTestMembership({
    userId: user.id,
    orgId: org.id,
    role: "OWNER",
  });
  const connection = await createTestConnection({
    orgId: org.id,
    connectedBy: user.id,
  });
  const page = await createTestPage({
    orgId: org.id,
    connectionId: connection.id,
  });

  return { user, org, membership, connection, page };
}

// ---------------------------------------------------------------------------
// Cleanup helper
// ---------------------------------------------------------------------------
/**
 * Delete all data from the test database. Call in afterEach/afterAll.
 * Tables are truncated in dependency order.
 */
export async function cleanupTestData() {
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== "_prisma_migrations")
    .map((name) => `"public"."${name}"`)
    .join(", ");

  if (tables.length > 0) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE`);
  }
}
