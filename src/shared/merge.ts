/**
 * Post merge utilities — handles incremental sync and deduplication.
 *
 * Core principle: new scrape results are MERGED with existing posts,
 * never replacing them. Posts are matched by stable ID.
 */
import { Post } from "./types";

/**
 * Generate a stable, content-independent ID for a post.
 *
 * Priority:
 * 1. LinkedIn activity URN (e.g., "urn:li:activity:7100000000000000001")
 * 2. Post URL (fallback)
 * 3. Content-based hash (last resort — unstable)
 *
 * The URN is the most reliable because it's assigned by LinkedIn
 * and doesn't change when DOM rendering changes.
 */
export function getStableId(urn: string, url: string): string {
  // Prefer URN — it's LinkedIn's canonical identifier
  if (urn && urn.startsWith("urn:li:")) {
    return urn;
  }

  // Fallback to URL if it contains an activity reference
  if (url && url.includes("/feed/update/")) {
    // Extract the URN from the URL: .../feed/update/urn:li:activity:123/
    const match = url.match(/urn:li:[^/]+/);
    if (match) return match[0];
  }

  // Last resort: use the URL itself (stable but not ideal)
  if (url) return url;

  // Should never reach here — but guard against empty inputs
  return `unknown-${Date.now()}`;
}

/**
 * Merge newly scraped posts with existing posts.
 *
 * Rules:
 * - Match by stable ID
 * - If a post exists: update mutable fields (content, author info, tags),
 *   preserve AI enrichment data, update scrapedAt
 * - If a post is new: add it
 * - Never delete existing posts (user deletes manually)
 * - Deduplicate by stable ID (keep latest scraped version)
 */
export function mergePosts(existing: Post[], incoming: Post[]): Post[] {
  const merged = new Map<string, Post>();

  // Index existing posts by ID
  for (const post of existing) {
    merged.set(post.id, { ...post });
  }

  // Merge incoming posts
  for (const post of incoming) {
    const prev = merged.get(post.id);
    if (prev) {
      // Update mutable fields, preserve AI enrichment if it has substance
      merged.set(post.id, {
        ...post,
        // Preserve AI data if it existed and wasn't empty
        aiSummary: prev.aiSummary || post.aiSummary,
        aiTags: (prev.aiTags && prev.aiTags.length > 0) ? prev.aiTags : post.aiTags,
        aiEnrichedAt: prev.aiEnrichedAt || post.aiEnrichedAt,
        // Use the latest scrape timestamp
        scrapedAt: post.scrapedAt,
      });
    } else {
      // New post — add it
      merged.set(post.id, { ...post });
    }
  }

  return [...merged.values()];
}
