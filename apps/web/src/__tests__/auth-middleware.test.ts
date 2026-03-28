import { describe, it, expect } from "vitest";
import { ROLE_HIERARCHY } from "@adpilot/shared";

function hasMinimumRole(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] ?? -1;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 999;
  return userLevel >= requiredLevel;
}

describe("RBAC role hierarchy", () => {
  it("OWNER should have access to all roles", () => {
    expect(hasMinimumRole("OWNER", "VIEWER")).toBe(true);
    expect(hasMinimumRole("OWNER", "EDITOR")).toBe(true);
    expect(hasMinimumRole("OWNER", "ADMIN")).toBe(true);
    expect(hasMinimumRole("OWNER", "OWNER")).toBe(true);
  });

  it("ADMIN should have access to ADMIN, EDITOR, VIEWER", () => {
    expect(hasMinimumRole("ADMIN", "VIEWER")).toBe(true);
    expect(hasMinimumRole("ADMIN", "EDITOR")).toBe(true);
    expect(hasMinimumRole("ADMIN", "ADMIN")).toBe(true);
    expect(hasMinimumRole("ADMIN", "OWNER")).toBe(false);
  });

  it("EDITOR should have access to EDITOR and VIEWER", () => {
    expect(hasMinimumRole("EDITOR", "VIEWER")).toBe(true);
    expect(hasMinimumRole("EDITOR", "EDITOR")).toBe(true);
    expect(hasMinimumRole("EDITOR", "ADMIN")).toBe(false);
    expect(hasMinimumRole("EDITOR", "OWNER")).toBe(false);
  });

  it("VIEWER should only have VIEWER access", () => {
    expect(hasMinimumRole("VIEWER", "VIEWER")).toBe(true);
    expect(hasMinimumRole("VIEWER", "EDITOR")).toBe(false);
    expect(hasMinimumRole("VIEWER", "ADMIN")).toBe(false);
    expect(hasMinimumRole("VIEWER", "OWNER")).toBe(false);
  });

  it("unknown role should have no access", () => {
    expect(hasMinimumRole("UNKNOWN", "VIEWER")).toBe(false);
  });
});
