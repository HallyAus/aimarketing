import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface CheckResult {
  status: "healthy" | "degraded" | "down";
  latencyMs: number;
  error?: string;
}

async function checkDatabase(): Promise<CheckResult> {
  const start = performance.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: "healthy",
      latencyMs: Math.round(performance.now() - start),
    };
  } catch (error) {
    return {
      status: "down",
      latencyMs: Math.round(performance.now() - start),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkRedis(): Promise<CheckResult> {
  const start = performance.now();
  try {
    const { redis } = await import("@/lib/redis");
    const pong = await (redis as unknown as { ping(): Promise<string> }).ping();
    if (pong !== "PONG") {
      return {
        status: "degraded",
        latencyMs: Math.round(performance.now() - start),
        error: `Unexpected PING response: ${pong}`,
      };
    }
    return {
      status: "healthy",
      latencyMs: Math.round(performance.now() - start),
    };
  } catch (error) {
    // Redis is optional — report degraded, not down
    return {
      status: "degraded",
      latencyMs: Math.round(performance.now() - start),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function GET() {
  const [database, redis] = await Promise.all([
    checkDatabase(),
    checkRedis(),
  ]);

  const checks: Record<string, CheckResult> = { database, redis };

  // Overall status: down if DB is down, degraded if anything is degraded
  const allStatuses = Object.values(checks).map((c) => c.status);
  const overallStatus = allStatuses.includes("down")
    ? "down"
    : allStatuses.includes("degraded")
      ? "degraded"
      : "healthy";

  const httpStatus = overallStatus === "down" ? 503 : overallStatus === "degraded" ? 200 : 200;

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
    },
    {
      status: httpStatus,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
