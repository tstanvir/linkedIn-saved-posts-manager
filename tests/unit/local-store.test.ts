/**
 * Tests for LocalPostStore — IndexedDB-backed IPostStore implementation.
 * Uses fake-indexeddb to simulate IndexedDB in Node.js test environment.
 */
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { LocalPostStore } from "../../src/shared/store/LocalPostStore";
import { db } from "../../src/shared/store/db";
import { Post } from "../../src/shared/types";

function makePost(overrides: Partial<Post>): Post {
  return {
    id: "test-id",
    author: "Test Author",
    authorHeadline: "Headline",
    authorAvatar: "",
    content: "Test content about software engineering",
    url: "https://linkedin.com/test",
    postedAt: "1d",
    scrapedAt: "2026-03-20T12:00:00.000Z",
    tags: ["#testing"],
    ...overrides,
  };
}

describe("LocalPostStore", () => {
  let store: LocalPostStore;

  beforeEach(async () => {
    store = new LocalPostStore();
    await db.posts.clear();
  });

  describe("getAll", () => {
    it("should return empty array when no posts", async () => {
      const result = await store.getAll();
      expect(result).toEqual([]);
    });

    it("should return all stored posts", async () => {
      await db.posts.bulkAdd([
        makePost({ id: "1" }),
        makePost({ id: "2" }),
      ]);
      const result = await store.getAll();
      expect(result).toHaveLength(2);
    });
  });

  describe("getById", () => {
    it("should return a post by its ID", async () => {
      await db.posts.add(makePost({ id: "abc", author: "Found Me" }));
      const result = await store.getById("abc");
      expect(result?.author).toBe("Found Me");
    });

    it("should return undefined for missing ID", async () => {
      const result = await store.getById("nonexistent");
      expect(result).toBeUndefined();
    });
  });

  describe("upsertMany", () => {
    it("should insert new posts", async () => {
      const posts = [makePost({ id: "1" }), makePost({ id: "2" })];
      const result = await store.upsertMany(posts);
      expect(result).toHaveLength(2);
    });

    it("should update existing posts", async () => {
      await db.posts.add(makePost({ id: "1", content: "Old" }));
      await store.upsertMany([makePost({ id: "1", content: "New" })]);
      const post = await store.getById("1");
      expect(post?.content).toBe("New");
    });

    it("should handle mix of new and existing", async () => {
      await db.posts.add(makePost({ id: "existing" }));
      const result = await store.upsertMany([
        makePost({ id: "existing", content: "Updated" }),
        makePost({ id: "new-one" }),
      ]);
      expect(result).toHaveLength(2);
    });
  });

  describe("deleteById", () => {
    it("should remove a post", async () => {
      await db.posts.add(makePost({ id: "to-delete" }));
      await store.deleteById("to-delete");
      const result = await store.getById("to-delete");
      expect(result).toBeUndefined();
    });

    it("should not throw when deleting nonexistent ID", async () => {
      await expect(store.deleteById("nonexistent")).resolves.not.toThrow();
    });
  });

  describe("search", () => {
    it("should find posts by content", async () => {
      await db.posts.bulkAdd([
        makePost({ id: "1", content: "React hooks are great" }),
        makePost({ id: "2", content: "Python is versatile" }),
      ]);
      const result = await store.search("react");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });

    it("should find posts by author", async () => {
      await db.posts.bulkAdd([
        makePost({ id: "1", author: "Alice" }),
        makePost({ id: "2", author: "Bob" }),
      ]);
      const result = await store.search("alice");
      expect(result).toHaveLength(1);
    });

    it("should find posts by aiSummary", async () => {
      await db.posts.bulkAdd([
        makePost({ id: "1", aiSummary: "Machine learning tutorial" }),
        makePost({ id: "2", content: "Cooking recipes" }),
      ]);
      const result = await store.search("machine learning");
      expect(result).toHaveLength(1);
    });

    it("should find posts by aiTags", async () => {
      await db.posts.bulkAdd([
        makePost({ id: "1", aiTags: ["typescript", "react"] }),
        makePost({ id: "2", aiTags: ["python", "django"] }),
      ]);
      const result = await store.search("typescript");
      expect(result).toHaveLength(1);
    });

    it("should be case-insensitive", async () => {
      await db.posts.add(makePost({ id: "1", content: "TypeScript" }));
      const result = await store.search("typescript");
      expect(result).toHaveLength(1);
    });
  });

  describe("filterByTag", () => {
    it("should filter by hashtag tags", async () => {
      await db.posts.bulkAdd([
        makePost({ id: "1", tags: ["#react", "#typescript"] }),
        makePost({ id: "2", tags: ["#python"] }),
      ]);
      const result = await store.filterByTag("#react");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });

    it("should filter by aiTags", async () => {
      await db.posts.bulkAdd([
        makePost({ id: "1", tags: [], aiTags: ["machine-learning"] }),
        makePost({ id: "2", tags: [], aiTags: ["web-dev"] }),
      ]);
      const result = await store.filterByTag("machine-learning");
      expect(result).toHaveLength(1);
    });

    it("should deduplicate posts found in both tags and aiTags", async () => {
      await db.posts.add(
        makePost({ id: "1", tags: ["react"], aiTags: ["react"] })
      );
      const result = await store.filterByTag("react");
      expect(result).toHaveLength(1);
    });
  });
});
