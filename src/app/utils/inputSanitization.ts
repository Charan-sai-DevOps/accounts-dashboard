/**
 * Input sanitization and validation utilities
 * Addresses issues: 34 (string trimming), input safety
 */

/**
 * Trim and validate string input
 * Removes leading/trailing whitespace and empty strings
 *
 * @example
 * const name = trimInput(userInput); // "John Doe"
 */
export function trimInput(input: string | null | undefined): string {
  return String(input || '').trim();
}

/**
 * Sanitize string to prevent XSS
 * Escapes HTML special characters
 *
 * @example
 * const safe = sanitizeString('<script>alert("xss")</script>');
 * // '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 */
export function sanitizeString(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(input || '').replace(/[&<>"']/g, char => map[char]);
}

/**
 * Trim all strings in an object
 * Useful for form submissions
 *
 * @example
 * const clean = trimObject({ name: "  John  ", email: "  john@example.com  " });
 * // { name: "John", email: "john@example.com" }
 */
export function trimObject<T extends Record<string, any>>(obj: T): T {
  const result = { ...obj };

  for (const key in result) {
    if (typeof result[key] === 'string') {
      result[key] = trimInput(result[key]);
    }
  }

  return result;
}

/**
 * Validate email format
 * Simple check (more thorough validation in Zod schemas)
 *
 * @example
 * if (isValidEmail(email)) { ... }
 */
export function isValidEmail(email: string): boolean {
  const trimmed = trimInput(email);
  // Basic email regex - more thorough validation in Zod
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}

/**
 * Remove leading/trailing whitespace from object strings
 * Deep version for nested objects
 *
 * @example
 * const clean = deepTrim(formData);
 */
export function deepTrim<T>(obj: any): T {
  if (typeof obj === 'string') {
    return trimInput(obj) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepTrim(item)) as T;
  }

  if (obj !== null && typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = deepTrim(obj[key]);
    }
    return result as T;
  }

  return obj;
}

/**
 * Validate required fields in object
 * Returns error messages for missing fields
 *
 * @example
 * const errors = validateRequired({ name: "", email: "test@example.com" }, ["name", "email"]);
 * // { name: "Name is required" }
 */
export function validateRequired(
  obj: Record<string, any>,
  fields: string[]
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const value = obj[field];
    if (!value || (typeof value === 'string' && !trimInput(value))) {
      const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
      errors[field] = `${fieldName} is required`;
    }
  }

  return errors;
}

/**
 * Safe JSON parse with fallback
 * Prevents crashes on invalid JSON
 *
 * @example
 * const data = safeJsonParse(jsonString, { default: "value" });
 */
export function safeJsonParse<T>(
  jsonString: string,
  fallback: T
): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('[JSON Parse] Failed to parse:', error);
    return fallback;
  }
}

/**
 * Normalize whitespace in string
 * Removes extra spaces, newlines, etc.
 *
 * @example
 * const clean = normalizeWhitespace("Hello    World");  // "Hello World"
 */
export function normalizeWhitespace(input: string): string {
  return trimInput(input).replace(/\s+/g, ' ');
}

/**
 * Convert string to slug format
 * Useful for URLs and identifiers
 *
 * @example
 * const slug = toSlug("Hello World"); // "hello-world"
 */
export function toSlug(input: string): string {
  return trimInput(input)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Capitalize first letter
 * @example
 * capitalize("hello"); // "Hello"
 */
export function capitalize(input: string): string {
  const trimmed = trimInput(input);
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Check if string is empty or whitespace only
 * @example
 * isEmpty("  "); // true
 * isEmpty("hello"); // false
 */
export function isEmpty(input: string | null | undefined): boolean {
  return !trimInput(input);
}
