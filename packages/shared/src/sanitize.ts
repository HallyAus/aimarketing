/** Strip HTML tags from a string to prevent XSS in user-generated content */
export function sanitizeHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
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
