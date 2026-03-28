import { describe, it, expect } from "vitest";
import { checkPlanLimit } from "../src/plan-limits";
import type { OrgUsage } from "../src/types";

describe("checkPlanLimit", () => {
  const baseUsage: OrgUsage = {
    platformConnections: 0,
    postsThisMonth: 0,
    teamMembers: 1,
  };

  describe("FREE plan", () => {
    it("should allow connecting platform when under limit", () => {
      const result = checkPlanLimit("FREE", "platformConnections", {
        ...baseUsage,
        platformConnections: 1,
      });
      expect(result.allowed).toBe(true);
    });

    it("should deny connecting platform when at limit", () => {
      const result = checkPlanLimit("FREE", "platformConnections", {
        ...baseUsage,
        platformConnections: 2,
      });
      expect(result.allowed).toBe(false);
      expect(result.upgradeRequired).toBe("PRO");
    });

    it("should allow creating post when under limit", () => {
      const result = checkPlanLimit("FREE", "postsThisMonth", {
        ...baseUsage,
        postsThisMonth: 9,
      });
      expect(result.allowed).toBe(true);
    });

    it("should deny creating post when at limit", () => {
      const result = checkPlanLimit("FREE", "postsThisMonth", {
        ...baseUsage,
        postsThisMonth: 10,
      });
      expect(result.allowed).toBe(false);
    });

    it("should deny inviting member (limit is 1)", () => {
      const result = checkPlanLimit("FREE", "teamMembers", {
        ...baseUsage,
        teamMembers: 1,
      });
      expect(result.allowed).toBe(false);
    });
  });

  describe("PRO plan", () => {
    it("should allow up to 5 platform connections", () => {
      const result = checkPlanLimit("PRO", "platformConnections", {
        ...baseUsage,
        platformConnections: 4,
      });
      expect(result.allowed).toBe(true);
    });

    it("should deny 6th platform connection", () => {
      const result = checkPlanLimit("PRO", "platformConnections", {
        ...baseUsage,
        platformConnections: 5,
      });
      expect(result.allowed).toBe(false);
      expect(result.upgradeRequired).toBe("AGENCY");
    });

    it("should allow unlimited posts", () => {
      const result = checkPlanLimit("PRO", "postsThisMonth", {
        ...baseUsage,
        postsThisMonth: 99999,
      });
      expect(result.allowed).toBe(true);
    });
  });

  describe("AGENCY plan", () => {
    it("should allow unlimited everything", () => {
      const result = checkPlanLimit("AGENCY", "platformConnections", {
        ...baseUsage,
        platformConnections: 100,
      });
      expect(result.allowed).toBe(true);
    });
  });
});
