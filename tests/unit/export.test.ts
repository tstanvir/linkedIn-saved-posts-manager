/**
 * Tests for CSV and JSON export utilities.
 */
import { describe, it, expect } from "vitest";
import { exportToCsv, exportToJson } from "../../src/shared/export";
import { POST_FULL, POST_MINIMAL, SAMPLE_POSTS } from "../fixtures/sample-posts";

describe("exportToCsv", () => {
  it("should produce valid CSV with headers", () => {
    const csv = exportToCsv([POST_FULL]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("id,author,authorHeadline,content,url,postedAt,scrapedAt,tags,aiSummary,aiTags");
    expect(lines).toHaveLength(2); // header + 1 data row
  });

  it("should escape fields with commas", () => {
    const post = { ...POST_FULL, content: "Hello, world, test" };
    const csv = exportToCsv([post]);
    // The content field with commas should be wrapped in quotes
    expect(csv).toContain('"Hello, world, test"');
  });

  it("should escape fields with double quotes", () => {
    const post = { ...POST_FULL, author: 'John "The Dev" Doe' };
    const csv = exportToCsv([post]);
    expect(csv).toContain('"John ""The Dev"" Doe"');
  });

  it("should handle empty posts array", () => {
    const csv = exportToCsv([]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(1); // headers only
  });

  it("should handle multiple posts", () => {
    const csv = exportToCsv(SAMPLE_POSTS);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(SAMPLE_POSTS.length + 1); // header + data rows
  });

  it("should join tags with semicolons", () => {
    const csv = exportToCsv([POST_FULL]);
    expect(csv).toContain("#ai; #machinelearning");
  });

  it("should handle missing AI fields gracefully", () => {
    const csv = exportToCsv([POST_MINIMAL]);
    // aiSummary and aiTags should be empty strings
    const lines = csv.split("\n");
    const dataRow = lines[1];
    // Last two fields should be empty
    expect(dataRow.endsWith(",")).toBe(true);
  });
});

describe("exportToJson", () => {
  it("should produce valid JSON", () => {
    const json = exportToJson([POST_FULL]);
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe(POST_FULL.id);
  });

  it("should be pretty-printed", () => {
    const json = exportToJson([POST_FULL]);
    expect(json).toContain("\n");
    expect(json).toContain("  ");
  });

  it("should handle empty array", () => {
    const json = exportToJson([]);
    expect(JSON.parse(json)).toEqual([]);
  });

  it("should preserve all fields", () => {
    const json = exportToJson(SAMPLE_POSTS);
    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(SAMPLE_POSTS.length);
    // Check AI-enriched post has its fields
    const enriched = parsed.find((p: { id: string }) => p.id === "urn:li:activity:7100000000000000005");
    expect(enriched?.aiSummary).toBeDefined();
    expect(enriched?.aiTags).toBeDefined();
  });
});
