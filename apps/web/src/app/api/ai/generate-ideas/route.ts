import { NextRequest, NextResponse } from "next/server";
import { generateCampaignIdeas } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { industry, objective, platforms, count } = body;

    if (!industry || !objective) {
      return NextResponse.json(
        { error: "industry and objective are required" },
        { status: 400 }
      );
    }

    const ideas = await generateCampaignIdeas({
      industry,
      objective,
      platforms: platforms ?? ["FACEBOOK", "INSTAGRAM"],
      count,
    });

    return NextResponse.json({ ideas });
  } catch (error) {
    console.error("[AI] Generate ideas error:", error);
    return NextResponse.json(
      { error: "Failed to generate ideas" },
      { status: 500 }
    );
  }
}
