import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "@/lib/logger";

describe("logger", () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, "log").mockImplementation(() => {}),
      warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
      error: vi.spyOn(console, "error").mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
    (process.env as Record<string, string>).NODE_ENV = originalNodeEnv;
  });

  // -------------------------------------------------------------------------
  // Structured output format
  // -------------------------------------------------------------------------
  describe("structured JSON output", () => {
    it("info outputs valid JSON to console.log", () => {
      logger.info("Test message");

      expect(consoleSpy.log).toHaveBeenCalledOnce();
      const output = consoleSpy.log.mock.calls[0]![0] as string;
      const parsed = JSON.parse(output);

      expect(parsed.level).toBe("info");
      expect(parsed.message).toBe("Test message");
      expect(parsed.timestamp).toBeDefined();
    });

    it("warn outputs valid JSON to console.warn", () => {
      logger.warn("Warning message");

      expect(consoleSpy.warn).toHaveBeenCalledOnce();
      const output = consoleSpy.warn.mock.calls[0]![0] as string;
      const parsed = JSON.parse(output);

      expect(parsed.level).toBe("warn");
      expect(parsed.message).toBe("Warning message");
    });

    it("error outputs valid JSON to console.error", () => {
      logger.error("Error message");

      expect(consoleSpy.error).toHaveBeenCalledOnce();
      const output = consoleSpy.error.mock.calls[0]![0] as string;
      const parsed = JSON.parse(output);

      expect(parsed.level).toBe("error");
      expect(parsed.message).toBe("Error message");
    });
  });

  // -------------------------------------------------------------------------
  // Timestamp
  // -------------------------------------------------------------------------
  describe("timestamp", () => {
    it("includes an ISO 8601 timestamp", () => {
      logger.info("Timestamp test");

      const output = consoleSpy.log.mock.calls[0]![0] as string;
      const parsed = JSON.parse(output);

      // Should parse as a valid date
      const date = new Date(parsed.timestamp);
      expect(date.getTime()).not.toBeNaN();
      // Should be ISO format
      expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  // -------------------------------------------------------------------------
  // Meta / additional fields
  // -------------------------------------------------------------------------
  describe("metadata", () => {
    it("includes additional metadata in the JSON output", () => {
      logger.info("With meta", { userId: "u_123", action: "login" });

      const output = consoleSpy.log.mock.calls[0]![0] as string;
      const parsed = JSON.parse(output);

      expect(parsed.userId).toBe("u_123");
      expect(parsed.action).toBe("login");
      expect(parsed.message).toBe("With meta");
    });

    it("merges error metadata correctly", () => {
      logger.error("Operation failed", {
        error: "Connection timeout",
        stack: "at line 42",
      });

      const output = consoleSpy.error.mock.calls[0]![0] as string;
      const parsed = JSON.parse(output);

      expect(parsed.error).toBe("Connection timeout");
      expect(parsed.stack).toBe("at line 42");
    });
  });

  // -------------------------------------------------------------------------
  // Debug level behavior
  // -------------------------------------------------------------------------
  describe("debug level", () => {
    it("outputs debug messages in development", () => {
      (process.env as Record<string, string>).NODE_ENV = "development";
      logger.debug("Debug info");

      expect(consoleSpy.log).toHaveBeenCalledOnce();
      const output = consoleSpy.log.mock.calls[0]![0] as string;
      const parsed = JSON.parse(output);
      expect(parsed.level).toBe("debug");
    });

    it("suppresses debug messages in production", () => {
      (process.env as Record<string, string>).NODE_ENV = "production";
      logger.debug("Should not appear");

      expect(consoleSpy.log).not.toHaveBeenCalled();
    });

    it("suppresses debug messages in test environment", () => {
      (process.env as Record<string, string>).NODE_ENV = "test";
      logger.debug("Should not appear");

      expect(consoleSpy.log).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // All four log methods exist
  // -------------------------------------------------------------------------
  describe("API surface", () => {
    it("exposes debug, info, warn, and error methods", () => {
      expect(typeof logger.debug).toBe("function");
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.error).toBe("function");
    });
  });
});
