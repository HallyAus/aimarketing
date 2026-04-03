/**
 * Permanent super admin emails. These accounts cannot be demoted, suspended,
 * or banned through the admin UI or API.
 */
export const PERMANENT_SUPER_ADMINS: readonly string[] = [
  "danieljhall@me.com",
];

/** Check whether the given email belongs to a permanent super admin. */
export function isPermanentSuperAdmin(email: string): boolean {
  return PERMANENT_SUPER_ADMINS.includes(email.toLowerCase());
}
