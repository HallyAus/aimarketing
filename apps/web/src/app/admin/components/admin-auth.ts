import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Verify the current request is from an admin or super_admin user.
 * Returns the user record on success, or a NextResponse error.
 */
export async function requireAdmin(): Promise<
  | { user: { id: string; systemRole: string }; error?: never }
  | { user?: never; error: NextResponse }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      ),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, systemRole: true },
  });

  if (!user || (user.systemRole !== "ADMIN" && user.systemRole !== "SUPER_ADMIN")) {
    return {
      error: NextResponse.json(
        { error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 },
      ),
    };
  }

  return { user };
}
