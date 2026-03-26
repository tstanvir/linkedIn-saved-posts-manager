import { StorageData, STORAGE_KEY, DEFAULT_POPUP_SIZE } from "./types";

export async function loadStorage(): Promise<StorageData> {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const data = result[STORAGE_KEY] as StorageData | undefined;
      resolve(
        data ?? {
          posts: [],
          lastScraped: null,
          popupSize: DEFAULT_POPUP_SIZE,
        }
      );
    });
  });
}

export async function saveStorage(data: Partial<StorageData>): Promise<void> {
  const existing = await loadStorage();
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: { ...existing, ...data } }, resolve);
  });
}
