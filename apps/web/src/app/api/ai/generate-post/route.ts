import { NextRequest, NextResponse } from "next/server";
import { generatePostContent } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { platform, topic, tone, style, includeHashtags, includeEmojis } = body;

    if (!platform || !topic) {
      return NextResponse.json(
        { error: "platform and topic are required" },
        { status: 400 }
      );
    }

    const content = await generatePostContent({
      platform,
      topic,
      tone,
      style,
      includeHashtags,
      includeEmojis,
    });

    return NextResponse.json({ content });
  } catch (error) {
    console.error("[AI] Generate post error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
