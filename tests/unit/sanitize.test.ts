/**
 * Tests for content sanitization — XSS prevention.
 */
import { describe, it, expect } from "vitest";
import { sanitizeText, sanitizeUrl } from "../../src/shared/sanitize";

describe("sanitizeText", () => {
  it("should strip HTML tags", () => {
    const result = sanitizeText("Hello <b>world</b>");
    expect(result).toBe("Hello world");
  });

  it("should strip script tags and content", () => {
    const result = sanitizeText("Safe text <script>alert('xss')</script> more text");
    expect(result).toBe("Safe text alert('xss') more text");
  });

  it("should remove event handlers", () => {
    const result = sanitizeText('Nice <img onerror="alert(1)" src="x"> image');
    expect(result).not.toContain("onerror");
  });

  it("should remove javascript: scheme", () => {
    const result = sanitizeText("Click javascript:alert(1) here");
    expect(result).not.toContain("javascript:");
  });

  it("should remove data: scheme", () => {
    const result = sanitizeText("data:text/html,<script>alert(1)</script>");
    expect(result).not.toContain("data:");
  });

  it("should remove vbscript: scheme", () => {
    const result = sanitizeText("vbscript:msgbox(1)");
    expect(result).not.toContain("vbscript:");
  });

  it("should decode HTML entities", () => {
    const result = sanitizeText("Tom &amp; Jerry &lt;3");
    expect(result).toBe("Tom & Jerry <3");
  });

  it("should normalize whitespace", () => {
    const result = sanitizeText("Too    much   \n  whitespace");
    expect(result).toBe("Too much whitespace");
  });

  it("should handle empty string", () => {
    expect(sanitizeText("")).toBe("");
  });

  it("should handle null-ish input", () => {
    expect(sanitizeText(undefined as unknown as string)).toBe("");
  });

  it("should handle nested XSS attempts", () => {
    const result = sanitizeText('<div onmouseover="alert(1)"><img src=x onerror="alert(2)">text</div>');
    expect(result).not.toContain("alert");
    expect(result).not.toContain("onerror");
    expect(result).not.toContain("onmouseover");
    expect(result).toContain("text");
  });

  it("should handle real LinkedIn post content safely", () => {
    const content = `Building the future of #AI and #MachineLearning — here's what I learned scaling our inference pipeline to 10M requests/day.`;
    const result = sanitizeText(content);
    expect(result).toBe(content);
  });
});

describe("sanitizeUrl", () => {
  it("should allow https URLs", () => {
    expect(sanitizeUrl("https://www.linkedin.com/post/123")).toBe("https://www.linkedin.com/post/123");
  });

  it("should allow http URLs", () => {
    expect(sanitizeUrl("http://example.com")).toBe("http://example.com");
  });

  it("should allow chrome-extension URLs", () => {
    expect(sanitizeUrl("chrome-extension://abcd/page.html")).toBe("chrome-extension://abcd/page.html");
  });

  it("should reject javascript: URLs", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBe("");
  });

  it("should reject data: URLs", () => {
    expect(sanitizeUrl("data:text/html,<script>")).toBe("");
  });

  it("should handle empty URL", () => {
    expect(sanitizeUrl("")).toBe("");
  });

  it("should trim whitespace", () => {
    expect(sanitizeUrl("  https://example.com  ")).toBe("https://example.com");
  });
});
