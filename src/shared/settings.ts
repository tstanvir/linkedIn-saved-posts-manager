/**
 * Settings module — reads/writes non-post settings from chrome.storage.local.
 *
 * Posts live in IndexedDB (via LocalPostStore). Only lightweight settings
 * (lastScraped, popupSize) remain in chrome.storage.local.
 *
 * The key "lspm_settings" matches what migration.ts writes during the
 * chrome.storage.local → IndexedDB migration.
 */
import { DEFAULT_POPUP_SIZE } from "./types";

const SETTINGS_KEY = "lspm_settings";

export interface Settings {
  lastScraped: string | null;
  popupSize: { width: number; height: number };
}

const DEFAULTS: Settings = {
  lastScraped: null,
  popupSize: DEFAULT_POPUP_SIZE,
};

export async function loadSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    chrome.storage.local.get(SETTINGS_KEY, (result) => {
      const data = result[SETTINGS_KEY] as Partial<Settings> | undefined;
      resolve({ ...DEFAULTS, ...data });
    });
  });
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  return new Promise((resolve) => {
    // Atomic read-modify-write within a single callback to avoid race conditions
    chrome.storage.local.get(SETTINGS_KEY, (result) => {
      const data = result[SETTINGS_KEY] as Partial<Settings> | undefined;
      const merged = { ...DEFAULTS, ...data, ...patch };
      chrome.storage.local.set({ [SETTINGS_KEY]: merged }, resolve);
    });
  });
}
