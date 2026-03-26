/**
 * Skeleton test — verifies the test infrastructure works.
 * Phase 0 deliverable: proves Vitest + Chrome mocks are functional.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { resetAllMocks, getStorageBackend } from "../setup";

describe("Test Infrastructure", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it("should have chrome global available", () => {
    expect(globalThis.chrome).toBeDefined();
    expect(chrome.storage).toBeDefined();
    expect(chrome.runtime).toBeDefined();
    expect(chrome.tabs).toBeDefined();
  });

  it("should mock chrome.storage.local.set and get", async () => {
    await chrome.storage.local.set({ testKey: "testValue" });
    const backend = getStorageBackend();
    expect(backend.testKey).toBe("testValue");
  });

  it("should mock chrome.storage.local.get with callback", async () => {
    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ foo: "bar" }, () => {
        chrome.storage.local.get("foo", (result) => {
          expect(result.foo).toBe("bar");
          resolve();
        });
      });
    });
  });

  it("should reset storage between tests", () => {
    const backend = getStorageBackend();
    expect(Object.keys(backend)).toHaveLength(0);
  });

  it("should mock chrome.runtime.getURL", () => {
    const url = chrome.runtime.getURL("dashboard.html");
    expect(url).toContain("dashboard.html");
  });
});
