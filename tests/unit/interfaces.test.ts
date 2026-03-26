/**
 * Interface conformance test — verifies that the core interfaces
 * are properly typed and importable. This is a compile-time safety net.
 */
import { describe, it, expect } from "vitest";
import type { IPostStore, ITagEngine, ISummaryEngine } from "../../src/shared/interfaces";
import type { Post } from "../../src/shared/types";

describe("Core Interfaces", () => {
  it("IPostStore should define all required methods", () => {
    // Type-level test: a conforming object must implement all methods.
    const store: IPostStore = {
      getAll: async () => [],
      getById: async (_id: string) => undefined,
      upsertMany: async (posts: Post[]) => posts,
      deleteById: async (_id: string) => {},
      search: async (_query: string) => [],
      filterByTag: async (_tag: string) => [],
    };
    expect(store).toBeDefined();
    expect(typeof store.getAll).toBe("function");
    expect(typeof store.getById).toBe("function");
    expect(typeof store.upsertMany).toBe("function");
    expect(typeof store.deleteById).toBe("function");
    expect(typeof store.search).toBe("function");
    expect(typeof store.filterByTag).toBe("function");
  });

  it("ITagEngine should define generateTags", () => {
    const engine: ITagEngine = {
      generateTags: (_content: string) => [],
    };
    expect(typeof engine.generateTags).toBe("function");
  });

  it("ISummaryEngine should define generateSummary", () => {
    const engine: ISummaryEngine = {
      generateSummary: (_content: string) => "",
    };
    expect(typeof engine.generateSummary).toBe("function");
  });
});
