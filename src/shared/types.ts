export interface Post {
  id: string;
  author: string;
  authorHeadline: string;
  authorAvatar: string;
  content: string;
  url: string;
  postedAt: string;
  scrapedAt: string;
  tags: string[];          // extracted from #hashtags in content
  aiSummary?: string;      // AI-generated single-line summary
  aiTags?: string[];       // AI-generated contextual tags (no # prefix)
  aiEnrichedAt?: string;   // ISO timestamp; set after enrichment to skip re-processing
}

export interface StorageData {
  posts: Post[];
  lastScraped: string | null;
  popupSize: { width: number; height: number };
}

export type MessageType =
  | { type: "TRIGGER_SCRAPE" }
  | { type: "SCRAPE_RESULT"; posts: Post[] }
  | { type: "SCRAPE_ERROR"; error: string }
  | { type: "GET_POSTS" }
  | { type: "POSTS_RESPONSE"; posts: Post[]; lastScraped: string | null }
  | { type: "SCRAPING_STATUS"; status: "idle" | "scraping" | "done" | "error"; message?: string }
  | { type: "DELETE_POST"; postId: string };

export const STORAGE_KEY = "lspm_data";
export const DEFAULT_POPUP_SIZE = { width: 480, height: 600 };
export const MIN_POPUP_SIZE = { width: 360, height: 400 };
export const MAX_POPUP_SIZE = { width: 800, height: 900 };
