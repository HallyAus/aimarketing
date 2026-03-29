import { NextRequest, NextResponse } from "next/server";
import { improvePostContent } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { content, platform, instruction } = body;

    if (!content || !platform) {
      return NextResponse.json(
        { error: "content and platform are required" },
        { status: 400 }
      );
    }

    const improved = await improvePostContent({ content, platform, instruction });

    return NextResponse.json({ content: improved });
  } catch (error) {
    console.error("[AI] Improve post error:", error);
    return NextResponse.json(
      { error: "Failed to improve content" },
      { status: 500 }
    );
  }
}
