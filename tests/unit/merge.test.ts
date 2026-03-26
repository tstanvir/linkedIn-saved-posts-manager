/**
 * Tests for mergePosts — ensures incremental sync behavior:
 * - New posts are added
 * - Existing posts are updated (content fields)
 * - AI enrichment data is preserved
 * - Posts are never deleted during sync
 * - Duplicates are handled
 */
import { describe, it, expect } from "vitest";
import { mergePosts } from "../../src/shared/merge";
import { Post } from "../../src/shared/types";
import { POST_FULL, POST_MINIMAL } from "../fixtures/sample-posts";

function makePost(overrides: Partial<Post>): Post {
  return {
    id: "test-id",
    author: "Test Author",
    authorHeadline: "Test Headline",
    authorAvatar: "",
    content: "Test content",
    url: "https://linkedin.com/test",
    postedAt: "1d",
    scrapedAt: "2026-03-20T12:00:00.000Z",
    tags: [],
    ...overrides,
  };
}

describe("mergePosts", () => {
  it("should add new posts that don't exist yet", () => {
    const existing = [POST_FULL];
    const incoming = [POST_MINIMAL];
    const result = mergePosts(existing, incoming);
    expect(result).toHaveLength(2);
    expect(result.find((p) => p.id === POST_FULL.id)).toBeDefined();
    expect(result.find((p) => p.id === POST_MINIMAL.id)).toBeDefined();
  });

  it("should not duplicate posts with same ID", () => {
    const result = mergePosts([POST_FULL], [POST_FULL]);
    expect(result).toHaveLength(1);
  });

  it("should update content of existing posts with incoming data", () => {
    const existing = [makePost({ id: "post-1", content: "Old content" })];
    const incoming = [makePost({ id: "post-1", content: "Updated content" })];
    const result = mergePosts(existing, incoming);
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe("Updated content");
  });

  it("should preserve AI enrichment when updating a post", () => {
    const existing = [
      makePost({
        id: "post-1",
        aiSummary: "AI generated summary",
        aiTags: ["tag-a", "tag-b"],
        aiEnrichedAt: "2026-03-20T14:00:00.000Z",
      }),
    ];
    const incoming = [
      makePost({
        id: "post-1",
        content: "Newer content from re-scrape",
        // No AI fields in incoming — scraper doesn't produce these
      }),
    ];
    const result = mergePosts(existing, incoming);
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe("Newer content from re-scrape");
    expect(result[0].aiSummary).toBe("AI generated summary");
    expect(result[0].aiTags).toEqual(["tag-a", "tag-b"]);
    expect(result[0].aiEnrichedAt).toBe("2026-03-20T14:00:00.000Z");
  });

  it("should never delete existing posts during sync", () => {
    const existing = [
      makePost({ id: "old-post", content: "I'm from a previous sync" }),
      makePost({ id: "another-old", content: "Me too" }),
    ];
    const incoming = [
      makePost({ id: "new-post", content: "I'm brand new" }),
    ];
    const result = mergePosts(existing, incoming);
    expect(result).toHaveLength(3);
    expect(result.find((p) => p.id === "old-post")).toBeDefined();
    expect(result.find((p) => p.id === "another-old")).toBeDefined();
    expect(result.find((p) => p.id === "new-post")).toBeDefined();
  });

  it("should handle empty existing array", () => {
    const result = mergePosts([], [POST_FULL, POST_MINIMAL]);
    expect(result).toHaveLength(2);
  });

  it("should handle empty incoming array", () => {
    const result = mergePosts([POST_FULL, POST_MINIMAL], []);
    expect(result).toHaveLength(2);
  });

  it("should handle both arrays empty", () => {
    const result = mergePosts([], []);
    expect(result).toHaveLength(0);
  });

  it("should use latest scrapedAt from incoming", () => {
    const existing = [makePost({ id: "post-1", scrapedAt: "2026-03-20T12:00:00.000Z" })];
    const incoming = [makePost({ id: "post-1", scrapedAt: "2026-03-21T12:00:00.000Z" })];
    const result = mergePosts(existing, incoming);
    expect(result[0].scrapedAt).toBe("2026-03-21T12:00:00.000Z");
  });

  it("should handle large-scale merge without data loss", () => {
    const existing = Array.from({ length: 200 }, (_, i) =>
      makePost({ id: `post-${i}`, content: `Content ${i}` })
    );
    const incoming = Array.from({ length: 50 }, (_, i) =>
      makePost({ id: `post-${i + 180}`, content: `Updated content ${i + 180}` })
    );
    // 200 existing + 30 new (50 incoming - 20 overlapping)
    const result = mergePosts(existing, incoming);
    expect(result).toHaveLength(230);
  });
});
