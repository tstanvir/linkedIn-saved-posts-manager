import { MessageType } from "../shared/types";
import { loadStorage, saveStorage } from "../shared/storage";
import { mergePosts } from "../shared/merge";
import { KeywordTagEngine } from "../shared/engines/KeywordTagEngine";
import { FirstSentenceSummaryEngine } from "../shared/engines/FirstSentenceSummaryEngine";

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

    const response = await chrome.tabs.sendMessage(tabId, {
      type: "TRIGGER_SCRAPE",
    } satisfies MessageType) as MessageType;

    if (response.type === "SCRAPE_RESULT") {
      const tagEngine = new KeywordTagEngine();
      const summaryEngine = new FirstSentenceSummaryEngine();

      // Enrich new posts locally before merging
      for (const post of response.posts) {
        post.aiSummary = summaryEngine.generateSummary(post.content);
        post.aiTags = tagEngine.generateTags(post.content);
      }

      // Merge new posts with existing — never replace
      const existing = await loadStorage();
      const mergedPosts = mergePosts(existing.posts, response.posts);
      await saveStorage({
        posts: mergedPosts,
        lastScraped: new Date().toISOString(),
      });
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
  const data = await loadStorage();
  const updated = data.posts.filter((p) => p.id !== postId);
  await saveStorage({ posts: updated });
  sendResponse({ type: "POSTS_RESPONSE", posts: updated, lastScraped: data.lastScraped });
}

// ─── Return stored posts to popup ─────────────────────────────────────────────
async function handleGetPosts(
  sendResponse: (msg: MessageType) => void
): Promise<void> {
  const data = await loadStorage();
  sendResponse({
    type: "POSTS_RESPONSE",
    posts: data.posts,
    lastScraped: data.lastScraped,
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

function waitForTabLoad(tabId: number): Promise<void> {
  return new Promise((resolve) => {
    const listener = (
      id: number,
      _info: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab
    ) => {
      if (id === tabId && tab.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
}
