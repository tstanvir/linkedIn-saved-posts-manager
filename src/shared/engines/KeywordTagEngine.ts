/**
 * KeywordTagEngine — ITagEngine implementation using hashtag extraction + TF-IDF.
 *
 * Generates tags from post content without LLM dependency:
 * 1. Extracts existing #hashtags
 * 2. Performs lightweight TF-IDF keyword extraction for top terms
 * 3. Merges and deduplicates both sources
 */
import { ITagEngine } from "../interfaces";

// Common English stop words to exclude from keyword extraction
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "it", "its", "as", "are", "was",
  "were", "be", "been", "being", "have", "has", "had", "do", "does",
  "did", "will", "would", "could", "should", "may", "might", "can",
  "this", "that", "these", "those", "i", "you", "he", "she", "we",
  "they", "me", "him", "her", "us", "them", "my", "your", "his", "our",
  "their", "what", "which", "who", "when", "where", "why", "how", "all",
  "each", "every", "both", "few", "more", "most", "other", "some", "such",
  "no", "not", "only", "own", "same", "so", "than", "too", "very", "just",
  "about", "above", "after", "again", "also", "any", "before", "between",
  "here", "there", "if", "into", "over", "then", "up", "out", "now",
  "new", "one", "two", "get", "got", "like", "make", "know", "think",
  "take", "come", "see", "want", "look", "use", "find", "give", "tell",
  "work", "say", "go", "need", "even", "back", "still", "way", "well",
  "because", "much", "many", "really", "re", "ve", "ll", "don", "t", "s",
  "m", "http", "https", "www", "com", "org", "net", "io", "co",
  // Extended Adverbs & Fillers
  "absolutely", "actually", "according", "across", "almost", "already", "always",
  "although", "another", "anyone", "anything", "anyway", "anywhere", "around",
  "behind", "below", "beside", "besides", "beyond", "cannot", "couldnt", "despite",
  "during", "either", "enough", "especially", "everyone", "everything", "everywhere",
  "except", "finally", "further", "furthermore", "however", "indeed", "instead",
  "itself", "maybe", "meanwhile", "moreover", "mostly", "neither", "never",
  "nevertheless", "nobody", "none", "nothing", "nowhere", "often", "otherwise",
  "ourselves", "perhaps", "probably", "rather", "seldom", "several", "shouldnt",
  "someone", "something", "sometimes", "somewhere", "therefore", "themselves",
  "though", "through", "throughout", "together", "unless", "unlike", "until",
  "whatever", "whenever", "wherever", "whether", "whichever", "while", "whoever",
  "within", "without", "wouldnt", "yourself", "yourselves", "today", "tomorrow",
  "yesterday", "first", "second", "third", "last", "next", "good", "great", "best",
  "better", "bad", "worst", "worse", "right", "wrong", "true", "false", "yes", "yeah",
  "sure", "okay", "hello", "thanks", "thank", "please", "can", "cant", "must"
]);

// Allowed 2-letter meaningful tech acronyms
const TECH_ACRONYMS = new Set(["ai", "ml", "ui", "ux", "pr", "qa", "ci", "cd", "os", "db", "vr", "ar"]);

// Minimum word length to be considered a keyword
const MIN_WORD_LENGTH = 3;
// Maximum tags to return
const MAX_TAGS = 5;

/**
 * Extract #hashtag tokens from text.
 * We preserve the original casing to allow camelCasing (e.g., #SystemDesign).
 */
function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w\u00C0-\u024F]+/g) ?? [];
  return [...new Set(matches)];
}

/**
 * Tokenize text into lowercase words, filtering stop words and short tokens.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    // Strip URLs completely
    .replace(/https?:\/\/\S+/g, " ")
    // Strip words containing digits (e.g. 100, 1yr, 2024, 3mo)
    .replace(/\b[a-z0-9]*\d[a-z0-9]*\b/g, " ")
    // Strip non-alphabetical characters (allows internal hyphens)
    .replace(/[^a-z\u00C0-\u024F\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => {
      // Must not be a stop word
      if (STOP_WORDS.has(w)) return false;
      // Must not start or end with hyphen
      if (w.startsWith("-") || w.endsWith("-")) return false;
      // Length constraints (allow >= MIN_WORD_LENGTH, or whitelisted 2-letter tech acronyms)
      return w.length >= MIN_WORD_LENGTH || TECH_ACRONYMS.has(w);
    });
}

/**
 * Compute term frequency for tokens in a single document.
 */
function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1);
  }
  // Normalize by document length
  const len = tokens.length || 1;
  for (const [key, val] of tf) {
    tf.set(key, val / len);
  }
  return tf;
}

/**
 * Extract top keywords from text using TF scoring.
 * (For single-document extraction, TF is more appropriate than full TF-IDF
 * which requires a corpus. We approximate "importance" via term frequency
 * within the post, penalizing common words via the stop word list.)
 */
function extractKeywords(text: string, maxCount: number): string[] {
  const tokens = tokenize(text);
  if (tokens.length === 0) return [];

  const tf = termFrequency(tokens);

  // Sort by frequency (descending), take top N
  return [...tf.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxCount)
    .map(([word]) => word);
}

export class KeywordTagEngine implements ITagEngine {
  generateTags(content: string): string[] {
    const hashtags = extractHashtags(content);
    // Strip # from hashtags and enforce camelCase (lowercase first letter)
    const cleanHashtags = hashtags.map((h) => {
      const tag = h.replace(/^#/, "");
      return tag.charAt(0).toLowerCase() + tag.slice(1);
    });

    const keywords = extractKeywords(content, MAX_TAGS);

    // Merge: hashtags first (higher signal), then keywords, deduplicated
    // Case-insensitive deduplication, but preserve original camelCase shape
    const seen = new Set<string>();
    const merged: string[] = [];

    for (const tag of [...cleanHashtags, ...keywords]) {
      const lower = tag.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        merged.push(tag);
      }
    }

    return merged.slice(0, MAX_TAGS);
  }
}
