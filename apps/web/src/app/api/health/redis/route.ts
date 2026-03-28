import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET() {
  try {
    const pong = await redis.ping();
    return NextResponse.json({ status: "ok", service: "redis", response: pong });
  } catch (error) {
    return NextResponse.json(
      { status: "error", service: "redis", error: String(error) },
      { status: 503 }
    );
  }
}
