/**
 * Input sanitization utilities to prevent XSS and enforce input constraints.
 *
 * Supabase parameterized queries already prevent SQL injection, so these
 * helpers focus on output-safe sanitization for user-generated content.
 */

/**
 * Strip HTML tags and encode dangerous characters for safe text display.
 *
 * Use this for free-form text fields (comments, descriptions, etc.).
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\//g, "&#x2F;")
    .trim();
}

/**
 * Validate and sanitize a user handle (username).
 *
 * Rules: lowercase, alphanumeric + underscore only, max 30 chars.
 */
export function sanitizeHandle(handle: string): string {
  return handle
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 30);
}

/**
 * Sanitize a slug (URL-safe string).
 *
 * Rules: lowercase, alphanumeric + hyphens only, max 100 chars.
 */
export function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 100);
}

/**
 * Basic Pix key sanitization. Strips control characters and limits length.
 *
 * Pix keys can be CPF, CNPJ, phone, email, or random — so we only strip
 * obviously dangerous content rather than enforcing a specific format.
 */
export function sanitizePixKey(key: string): string {
  return key
    .replace(/<[^>]*>/g, "")
    .replace(/[^\w@.\-+/]/g, "")
    .trim()
    .slice(0, 100);
}
