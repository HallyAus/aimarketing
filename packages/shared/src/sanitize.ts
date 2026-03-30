/**
 * Allowlist-based HTML sanitizer to prevent XSS in user-generated content.
 * Strips all HTML tags except safe formatting tags, and removes dangerous attributes.
 */

const ALLOWED_TAGS = new Set([
  "b", "i", "u", "em", "strong", "br", "p", "ul", "ol", "li", "a",
]);

/**
 * Strip HTML tags using an allowlist approach.
 * Only tags in ALLOWED_TAGS are preserved; all attributes except href on <a> are removed.
 * Event handlers (on*), javascript: URIs, and data: URIs are always stripped.
 */
export function sanitizeHtml(input: string): string {
  // Remove script/style tags and their content entirely
  let result = input.replace(/<(script|style|iframe|object|embed|form)[^>]*>[\s\S]*?<\/\1>/gi, "");
  // Remove self-closing dangerous tags
  result = result.replace(/<(script|style|iframe|object|embed|form)[^>]*\/?>/gi, "");

  // Process remaining tags
  result = result.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (match, tag, attrs) => {
    const tagLower = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(tagLower)) {
      return ""; // Strip disallowed tags
    }

    // For closing tags, just return the clean closing tag
    if (match.startsWith("</")) {
      return `</${tagLower}>`;
    }

    // For allowed tags, only keep href on <a> tags (and sanitize it)
    if (tagLower === "a") {
      const hrefMatch = /href\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/i.exec(attrs);
      if (hrefMatch) {
        const href = hrefMatch[1] ?? hrefMatch[2] ?? hrefMatch[3] ?? "";
        // Block javascript: and data: URIs
        if (/^\s*(javascript|data|vbscript):/i.test(href)) {
          return `<${tagLower}>`;
        }
        return `<${tagLower} href="${href.replace(/"/g, "&quot;")}">`;
      }
      return `<${tagLower}>`;
    }

    // For other allowed tags, strip all attributes
    return `<${tagLower}>`;
  });

  // Remove any remaining event handler attributes that might have slipped through
  result = result.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  return result;
}

/** Sanitize an object's string values recursively */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key in result) {
    const value = result[key];
    if (typeof value === "string") {
      (result as Record<string, unknown>)[key] = sanitizeHtml(value);
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = sanitizeObject(
        value as Record<string, unknown>
      );
    }
  }
  return result;
}
