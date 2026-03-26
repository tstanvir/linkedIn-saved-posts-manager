/**
 * Tests for FirstSentenceSummaryEngine — extractive summarization.
 */
import { describe, it, expect } from "vitest";
import { FirstSentenceSummaryEngine } from "../../src/shared/engines/FirstSentenceSummaryEngine";

describe("FirstSentenceSummaryEngine", () => {
  const engine = new FirstSentenceSummaryEngine();

  it("should extract the first sentence", () => {
    const summary = engine.generateSummary(
      "This is the first sentence. Here is the second sentence. And a third."
    );
    expect(summary).toBe("This is the first sentence.");
  });

  it("should handle exclamation marks as sentence terminators", () => {
    const summary = engine.generateSummary(
      "Breaking news! The market is up."
    );
    expect(summary).toBe("Breaking news!");
  });

  it("should handle question marks as sentence terminators", () => {
    const summary = engine.generateSummary(
      "Why do we build? Because we can."
    );
    expect(summary).toBe("Why do we build?");
  });

  it("should truncate at word boundary for long sentences", () => {
    const longSentence = "This is a very long sentence that goes on and on and on with many words and keeps going without any punctuation to break it up something something blah blah more words etc etc";
    const summary = engine.generateSummary(longSentence);
    expect(summary.length).toBeLessThanOrEqual(121); // 120 + "…"
    expect(summary.endsWith("…")).toBe(true);
  });

  it("should strip leading emojis", () => {
    const summary = engine.generateSummary(
      "🚀🔥 Excited to announce our new product launch."
    );
    expect(summary).toBe("Excited to announce our new product launch.");
  });

  it("should strip leading bullet points", () => {
    const summary = engine.generateSummary(
      "• Key insight from today's conference."
    );
    expect(summary).toBe("Key insight from today's conference.");
  });

  it("should handle empty content", () => {
    expect(engine.generateSummary("")).toBe("");
    expect(engine.generateSummary("   ")).toBe("");
  });

  it("should return short content as-is", () => {
    const summary = engine.generateSummary("Short post");
    expect(summary).toBe("Short post");
  });

  it("should handle content with no sentence terminators", () => {
    const summary = engine.generateSummary("A post with no ending punctuation at all");
    expect(summary).toBe("A post with no ending punctuation at all");
  });
});
