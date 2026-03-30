import { describe, it, expect } from "vitest";
import { sanitizeHtml, sanitizeObject } from "../src/sanitize";

describe("sanitizeHtml", () => {
  it("should strip script tags and their content", () => {
    expect(sanitizeHtml("<script>alert('xss')</script>Hello")).toBe("Hello");
  });

  it("should leave plain text unchanged", () => {
    expect(sanitizeHtml("Hello world")).toBe("Hello world");
  });

  it("should strip disallowed tags but keep allowed ones", () => {
    expect(sanitizeHtml("<div><p>Text</p></div>")).toBe("<p>Text</p>");
  });

  it("should handle empty string", () => {
    expect(sanitizeHtml("")).toBe("");
  });

  it("should keep safe formatting tags", () => {
    expect(sanitizeHtml("<b>Bold</b> and <em>italic</em>")).toBe("<b>Bold</b> and <em>italic</em>");
  });

  it("should strip event handler attributes", () => {
    expect(sanitizeHtml('<p onclick="alert(1)">Text</p>')).toBe("<p>Text</p>");
  });

  it("should block javascript: URIs in links", () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">Click</a>')).toBe("<a>Click</a>");
  });

  it("should allow safe href in links", () => {
    expect(sanitizeHtml('<a href="https://example.com">Click</a>')).toBe('<a href="https://example.com">Click</a>');
  });

  it("should strip iframe tags", () => {
    expect(sanitizeHtml('<iframe src="evil.com"></iframe>Safe')).toBe("Safe");
  });
});

describe("sanitizeObject", () => {
  it("should sanitize string values, keeping safe tags", () => {
    const result = sanitizeObject({ name: "<b>Bold</b>", age: 25 });
    expect(result.name).toBe("<b>Bold</b>");
    expect(result.age).toBe(25);
  });

  it("should strip dangerous tags from nested objects", () => {
    const result = sanitizeObject({
      user: { name: "<script>x</script>Bob" },
    });
    expect((result.user as { name: string }).name).toBe("Bob");
  });

  it("should strip disallowed tags but keep text", () => {
    const result = sanitizeObject({ title: "<div>Hello</div>" });
    expect(result.title).toBe("Hello");
  });
});
