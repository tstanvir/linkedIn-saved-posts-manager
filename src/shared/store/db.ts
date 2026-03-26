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
      // id = primary key, plus indexes for common queries
      posts: "id, scrapedAt, *tags",
    });
  }
}

export const db = new LspmDatabase();
