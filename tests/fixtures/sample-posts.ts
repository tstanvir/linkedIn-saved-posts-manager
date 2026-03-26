/**
 * Sample Post objects for use in unit tests.
 */
import { Post } from "../../src/shared/types";

/** A fully populated post with all fields. */
export const POST_FULL: Post = {
  id: "urn:li:activity:7100000000000000001",
  author: "John Doe",
  authorHeadline: "Senior Software Engineer at Acme Corp",
  authorAvatar: "https://media.licdn.com/avatar/johndoe.jpg",
  content:
    "Building the future of #AI and #MachineLearning — here's what I learned scaling our inference pipeline to 10M requests/day. Key takeaway: batching is everything.",
  url: "https://www.linkedin.com/feed/update/urn:li:activity:7100000000000000001/",
  postedAt: "2d",
  scrapedAt: "2026-03-20T12:00:00.000Z",
  tags: ["#ai", "#machinelearning"],
};

/** A post with no hashtags, no avatar, no headline. */
export const POST_MINIMAL: Post = {
  id: "urn:li:activity:7100000000000000002",
  author: "Jane Doe",
  authorHeadline: "",
  authorAvatar: "",
  content: "Interesting thoughts on remote work culture and productivity in 2025.",
  url: "https://www.linkedin.com/feed/update/urn:li:activity:7100000000000000002/",
  postedAt: "1w",
  scrapedAt: "2026-03-19T08:30:00.000Z",
  tags: [],
};

/** A post with AI enrichment already applied. */
export const POST_AI_ENRICHED: Post = {
  ...POST_FULL,
  id: "urn:li:activity:7100000000000000005",
  aiSummary: "Scaling inference pipelines with batching for 10M daily requests.",
  aiTags: ["inference", "scaling", "machine-learning", "batching"],
  aiEnrichedAt: "2026-03-20T14:00:00.000Z",
};

/** A post with very long content (for summary/truncation tests). */
export const POST_LONG_CONTENT: Post = {
  id: "urn:li:activity:7100000000000000006",
  author: "Long Writer",
  authorHeadline: "Content Creator",
  authorAvatar: "",
  content:
    "This is the first sentence of a very long post. " +
    "Here comes the second sentence with more details about the topic. " +
    "And a third sentence that elaborates further. " +
    "The fourth sentence dives into specifics. " +
    "Fifth sentence wraps up with a conclusion. " +
    "Sixth sentence adds a call to action. " +
    "Seventh sentence is just padding to make this really long. " +
    "Eighth sentence continues the padding theme. " +
    "Ninth sentence is almost done. " +
    "Tenth sentence is the final one in this long post.",
  url: "https://www.linkedin.com/feed/update/urn:li:activity:7100000000000000006/",
  postedAt: "3d",
  scrapedAt: "2026-03-18T10:00:00.000Z",
  tags: [],
};

/** Array of sample posts for batch/list operation tests. */
export const SAMPLE_POSTS: Post[] = [
  POST_FULL,
  POST_MINIMAL,
  POST_AI_ENRICHED,
  POST_LONG_CONTENT,
];
