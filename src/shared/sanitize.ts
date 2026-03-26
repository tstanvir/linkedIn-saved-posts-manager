/**
 * Content sanitization — prevents XSS from scraped LinkedIn HTML.
 *
 * All user-facing post content passes through sanitizeText() before rendering.
 * Strips HTML tags, decodes entities, and removes dangerous patterns.
 */

/**
 * Strip all HTML tags from text, keeping only text content.
 */
function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, "");
}

/**
 * Decode common HTML entities to their text equivalents.
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&nbsp;": " ",
  };
  return text.replace(
    /&(?:amp|lt|gt|quot|#39|apos|nbsp);/g,
    (match) => entities[match] ?? match
  );
}

/**
 * Remove dangerous URL schemes (javascript:, data:, vbscript:).
 */
function removeDangerousSchemes(text: string): string {
  return text.replace(/(?:javascript|data|vbscript)\s*:/gi, "");
}

/**
 * Remove event handler patterns (onerror=, onclick=, etc.)
 */
function removeEventHandlers(text: string): string {
  return text.replace(/\bon\w+\s*=/gi, "");
}

/**
 * Sanitize text content scraped from LinkedIn.
 * Safe to render as text content (not innerHTML).
 *
 * Pipeline:
 * 1. Strip HTML tags
 * 2. Decode HTML entities
 * 3. Remove dangerous URL schemes
 * 4. Remove event handler patterns
 * 5. Normalize whitespace
 */
export function sanitizeText(text: string): string {
  if (!text) return "";

  let clean = text;
  clean = stripHtmlTags(clean);
  clean = decodeHtmlEntities(clean);
  clean = removeDangerousSchemes(clean);
  clean = removeEventHandlers(clean);
  // Normalize whitespace
  clean = clean.replace(/\s+/g, " ").trim();

  return clean;
}

/**
 * Sanitize a URL — only allow http(s) and extension URLs.
 */
export function sanitizeUrl(url: string): string {
  if (!url) return "";
  const trimmed = url.trim();

  // Only allow safe schemes
  if (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("chrome-extension://")
  ) {
    return trimmed;
  }

  return "";
}
