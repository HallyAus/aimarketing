import { cookies } from "next/headers";

/**
 * Read the user's timezone from the server-side cookie store.
 *
 * Use this in Server Components and Server Actions to get the timezone
 * that was auto-detected (or manually selected) on the client side.
 *
 * Falls back to "UTC" if the cookie is not set.
 */
export async function getUserTimezone(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get("adpilot-timezone")?.value || "UTC";
}
