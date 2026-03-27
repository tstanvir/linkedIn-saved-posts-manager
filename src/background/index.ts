import { MessageType } from "../shared/types";
import { postStore } from "../shared/store";
import { loadSettings, saveSettings } from "../shared/settings";
import { mergePosts } from "../shared/merge";
import { KeywordTagEngine } from "../shared/engines/KeywordTagEngine";
import { FirstSentenceSummaryEngine } from "../shared/engines/FirstSentenceSummaryEngine";
import { migrateToIndexedDB } from "../shared/store/migration";

// Maximum time (ms) to wait for the content script to finish scraping.
// At ~1 500 ms per scroll tick × 50 ticks for ~1 000 posts this is tight;
// users with very large collections will see a friendly timeout error.
const SCRAPE_TIMEOUT_MS = 90_000;

// ─── Migration ────────────────────────────────────────────────────────────────
// Run on install/update so existing users' posts move from chrome.storage.local
// into IndexedDB. Safe to call multiple times — it's a no-op after the first run.
chrome.runtime.onInstalled.addListener(async () => {
  await migrateToIndexedDB();
});
// Safety net: also run on every service worker startup (idempotent, cheap flag check)
migrateToIndexedDB().catch((e) => console.error("[LSPM] migration error:", e));

// ─── Message routing ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg: MessageType, _sender, sendResponse) => {
  if (msg.type === "TRIGGER_SCRAPE") {
    handleTriggerScrape(sendResponse);
    return true;
  }
  if (msg.type === "GET_POSTS") {
    handleGetPosts(sendResponse);
    return true;
  }
  if (msg.type === "DELETE_POST") {
    handleDeletePost(msg.postId, sendResponse);
    return true;
  }
});

// ─── Trigger content script to scrape LinkedIn ───────────────────────────────
async function handleTriggerScrape(
  sendResponse: (msg: MessageType) => void
): Promise<void> {
  broadcastStatus("scraping");

  try {
    const tabs = await chrome.tabs.query({
      url: "https://www.linkedin.com/my-items/saved-posts*",
    });

    let tabId: number;

    if (tabs.length > 0 && tabs[0].id != null) {
      tabId = tabs[0].id;
      await chrome.tabs.update(tabId, { active: true });
      await chrome.tabs.reload(tabId);
      await waitForTabLoad(tabId);
    } else {
      const newTab = await chrome.tabs.create({
        url: "https://www.linkedin.com/my-items/saved-posts",
        active: true,
      });
      tabId = newTab.id!;
      await waitForTabLoad(tabId);
    }

    // Wait slightly to ensure run_at: document_idle has fired
    await new Promise((r) => setTimeout(r, 800));

    const response = await scrapeWithTimeout(tabId);

    if (response.type === "SCRAPE_RESULT") {
      const tagEngine = new KeywordTagEngine();
      const summaryEngine = new FirstSentenceSummaryEngine();

      // Enrich new posts locally before merging (skip already-enriched)
      for (const post of response.posts) {
        if (!post.aiEnrichedAt) {
          post.aiSummary = summaryEngine.generateSummary(post.content);
          post.aiTags = tagEngine.generateTags(post.content);
          post.aiEnrichedAt = new Date().toISOString();
        }
      }

      // Merge new posts with existing — never replace
      const existingPosts = await postStore.getAll();
      const mergedPosts = mergePosts(existingPosts, response.posts);

      // Persist to IndexedDB + update settings
      await postStore.upsertMany(mergedPosts);
      await saveSettings({ lastScraped: new Date().toISOString() });

      broadcastStatus("done");
      sendResponse({ type: "SCRAPE_RESULT", posts: mergedPosts });
    } else if (response.type === "SCRAPE_ERROR") {
      broadcastStatus("error", response.error);
      sendResponse({ type: "SCRAPE_ERROR", error: response.error });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    broadcastStatus("error", message);
    sendResponse({ type: "SCRAPE_ERROR", error: message });
  }
}

// ─── Delete a single post from storage ───────────────────────────────────────
async function handleDeletePost(
  postId: string,
  sendResponse: (msg: MessageType) => void
): Promise<void> {
  await postStore.deleteById(postId);
  const [posts, settings] = await Promise.all([postStore.getAll(), loadSettings()]);
  sendResponse({ type: "POSTS_RESPONSE", posts, lastScraped: settings.lastScraped });
}

// ─── Return stored posts to popup ─────────────────────────────────────────────
async function handleGetPosts(
  sendResponse: (msg: MessageType) => void
): Promise<void> {
  const [posts, settings] = await Promise.all([postStore.getAll(), loadSettings()]);
  sendResponse({
    type: "POSTS_RESPONSE",
    posts,
    lastScraped: settings.lastScraped,
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function broadcastStatus(
  status: "idle" | "scraping" | "done" | "error",
  message?: string
): void {
  chrome.runtime.sendMessage({
    type: "SCRAPING_STATUS",
    status,
    message,
  } satisfies MessageType).catch(() => { /* popup may not be open */ });
}

/**
 * Send TRIGGER_SCRAPE to the content script with a hard timeout.
 * If LinkedIn takes longer than SCRAPE_TIMEOUT_MS to load all posts,
 * the promise rejects with a descriptive, user-facing error message.
 */
async function scrapeWithTimeout(tabId: number): Promise<MessageType> {
  return Promise.race([
    chrome.tabs.sendMessage(tabId, {
      type: "TRIGGER_SCRAPE",
    } satisfies MessageType) as Promise<MessageType>,
    new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              "Sync timed out — LinkedIn took too long to load all your saved posts. " +
              "You likely have more posts than can be loaded in one sync. " +
              "Try again, or remove some posts directly on LinkedIn to reduce the total."
            )
          ),
        SCRAPE_TIMEOUT_MS
      )
    ),
  ]);
}

function waitForTabLoad(tabId: number, timeoutMs = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error("Tab load timed out after 30s"));
    }, timeoutMs);

    const listener = (
      id: number,
      _info: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab
    ) => {
      if (id === tabId && tab.status === "complete") {
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
}
