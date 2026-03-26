import { Post, MessageType } from "../shared/types";
import { getStableId } from "../shared/merge";

const LOG = (...args: unknown[]) => console.log("[LSPM]", ...args);

// ─── Hashtag extractor ────────────────────────────────────────────────────────
function extractTags(text: string): string[] {
  const matches = text.match(/#[\w\u00C0-\u024F]+/g) ?? [];
  return [...new Set(matches.map((t) => t.toLowerCase()))];
}

// ─── Wait for elements matching selector to appear ───────────────────────────
function waitForElement(selector: string, timeout = 15000): Promise<Element | null> {
  return new Promise((resolve) => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);

    const observer = new MutationObserver(() => {
      const found = document.querySelector(selector);
      if (found) {
        observer.disconnect();
        resolve(found);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

// ─── Scroll to load all posts ─────────────────────────────────────────────────
async function scrollToBottom(): Promise<void> {
  return new Promise((resolve) => {
    let lastHeight = 0;
    let stableCount = 0;
    const MAX_STABLE = 5;

    const tick = () => {
      window.scrollTo(0, document.body.scrollHeight);
      const currentHeight = document.body.scrollHeight;
      if (currentHeight === lastHeight) {
        stableCount++;
        if (stableCount >= MAX_STABLE) {
          resolve();
          return;
        }
      } else {
        stableCount = 0;
        lastHeight = currentHeight;
      }
      setTimeout(tick, 1500);
    };

    tick();
  });
}

// ─── Build LinkedIn activity URL from URN ─────────────────────────────────────
function urnToUrl(urn: string): string {
  // urn:li:activity:123 → https://www.linkedin.com/feed/update/urn:li:activity:123/
  if (urn.startsWith("urn:li:")) {
    return `https://www.linkedin.com/feed/update/${urn}/`;
  }
  return window.location.href;
}

// ─── First non-empty text from a list of selectors ───────────────────────────
function firstText(root: Element, selectors: string[]): string {
  for (const sel of selectors) {
    try {
      const text = root.querySelector(sel)?.textContent?.trim();
      if (text) return text;
    } catch { /* skip invalid selector */ }
  }
  return "";
}


// ─── Parse a single entity-result card ───────────────────────────────────────
function parseCard(card: Element): Post | null {
  try {
    const urn = card.getAttribute("data-chameleon-result-urn") ?? "";
    const url = urnToUrl(urn) ||
      (card.querySelector<HTMLAnchorElement>("a[href*='/feed/update/'], a[href*='activity']")?.href ?? window.location.href);

    // Author — name is in span[dir="ltr"] > span[aria-hidden="true"] inside the /in/ profile link
    const author = firstText(card, [
      "a[href*='/in/'] span[dir='ltr'] span[aria-hidden='true']",
      ".entity-result__title-text a span[aria-hidden='true']",
      ".update-components-actor__name span[aria-hidden='true']",
    ]) || card.querySelector<HTMLImageElement>(".presence-entity__image")?.alt || "";

    // Headline — stable utility classes t-14 t-black t-normal inside linked-area
    const authorHeadline = firstText(card, [
      ".linked-area .t-14.t-black.t-normal",
      ".entity-result__primary-subtitle",
      ".update-components-actor__description span[aria-hidden='true']",
    ]);

    const authorAvatar =
      card.querySelector<HTMLImageElement>(".presence-entity__image")?.src ||
      card.querySelector<HTMLImageElement>(".entity-result__content-image img")?.src ||
      "";

    // Post body — entity-result__content-summary or entity-result__summary holds the post excerpt
    let content = firstText(card, [
      ".entity-result__content-summary",
      ".entity-result__summary--2-lines",
      ".entity-result__summary",
      "p.entity-result__content-summary",
      ".update-components-text span[dir='ltr']",
      ".update-components-text .break-words",
      ".update-components-text",
      ".feed-shared-update-v2__description .break-words",
      ".feed-shared-update-v2__description",
      ".attributed-text-segment-list__content",
      ".feed-shared-text",
      ".entity-result__content-description",
    ]);

    // Smart fallback: If strict selectors fail, find the longest block of text in the card
    // that isn't the author's name or headline.
    if (!content) {
      const candidates = Array.from(card.querySelectorAll("span[dir='ltr'], p, .break-words, .t-14"))
        .map((el) => el.textContent?.trim() || "")
        .filter((text) => 
          text.length > 30 && 
          text !== author && 
          text !== authorHeadline &&
          !authorHeadline.includes(text)
        );

      if (candidates.length > 0) {
        // Sort descending by length, the longest text block is almost certainly the post body
        candidates.sort((a, b) => b.length - a.length);
        content = candidates[0];
      }
    }

    // Timestamp — in <p class="t-black--light t-12"> > span[aria-hidden="true"]
    const postedAt = firstText(card, [
      ".linked-area p.t-black--light span[aria-hidden='true']",
      ".entity-result__secondary-subtitle",
      ".update-components-actor__sub-description span[aria-hidden='true']",
    ]);

    if (!content && !author) return null;

    const id = getStableId(urn, url);
    const tags = extractTags(content);

    return { id, author, authorHeadline, authorAvatar, content, url, postedAt, scrapedAt: new Date().toISOString(), tags };
  } catch (e) {
    LOG("parseCard error:", e);
    return null;
  }
}

// ─── Find all post cards on the page ─────────────────────────────────────────
function findPostCards(): Element[] {
  const strategies: Array<() => Element[]> = [
    // 1. entity-result pattern (used on /my-items/saved-posts as of 2025)
    () => Array.from(document.querySelectorAll("[data-chameleon-result-urn]")),

    // 2. scaffold list items containing entity-results
    () => Array.from(document.querySelectorAll(
      ".scaffold-finite-scroll__content li, .search-results-container li"
    )).filter((li) => li.querySelector("[data-chameleon-result-urn], .entity-result__content-container") !== null),

    // 3. entity-result containers directly
    () => Array.from(document.querySelectorAll(".entity-result__content-container")),

    // 4. feed-style fallbacks
    () => Array.from(document.querySelectorAll(".occludable-update, .feed-shared-update-v2")),

    // 5. any element with activity URN
    () => Array.from(document.querySelectorAll<Element>("[data-urn]"))
      .filter((el) => {
        const urn = el.getAttribute("data-urn") ?? "";
        return (urn.includes("activity:") || urn.includes("ugcPost:")) &&
          !el.parentElement?.closest("[data-urn]");
      }),
  ];

  for (let i = 0; i < strategies.length; i++) {
    const cards = strategies[i]().filter(
      (el) => (el.textContent?.trim().length ?? 0) > 10
    );
    if (cards.length > 0) {
      LOG(`Strategy ${i + 1} found ${cards.length} cards`);
      return cards;
    }
  }

  LOG("No cards found. Page HTML sample:", document.body.innerHTML.slice(0, 800));
  return [];
}

// ─── Main scrape routine ──────────────────────────────────────────────────────
async function scrape(): Promise<Post[]> {
  LOG("Waiting for page content…");

  await waitForElement(
    "[data-chameleon-result-urn], .entity-result__content-container, .scaffold-finite-scroll__content",
    15000
  );

  await new Promise((r) => setTimeout(r, 1500));

  LOG("Scrolling to load all posts…");
  await scrollToBottom();

  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 500));

  const cards = findPostCards();
  LOG(`Parsing ${cards.length} cards…`);

  const posts: Post[] = [];
  const seen = new Set<string>();

  for (const card of cards) {
    const post = parseCard(card);
    if (post && !seen.has(post.id)) {
      seen.add(post.id);
      posts.push(post);
    }
  }

  LOG(`Done — ${posts.length} posts extracted`);

  if (posts.length === 0 && cards.length > 0) {
    LOG("Cards found but no posts parsed. First card HTML:", cards[0].outerHTML.slice(0, 800));
  }

  return posts;
}

// ─── Listen for messages from background ─────────────────────────────────────
chrome.runtime.onMessage.addListener((msg: MessageType, _sender, sendResponse) => {
  if (msg.type === "TRIGGER_SCRAPE") {
    LOG("Scrape triggered from background");
    scrape()
      .then((posts) => {
        sendResponse({ type: "SCRAPE_RESULT", posts } satisfies MessageType);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        LOG("Fatal error:", message);
        sendResponse({ type: "SCRAPE_ERROR", error: message } satisfies MessageType);
      });
    return true;
  }
});
