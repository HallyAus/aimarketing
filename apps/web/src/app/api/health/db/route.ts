import { NextResponse } from "next/server";
import { prisma } from "@adpilot/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", service: "postgresql" });
  } catch (error) {
    return NextResponse.json(
      { status: "error", service: "postgresql", error: String(error) },
      { status: 503 }
    );
  }
}
