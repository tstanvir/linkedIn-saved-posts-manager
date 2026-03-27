/**
 * Migration script — moves post data from chrome.storage.local → IndexedDB.
 *
 * Runs once on first load after the storage migration. Handles:
 * - Reading existing posts from chrome.storage.local (old format)
 * - Writing them to IndexedDB via LocalPostStore
 * - Cleaning up the old storage key
 *
 * Safe to call multiple times — it's a no-op if migration already happened.
 */
import { STORAGE_KEY, StorageData, DEFAULT_POPUP_SIZE } from "../types";
import { db } from "./db";

const MIGRATION_FLAG = "lspm_migrated_to_idb";

// Dedup lock — ensures only one migration runs even if called concurrently
let migrating: Promise<boolean> | null = null;

/**
 * Check if migration is needed and perform it.
 * Returns true if migration was performed, false if already done or no data to migrate.
 */
export function migrateToIndexedDB(): Promise<boolean> {
  if (!migrating) {
    migrating = doMigrate().finally(() => { migrating = null; });
  }
  return migrating;
}

async function doMigrate(): Promise<boolean> {
  // Check if already migrated
  const flag = await new Promise<string | undefined>((resolve) => {
    chrome.storage.local.get(MIGRATION_FLAG, (result) => {
      resolve(result[MIGRATION_FLAG] as string | undefined);
    });
  });

  if (flag) return false; // Already migrated

  // Read old data from chrome.storage.local
  const oldData = await new Promise<StorageData | undefined>((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      resolve(result[STORAGE_KEY] as StorageData | undefined);
    });
  });

  if (!oldData || !oldData.posts || oldData.posts.length === 0) {
    // Nothing to migrate — set the flag and return
    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ [MIGRATION_FLAG]: new Date().toISOString() }, resolve);
    });
    return false;
  }

  // Write posts to IndexedDB
  await db.posts.bulkPut(oldData.posts);

  // Preserve settings in chrome.storage.local (popupSize stays there)
  // But remove the old posts data
  const settingsToKeep = {
    popupSize: oldData.popupSize ?? DEFAULT_POPUP_SIZE,
    lastScraped: oldData.lastScraped,
  };

  await new Promise<void>((resolve) => {
    chrome.storage.local.set(
      {
        lspm_settings: settingsToKeep,
        [MIGRATION_FLAG]: new Date().toISOString(),
      },
      resolve
    );
  });

  // Remove old key
  await new Promise<void>((resolve) => {
    chrome.storage.local.remove(STORAGE_KEY, resolve);
  });

  return true;
}
