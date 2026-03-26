import { Post } from "./types";

// ─── IPostStore ──────────────────────────────────────────────────────────────
// Abstraction over post persistence. MVP: IndexedDB. Future: Cloud API.
export interface IPostStore {
  /** Retrieve all stored posts. */
  getAll(): Promise<Post[]>;

  /** Retrieve a single post by its stable ID. */
  getById(id: string): Promise<Post | undefined>;

  /** Insert or update many posts (merge by ID). Returns the full updated list. */
  upsertMany(posts: Post[]): Promise<Post[]>;

  /** Delete a single post by ID. */
  deleteById(id: string): Promise<void>;

  /** Full-text search across post content — returns matching posts. */
  search(query: string): Promise<Post[]>;

  /** Filter posts that contain a specific tag (checks both tags and aiTags). */
  filterByTag(tag: string): Promise<Post[]>;
}

// ─── ITagEngine ──────────────────────────────────────────────────────────────
// Abstraction over tag generation. MVP: keyword extraction. Future: LLM tagger.
export interface ITagEngine {
  /** Generate tags from post content. Returns an array of lowercase tag strings. */
  generateTags(content: string): string[];
}

// ─── ISummaryEngine ──────────────────────────────────────────────────────────
// Abstraction over summary generation. MVP: first-sentence extraction. Future: LLM summarizer.
export interface ISummaryEngine {
  /** Generate a single-line summary from post content. */
  generateSummary(content: string): string;
}
