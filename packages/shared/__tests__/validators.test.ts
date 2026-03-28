import { describe, it, expect } from "vitest";
import { createOrgSchema, inviteMemberSchema, updateMemberRoleSchema } from "../src/validators";

describe("createOrgSchema", () => {
  it("should accept valid org data", () => {
    const result = createOrgSchema.safeParse({ name: "My Agency", slug: "my-agency" });
    expect(result.success).toBe(true);
  });

  it("should reject short name", () => {
    const result = createOrgSchema.safeParse({ name: "A", slug: "my-agency" });
    expect(result.success).toBe(false);
  });

  it("should reject slug with uppercase", () => {
    const result = createOrgSchema.safeParse({ name: "My Agency", slug: "My-Agency" });
    expect(result.success).toBe(false);
  });

  it("should reject slug with spaces", () => {
    const result = createOrgSchema.safeParse({ name: "My Agency", slug: "my agency" });
    expect(result.success).toBe(false);
  });
});

describe("inviteMemberSchema", () => {
  it("should accept valid invitation", () => {
    const result = inviteMemberSchema.safeParse({ email: "user@example.com", role: "EDITOR" });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = inviteMemberSchema.safeParse({ email: "not-email", role: "EDITOR" });
    expect(result.success).toBe(false);
  });

  it("should reject OWNER role in invitations", () => {
    const result = inviteMemberSchema.safeParse({ email: "user@example.com", role: "OWNER" });
    expect(result.success).toBe(false);
  });
});

describe("updateMemberRoleSchema", () => {
  it("should accept valid role update", () => {
    const result = updateMemberRoleSchema.safeParse({ role: "ADMIN" });
    expect(result.success).toBe(true);
  });

  it("should reject OWNER role", () => {
    const result = updateMemberRoleSchema.safeParse({ role: "OWNER" });
    expect(result.success).toBe(false);
  });
});
