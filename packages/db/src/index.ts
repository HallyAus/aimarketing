import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";

// Use Neon serverless driver on Vercel (no binary engine needed)
// Falls back to standard Prisma client locally
const isVercel = !!process.env.VERCEL;

function createPrismaClient(): PrismaClient {
  if (isVercel && process.env.DATABASE_URL) {
    neonConfig.fetchConnectionCache = true;
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaNeon(pool as any);
    return new PrismaClient({ adapter } as any);
  }

  return new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
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
