import { describe, it, expect } from "vitest";
import { createOrgSchema, inviteMemberSchema, updateMemberRoleSchema, createCampaignSchema, createPostSchema, updateCampaignSchema, rejectPostSchema } from "../src/validators";
import { isValidTransition } from "../src/constants";

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

describe("createCampaignSchema", () => {
  it("should accept valid campaign data", () => {
    const result = createCampaignSchema.safeParse({
      name: "Summer Sale",
      objective: "CONVERSIONS",
      targetPlatforms: ["FACEBOOK", "INSTAGRAM"],
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = createCampaignSchema.safeParse({
      name: "",
      objective: "AWARENESS",
      targetPlatforms: ["FACEBOOK"],
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty targetPlatforms", () => {
    const result = createCampaignSchema.safeParse({
      name: "Test",
      objective: "AWARENESS",
      targetPlatforms: [],
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid objective", () => {
    const result = createCampaignSchema.safeParse({
      name: "Test",
      objective: "INVALID",
      targetPlatforms: ["FACEBOOK"],
    });
    expect(result.success).toBe(false);
  });
});

describe("createPostSchema", () => {
  it("should accept valid post data", () => {
    const result = createPostSchema.safeParse({
      platform: "FACEBOOK",
      content: "Check out our new product!",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty content", () => {
    const result = createPostSchema.safeParse({
      platform: "FACEBOOK",
      content: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid platform", () => {
    const result = createPostSchema.safeParse({
      platform: "MYSPACE",
      content: "Hello",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateCampaignSchema", () => {
  it("should require version for optimistic concurrency", () => {
    const result = updateCampaignSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(false);
  });

  it("should accept valid update with version", () => {
    const result = updateCampaignSchema.safeParse({ name: "New Name", version: 1 });
    expect(result.success).toBe(true);
  });
});

describe("rejectPostSchema", () => {
  it("should accept valid rejection reason", () => {
    const result = rejectPostSchema.safeParse({ reason: "Needs better copy" });
    expect(result.success).toBe(true);
  });

  it("should reject empty reason", () => {
    const result = rejectPostSchema.safeParse({ reason: "" });
    expect(result.success).toBe(false);
  });
});

describe("isValidTransition", () => {
  it("should allow DRAFT → PENDING_APPROVAL", () => {
    expect(isValidTransition("DRAFT", "PENDING_APPROVAL")).toBe(true);
  });

  it("should allow PENDING_APPROVAL → APPROVED", () => {
    expect(isValidTransition("PENDING_APPROVAL", "APPROVED")).toBe(true);
  });

  it("should allow PENDING_APPROVAL → REJECTED", () => {
    expect(isValidTransition("PENDING_APPROVAL", "REJECTED")).toBe(true);
  });

  it("should deny DRAFT → PUBLISHED", () => {
    expect(isValidTransition("DRAFT", "PUBLISHED")).toBe(false);
  });

  it("should deny PUBLISHED → DRAFT", () => {
    expect(isValidTransition("PUBLISHED", "DRAFT")).toBe(false);
  });

  it("should allow FAILED → SCHEDULED (retry)", () => {
    expect(isValidTransition("FAILED", "SCHEDULED")).toBe(true);
  });
});
