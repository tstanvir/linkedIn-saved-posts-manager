/**
 * Vitest global setup — Chrome extension API mocks.
 *
 * Provides a minimal mock of `chrome.storage.local`, `chrome.runtime`,
 * `chrome.tabs`, and `chrome.scripting` so that unit tests can run
 * without a real browser extension environment.
 */

import { vi } from "vitest";

// ─── In-memory storage backend ──────────────────────────────────────────────
const storageBackend: Record<string, unknown> = {};

const storageMock = {
  local: {
    get: vi.fn((keys: string | string[], cb?: (result: Record<string, unknown>) => void) => {
      const keyArray = typeof keys === "string" ? [keys] : keys;
      const result: Record<string, unknown> = {};
      for (const key of keyArray) {
        if (key in storageBackend) result[key] = storageBackend[key];
      }
      if (cb) cb(result);
      return Promise.resolve(result);
    }),
    set: vi.fn((items: Record<string, unknown>, cb?: () => void) => {
      Object.assign(storageBackend, items);
      if (cb) cb();
      return Promise.resolve();
    }),
    remove: vi.fn((keys: string | string[], cb?: () => void) => {
      const keyArray = typeof keys === "string" ? [keys] : keys;
      for (const key of keyArray) delete storageBackend[key];
      if (cb) cb();
      return Promise.resolve();
    }),
    clear: vi.fn((cb?: () => void) => {
      for (const key of Object.keys(storageBackend)) delete storageBackend[key];
      if (cb) cb();
      return Promise.resolve();
    }),
  },
  session: {
    get: vi.fn(() => Promise.resolve({})),
    set: vi.fn(() => Promise.resolve()),
    remove: vi.fn(() => Promise.resolve()),
    clear: vi.fn(() => Promise.resolve()),
  },
};

// ─── Runtime mock ───────────────────────────────────────────────────────────
const listeners: Array<(msg: unknown, sender: unknown, sendResponse: (r: unknown) => void) => void> = [];

const runtimeMock = {
  sendMessage: vi.fn((_msg: unknown) => Promise.resolve()),
  onMessage: {
    addListener: vi.fn((fn: typeof listeners[0]) => listeners.push(fn)),
    removeListener: vi.fn((fn: typeof listeners[0]) => {
      const idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    }),
  },
  getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`),
};

// ─── Tabs mock ──────────────────────────────────────────────────────────────
const tabsMock = {
  query: vi.fn(() => Promise.resolve([])),
  create: vi.fn(() => Promise.resolve({ id: 1 })),
  update: vi.fn(() => Promise.resolve({})),
  sendMessage: vi.fn(() => Promise.resolve()),
  onUpdated: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
};

// ─── Scripting mock ─────────────────────────────────────────────────────────
const scriptingMock = {
  executeScript: vi.fn(() => Promise.resolve()),
};

// ─── Assemble global chrome object ──────────────────────────────────────────
const chromeMock = {
  storage: storageMock,
  runtime: runtimeMock,
  tabs: tabsMock,
  scripting: scriptingMock,
};

// Assign to globalThis so all modules see `chrome.*`
Object.assign(globalThis, { chrome: chromeMock });

// ─── Helpers for tests ──────────────────────────────────────────────────────

/** Reset all in-memory storage data between tests. */
export function resetStorage(): void {
  for (const key of Object.keys(storageBackend)) delete storageBackend[key];
}

/** Reset all mock call counts. */
export function resetAllMocks(): void {
  vi.clearAllMocks();
  resetStorage();
}

/** Directly read from the mock storage backend (for assertions). */
export function getStorageBackend(): Record<string, unknown> {
  return storageBackend;
}

/** Simulate dispatching a runtime message to all registered listeners. */
export function dispatchMessage(msg: unknown): Promise<unknown> {
  return new Promise((resolve) => {
    for (const listener of listeners) {
      listener(msg, {}, resolve);
    }
  });
}
