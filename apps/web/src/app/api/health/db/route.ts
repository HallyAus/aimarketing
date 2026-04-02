import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", service: "postgresql" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { status: "error", service: "postgresql", error: msg, hasDbUrl: !!process.env.DATABASE_URL, dbUrlPrefix: (process.env.DATABASE_URL || "").substring(0, 30) },
      { status: 503 }
    );
  }
}
