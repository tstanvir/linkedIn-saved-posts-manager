/**
 * Dexie.js database definition for posts.
 * Single source of truth for the IndexedDB schema.
 */
import Dexie, { type Table } from "dexie";
import { Post } from "../types";

export class LspmDatabase extends Dexie {
  posts!: Table<Post, string>;

  constructor() {
    super("lspm_db");

    this.version(1).stores({
      posts: "id, scrapedAt, *tags",
    });

    this.version(2).stores({
      // Added *aiTags multi-entry index for efficient tag filtering
      posts: "id, scrapedAt, *tags, *aiTags",
    });
  }
}

export const db = new LspmDatabase();
