import { NextResponse } from "next/server";
import { prisma } from "@adpilot/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", service: "postgresql" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { status: "error", service: "postgresql", error: msg, hasDbUrl: !!process.env.DATABASE_URL },
      { status: 503 }
    );
  }
}
