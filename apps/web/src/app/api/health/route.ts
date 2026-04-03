import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface CheckResult {
  status: "healthy" | "degraded" | "down";
  latencyMs: number;
  error?: string;
}

export async function GET() {
  const checks: Record<string, CheckResult> = {};

  // Database check
  const dbStart = performance.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: "healthy",
      latencyMs: Math.round(performance.now() - dbStart),
    };
  } catch (error) {
    checks.database = {
      status: "down",
      latencyMs: Math.round(performance.now() - dbStart),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Redis check
  const redisStart = performance.now();
  try {
    const { redis } = await import("@/lib/redis");
    await (redis as unknown as { ping(): Promise<string> }).ping();
    checks.redis = {
      status: "healthy",
      latencyMs: Math.round(performance.now() - redisStart),
    };
  } catch (error) {
    checks.redis = {
      status: "degraded",
      latencyMs: Math.round(performance.now() - redisStart),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Overall status
  const allStatuses = Object.values(checks).map((c) => c.status);
  const overallStatus = allStatuses.includes("down")
    ? "down"
    : allStatuses.includes("degraded")
      ? "degraded"
      : "healthy";

  const httpStatus = overallStatus === "down" ? 503 : overallStatus === "degraded" ? 503 : 200;

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
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
