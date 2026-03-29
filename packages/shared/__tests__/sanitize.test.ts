import { describe, it, expect } from "vitest";
import { sanitizeHtml, sanitizeObject } from "../src/sanitize";

describe("sanitizeHtml", () => {
  it("should strip HTML tags", () => {
    expect(sanitizeHtml("<script>alert('xss')</script>Hello")).toBe("alert('xss')Hello");
  });

  it("should leave plain text unchanged", () => {
    expect(sanitizeHtml("Hello world")).toBe("Hello world");
  });

  it("should strip nested tags", () => {
    expect(sanitizeHtml("<div><p>Text</p></div>")).toBe("Text");
  });

  it("should handle empty string", () => {
    expect(sanitizeHtml("")).toBe("");
  });
});

describe("sanitizeObject", () => {
  it("should sanitize string values", () => {
    const result = sanitizeObject({ name: "<b>Bold</b>", age: 25 });
    expect(result.name).toBe("Bold");
    expect(result.age).toBe(25);
  });

  it("should handle nested objects", () => {
    const result = sanitizeObject({
      user: { name: "<script>x</script>Bob" },
    });
    expect((result.user as { name: string }).name).toBe("xBob");
  });
});
