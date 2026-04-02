import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";

// GET /api/platforms/google-business — get GBP connection status
export const GET = withErrorHandler(withRole("VIEWER", async (_req) => {
  // Placeholder: In production, check for active GBP connection
  return NextResponse.json({
    connected: false,
    postTypes: ["UPDATE", "EVENT", "OFFER"],
    message: "Google Business Profile integration coming soon. Connect your GBP to publish updates, events, and offers directly.",
  });
}));

// POST /api/platforms/google-business — initiate GBP connection (placeholder)
export const POST = withErrorHandler(withRole("ADMIN", async (req) => {
  const { action, postType, content } = await req.json();

  if (action === "connect") {
    // Placeholder: Would redirect to Google OAuth
    return NextResponse.json({
      authUrl: "#",
      message: "GBP OAuth flow placeholder. In production, this would redirect to Google's OAuth consent screen.",
    });
  }

  if (action === "create-post") {
    if (!postType || !content) {
      return NextResponse.json({ error: "postType and content are required", code: "VALIDATION_ERROR", statusCode: 400 }, { status: 400 });
    }
    // Placeholder: Would create GBP post via API
    return NextResponse.json({
      success: true,
      message: `GBP ${postType} post created (placeholder). Content: ${content.substring(0, 100)}...`,
    });
  }

  return NextResponse.json({ error: "Invalid action", code: "VALIDATION_ERROR", statusCode: 400 }, { status: 400 });
}));
