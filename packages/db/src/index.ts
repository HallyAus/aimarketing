import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";

const dbUrl = process.env.DATABASE_URL ?? "";
const useNeonAdapter = dbUrl.includes("neon.tech");

function createPrismaClient(): PrismaClient {
  if (useNeonAdapter) {
    neonConfig.fetchConnectionCache = true;
    const pool = new Pool({ connectionString: dbUrl });
    const adapter = new PrismaNeon(pool as any);
    // Neon adapter = no binary engine needed
    return new PrismaClient({ adapter } as any);
  }

  return new PrismaClient({
    datasourceUrl: dbUrl || undefined,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export * from "@prisma/client";
