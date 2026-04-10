import { MessageType } from "../shared/types";
import { postStore } from "../shared/store";
import { loadSettings, saveSettings } from "../shared/settings";
import { mergePosts } from "../shared/merge";
import { KeywordTagEngine } from "../shared/engines/KeywordTagEngine";
import { FirstSentenceSummaryEngine } from "../shared/engines/FirstSentenceSummaryEngine";
import { migrateToIndexedDB } from "../shared/store/migration";

// Maximum time (ms) to wait for the content script to finish scraping.
// 5 minutes covers ~1 200+ posts: ~50 scroll ticks × 1 000 ms + enrichment overhead.
const SCRAPE_TIMEOUT_MS = 300_000;

// ─── Migration ────────────────────────────────────────────────────────────────
// Run on install/update so existing users' posts move from chrome.storage.local
// into IndexedDB. Safe to call multiple times — it's a no-op after the first run.
chrome.runtime.onInstalled.addListener(async () => {
  await migrateToIndexedDB();
});
// Safety net: also run on every service worker startup (idempotent, cheap flag check)
migrateToIndexedDB().catch((e) => console.error("[LSPM] migration error:", e));

// ─── Service worker keepalive ─────────────────────────────────────────────────
// MV3 service workers can be terminated by Chrome during long idle periods.
// We create a repeating alarm before a long scrape and clear it when done.
const KEEPALIVE_ALARM = "lspm_keepalive";
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === KEEPALIVE_ALARM) {
    // No-op — firing the alarm is enough to keep the service worker alive.
  }
});

function startKeepalive(): void {
  chrome.alarms.create(KEEPALIVE_ALARM, { periodInMinutes: 0.4 }); // every ~24 s
}

function stopKeepalive(): void {
  chrome.alarms.clear(KEEPALIVE_ALARM);
}

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
  startKeepalive();

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

      stopKeepalive();
      broadcastStatus("done");
      sendResponse({ type: "SCRAPE_RESULT", posts: mergedPosts });
    } else if (response.type === "SCRAPE_ERROR") {
      stopKeepalive();
      broadcastStatus("error", response.error);
      sendResponse({ type: "SCRAPE_ERROR", error: response.error });
    }
  } catch (err) {
    stopKeepalive();
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
