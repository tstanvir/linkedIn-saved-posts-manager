/**
 * Tests for the chrome.storage.local → IndexedDB migration.
 */
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { resetAllMocks, getStorageBackend } from "../setup";
import { migrateToIndexedDB } from "../../src/shared/store/migration";
import { db } from "../../src/shared/store/db";
import { STORAGE_KEY } from "../../src/shared/types";
import { POST_FULL, POST_MINIMAL } from "../fixtures/sample-posts";

describe("migrateToIndexedDB", () => {
  beforeEach(async () => {
    resetAllMocks();
    await db.posts.clear();
  });

  it("should migrate posts from chrome.storage.local to IndexedDB", async () => {
    // Set up old-format data in chrome.storage.local
    const backend = getStorageBackend();
    backend[STORAGE_KEY] = {
      posts: [POST_FULL, POST_MINIMAL],
      lastScraped: "2026-03-20T12:00:00.000Z",
      popupSize: { width: 480, height: 600 },
      groqApiKey: null,
    };

    const migrated = await migrateToIndexedDB();
    expect(migrated).toBe(true);

    // Verify posts are in IndexedDB
    const posts = await db.posts.toArray();
    expect(posts).toHaveLength(2);
    expect(posts.find((p) => p.id === POST_FULL.id)).toBeDefined();
  });

  it("should not run again if already migrated", async () => {
    const backend = getStorageBackend();
    backend["lspm_migrated_to_idb"] = "2026-03-20T12:00:00.000Z";

    const migrated = await migrateToIndexedDB();
    expect(migrated).toBe(false);
  });

  it("should handle empty storage gracefully", async () => {
    const migrated = await migrateToIndexedDB();
    expect(migrated).toBe(false);
  });

  it("should remove old storage key after migration", async () => {
    const backend = getStorageBackend();
    backend[STORAGE_KEY] = {
      posts: [POST_FULL],
      lastScraped: null,
      popupSize: { width: 480, height: 600 },
      groqApiKey: null,
    };

    await migrateToIndexedDB();
    expect(backend[STORAGE_KEY]).toBeUndefined();
  });

  it("should preserve settings in chrome.storage.local", async () => {
    const backend = getStorageBackend();
    backend[STORAGE_KEY] = {
      posts: [POST_FULL],
      lastScraped: "2026-03-20T12:00:00.000Z",
      popupSize: { width: 500, height: 700 },
      groqApiKey: null,
    };

    await migrateToIndexedDB();
    const settings = backend["lspm_settings"] as { popupSize: { width: number; height: number }; lastScraped: string };
    expect(settings.popupSize).toEqual({ width: 500, height: 700 });
    expect(settings.lastScraped).toBe("2026-03-20T12:00:00.000Z");
  });
});
