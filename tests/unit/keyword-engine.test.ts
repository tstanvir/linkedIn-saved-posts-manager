/**
 * Tests for KeywordTagEngine — hashtag extraction + TF-IDF keyword extraction.
 */
import { describe, it, expect } from "vitest";
import { KeywordTagEngine } from "../../src/shared/engines/KeywordTagEngine";

describe("KeywordTagEngine", () => {
  const engine = new KeywordTagEngine();

  it("should extract hashtags from content", () => {
    const tags = engine.generateTags("Building great products with #React and #TypeScript");
    expect(tags).toContain("react");
    expect(tags).toContain("typeScript");
  });

  it("should extract keywords when no hashtags present", () => {
    const tags = engine.generateTags(
      "Machine learning models are transforming healthcare diagnostics and patient outcomes"
    );
    expect(tags.length).toBeGreaterThan(0);
    expect(tags.length).toBeLessThanOrEqual(5);
    // Should include meaningful terms, not stop words
    expect(tags.some((t) => ["machine", "learning", "healthcare", "diagnostics", "patient", "models", "outcomes", "transforming"].includes(t))).toBe(true);
  });

  it("should prioritize hashtags over keywords", () => {
    const tags = engine.generateTags(
      "#python is great for data science. I love Python programming and data analysis."
    );
    // #python should appear first
    expect(tags[0]).toBe("python");
  });

  it("should deduplicate between hashtags and keywords", () => {
    const tags = engine.generateTags(
      "#react React React React development framework"
    );
    const reactCount = tags.filter((t) => t === "react").length;
    expect(reactCount).toBe(1);
  });

  it("should return max 5 tags", () => {
    const tags = engine.generateTags(
      "#one #two #three #four #five #six #seven"
    );
    expect(tags.length).toBeLessThanOrEqual(5);
  });

  it("should handle empty content", () => {
    const tags = engine.generateTags("");
    expect(tags).toEqual([]);
  });

  it("should handle content with only stop words", () => {
    const tags = engine.generateTags("the and or but for with");
    expect(tags).toEqual([]);
  });

  it("should handle unicode hashtags", () => {
    const tags = engine.generateTags("Great #café culture in #résumé writing");
    expect(tags).toContain("café");
    expect(tags).toContain("résumé");
  });

  it("should enforce camelCasing on tags", () => {
    const tags = engine.generateTags("#JavaScript engineering DEVELOPMENT");
    expect(tags).toContain("javaScript");
    expect(tags).toContain("engineering");
    expect(tags).toContain("development");
  });
});
