/**
 * FirstSentenceSummaryEngine — ISummaryEngine implementation.
 *
 * Generates a one-line summary by extracting the first meaningful sentence
 * from post content. Zero cost, zero latency, runs synchronously.
 */
import { ISummaryEngine } from "../interfaces";

const MAX_SUMMARY_LENGTH = 120;

/**
 * Clean up leading noise from LinkedIn posts:
 * - Emojis at the start
 * - Bullet points / list markers
 * - Excessive whitespace
 */
function cleanLeadingNoise(text: string): string {
  return text
    // Remove leading emojis (common Unicode emoji ranges)
    .replace(/^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}•·◆▸▪️‣⁃\-–—\s]+/u, "")
    .trim();
}

/**
 * Extract the first complete sentence from text.
 * Looks for sentence terminators (. ! ?) followed by a space or end of string.
 */
function extractFirstSentence(text: string): string {
  const cleaned = cleanLeadingNoise(text);
  if (!cleaned) return "";

  // Match up to the first sentence-ending punctuation (skip common abbreviations)
  const match = cleaned.match(/^(.+?(?<!Mr|Ms|Dr|Jr|Sr|vs|etc|Prof|Inc|Ltd|Corp|St|Ave|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[.!?])(?:\s|$)/);
  if (match && match[1].length <= MAX_SUMMARY_LENGTH) {
    return match[1].trim();
  }

  // If no sentence terminator found or sentence is too long,
  // truncate at word boundary
  if (cleaned.length <= MAX_SUMMARY_LENGTH) {
    return cleaned;
  }

  // Find last space before the limit
  const truncated = cleaned.slice(0, MAX_SUMMARY_LENGTH);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > MAX_SUMMARY_LENGTH * 0.5) {
    return truncated.slice(0, lastSpace) + "…";
  }

  return truncated + "…";
}

export class FirstSentenceSummaryEngine implements ISummaryEngine {
  generateSummary(content: string): string {
    if (!content || !content.trim()) return "";
    return extractFirstSentence(content);
  }
}
