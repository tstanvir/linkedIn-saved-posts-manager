/**
 * Export utility — converts post data to CSV and JSON formats.
 *
 * Pure functions, no DOM dependency. Testable in Node.
 */
import { Post } from "./types";

/**
 * Export posts to CSV format.
 * Includes all core fields; AI fields are included when present.
 */
export function exportToCsv(posts: Post[]): string {
  const headers = [
    "id",
    "author",
    "authorHeadline",
    "content",
    "url",
    "postedAt",
    "scrapedAt",
    "tags",
    "aiSummary",
    "aiTags",
  ];

  const escapeField = (value: string): string => {
    // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const rows = posts.map((post) =>
    [
      post.id,
      post.author,
      post.authorHeadline,
      post.content,
      post.url,
      post.postedAt,
      post.scrapedAt,
      post.tags.join("; "),
      post.aiSummary ?? "",
      (post.aiTags ?? []).join("; "),
    ]
      .map(escapeField)
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Export posts to pretty-printed JSON.
 */
export function exportToJson(posts: Post[]): string {
  return JSON.stringify(posts, null, 2);
}

/**
 * Trigger a browser file download for the given content.
 * This is the only DOM-dependent function in this module.
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
