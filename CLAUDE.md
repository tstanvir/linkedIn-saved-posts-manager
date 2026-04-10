# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
docker run -it --rm --entrypoint sh node:24-alpine # Create a Node.js container and start a Shell session:
npm install --ignore-scripts     # install deps
npm run icons                    # generate icons/icon{16,32,48,128}.png from icons/icon.svg (run once)
npm run dev                      # Vite dev build with watch
npm run build                    # production build → dist/
npm run lint                     # ESLint
```

Load the extension: `chrome://extensions` → Developer Mode → Load unpacked → select `dist/`.

## Architecture

Manifest V3 Chrome extension. Three independent execution contexts that communicate via `chrome.runtime` message passing:

```
content/scraper.ts          ← injected on linkedin.com/my-items/saved-posts
       ↕  chrome.tabs.sendMessage
background/index.ts         ← service worker; owns IndexedDB + tab management + AI enrichment
       ↕  chrome.runtime.sendMessage
popup/App.tsx               ← React UI; reads storage, sends TRIGGER_SCRAPE
```

`background/ai.ts` — Groq API client; `enrichPostsBatch()` called by `background/index.ts` after each scrape.

### Message types
All messages use the discriminated union `MessageType` in `src/shared/types.ts`. Every message handler must be exhaustive against this union. Current variants include: `TRIGGER_SCRAPE`, `SCRAPE_RESULT`, `SCRAPE_ERROR`, `GET_POSTS`, `POSTS_RESPONSE`, `SCRAPING_STATUS`, `DELETE_POST`.

### Data flow
1. User clicks **Sync** in popup → popup sends `TRIGGER_SCRAPE` to background
2. Background finds/opens the LinkedIn saved-posts tab, sends `TRIGGER_SCRAPE` to content script
3. Content script scrolls the page to load all posts, parses DOM cards, extracts hashtags as fallback tags, responds with `SCRAPE_RESULT`
4. Background persists posts to IndexedDB via `LocalPostStore` and broadcasts `SCRAPING_STATUS` so the popup can react
5. Popup listens for `SCRAPING_STATUS` and reloads from IndexedDB on `"done"`

### Tag extraction
Initial tags are extracted from `#hashtag` patterns in post content (`scraper.ts:extractTags`). Local engines (`KeywordTagEngine`, `FirstSentenceSummaryEngine`) generate `aiTags` and `aiSummary` during scraping. The UI prefers `aiTags` when available, falling back to hashtag `tags`.

### Storage schema

**IndexedDB** (`lspm_db` via Dexie.js) — primary post storage, no size limit:
- Table `posts` indexed on `id, scrapedAt, *tags`
- Each row is a `Post` object (see `src/shared/types.ts`)
  - `aiSummary?: string` — one-line generated summary
  - `aiTags?: string[]` — 3–5 contextual tags (no `#` prefix)
  - `aiEnrichedAt?: string` — ISO timestamp; set after enrichment to skip re-processing

**chrome.storage.local** key `lspm_settings` — lightweight settings only:
- `lastScraped: string | null`
- `popupSize: { width, height }`

**Migration**: On install/update, `migrateToIndexedDB()` moves posts from the old `lspm_data` key into IndexedDB and sets the `lspm_migrated_to_idb` flag. The migration is idempotent.

### LinkedIn DOM note
LinkedIn frequently changes class names. All selectors are isolated in `src/content/scraper.ts:parseCard`. The saved posts page uses the **entity-result** layout (`[data-chameleon-result-urn]` cards), not the feed layout. Update `parseCard` when scraping breaks.
