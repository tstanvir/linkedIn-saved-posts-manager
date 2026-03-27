/**
 * LocalPostStore — IndexedDB-backed implementation of IPostStore.
 *
 * Uses Dexie.js for structured queries. Replaces the old
 * chrome.storage.local approach (no 5MB limit, proper indexing).
 */
import { IPostStore } from "../interfaces";
import { Post } from "../types";
import { db } from "./db";

export class LocalPostStore implements IPostStore {
  async getAll(): Promise<Post[]> {
    return db.posts.orderBy("scrapedAt").reverse().toArray();
  }

  async getById(id: string): Promise<Post | undefined> {
    return db.posts.get(id);
  }

  async upsertMany(posts: Post[]): Promise<Post[]> {
    // Dexie's bulkPut performs upsert (insert or update by primary key)
    await db.posts.bulkPut(posts);
    return db.posts.toArray();
  }

  async deleteById(id: string): Promise<void> {
    await db.posts.delete(id);
  }

  async search(query: string): Promise<Post[]> {
    const q = query.toLowerCase();
    return db.posts
      .filter((post) => {
        return (
          post.content.toLowerCase().includes(q) ||
          post.author.toLowerCase().includes(q) ||
          (post.aiSummary?.toLowerCase().includes(q) ?? false) ||
          (post.aiTags?.some((t) => t.includes(q)) ?? false)
        );
      })
      .toArray();
  }

  async filterByTag(tag: string): Promise<Post[]> {
    const [fromTags, fromAiTags] = await Promise.all([
      db.posts.where("tags").equals(tag).toArray(),
      db.posts.where("aiTags").equals(tag).toArray(),
    ]);

    // Deduplicate by ID
    const merged = new Map<string, Post>();
    for (const p of [...fromTags, ...fromAiTags]) {
      merged.set(p.id, p);
    }
    return [...merged.values()];
  }
}
