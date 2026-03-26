/**
 * Tests for getStableId — ensures post IDs are content-independent
 * and deterministic across scraping sessions.
 */
import { describe, it, expect } from "vitest";
import { getStableId } from "../../src/shared/merge";

describe("getStableId", () => {
  it("should prefer URN when available", () => {
    const id = getStableId(
      "urn:li:activity:7100000000000000001",
      "https://www.linkedin.com/feed/update/urn:li:activity:7100000000000000001/"
    );
    expect(id).toBe("urn:li:activity:7100000000000000001");
  });

  it("should extract URN from URL when URN is empty", () => {
    const id = getStableId(
      "",
      "https://www.linkedin.com/feed/update/urn:li:activity:7100000000000000001/"
    );
    expect(id).toBe("urn:li:activity:7100000000000000001");
  });

  it("should use URL as fallback when no URN is extractable", () => {
    const id = getStableId("", "https://www.linkedin.com/some-other-page/");
    expect(id).toBe("https://www.linkedin.com/some-other-page/");
  });

  it("should generate a unique fallback for empty inputs", () => {
    const id = getStableId("", "");
    expect(id).toMatch(/^unknown-\d+$/);
  });

  it("should be stable — same inputs always produce same output", () => {
    const urn = "urn:li:activity:123456";
    const url = "https://www.linkedin.com/feed/update/urn:li:activity:123456/";
    const id1 = getStableId(urn, url);
    const id2 = getStableId(urn, url);
    expect(id1).toBe(id2);
  });

  it("should be content-independent — different content, same URN = same ID", () => {
    const urn = "urn:li:activity:123456";
    // Content is NOT a parameter of getStableId — this test just confirms the API
    const id = getStableId(urn, "");
    expect(id).toBe("urn:li:activity:123456");
  });

  it("should handle ugcPost URNs", () => {
    const id = getStableId("urn:li:ugcPost:7100000000000000001", "");
    expect(id).toBe("urn:li:ugcPost:7100000000000000001");
  });
});
