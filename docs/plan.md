# Implementation Plan — LinkedIn Saved Posts Manager MVP

## Goal

Ship a **secure, single-user Chrome extension** that fixes all critical data issues, replaces AI with lightweight non-AI alternatives, and is architecturally ready for a future cloud backend. No AI in MVP.

## Prerequisites

Node.js runs via Docker in this project. All `npm` commands below should be run inside a Docker container:

```bash
docker run -it --rm --entrypoint sh node:24-alpine
# Then inside the container:
npm install
npm run build
npm run test
# etc.
```

---

## Architecture Principle

Every module is built behind an **interface/abstraction layer** so that switching from local → cloud later requires changing the implementation, not the consumers.

```
┌─ Popup ─────────────────┐   ┌─ Dashboard Tab ──────────┐
│  Quick view, search,    │   │  Full search, collections │
│  filter, sync trigger   │   │  export, settings         │
└────────┬────────────────┘   └────────┬──────────────────┘
         │ chrome.runtime.sendMessage  │
         ▼                             ▼
┌─ Service Worker (background) ────────────────────────────┐
│  Message router                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ IPostStore   │  │ ITagEngine   │  │ ISummaryEngine │  │
│  │ (interface)  │  │ (interface)  │  │ (interface)    │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬────────┘  │
│    LocalStore       KeywordExtractor    FirstSentence    │
│    (IndexedDB)      (TF-IDF)           (extractive)     │
│         ↓                ↓                   ↓           │
│    [Future:          [Future:           [Future:         │
│     CloudStore]       LLMTagger]        LLMSummarizer]  │
└──────────────────────────────────────────────────────────┘
```

> **Note:** `IPostStore`, `ITagEngine`, `ISummaryEngine` are TypeScript interfaces. MVP ships with local implementations. Future backend phase swaps in cloud implementations — zero changes to popup/dashboard code.

---

## Phase 0 — Project Foundation

**Goal**: Testing infrastructure, linting, CI-ready project.

### Scope
- Add Vitest as the test runner
- Add test scripts to `package.json`
- Create test utilities and mock fixtures (mock Chrome APIs, mock DOM snapshots)
- Add a `tests/` directory structure mirroring `src/`
- Define the 3 core interfaces: `IPostStore`, `ITagEngine`, `ISummaryEngine`

### Deliverables
- `tests/setup.ts` — Chrome API mocks
- `tests/fixtures/` — saved DOM snapshots from the LinkedIn saved-posts page
- `src/shared/interfaces.ts` — core interfaces
- `vitest.config.ts`
- All existing code still compiles (`npm run build`)

### Test & Validation
```bash
npm run test          # Vitest runs, 0 tests pass (skeleton only)
npm run build         # Compiles without errors
npm run lint          # No new lint errors
```

### Backend-scalability note
The interfaces defined here are the exact seam where `CloudStore`, `LLMTagger`, and `LLMSummarizer` plug in later.

---

## Phase 1 — Fix Critical Data Integrity Bugs

**Goal**: Eliminate the 3 critical issues (merge sync, stable IDs, deduplication).

### Scope

#### 1a. Stable Post IDs
- Use LinkedIn's `data-chameleon-result-urn` (the activity URN) as the canonical ID
- Fallback to URL-based ID only if URN is missing
- ID is deterministic and content-independent

#### 1b. Incremental Merge Sync
- On scrape, **merge** new posts with existing posts (not replace)
- Match by stable ID; update fields if post already exists; add if new
- Never delete existing posts during sync (user deletes manually)

#### 1c. Deduplication
- Deduplicate by stable ID during merge
- Handle edge case: same post scraped with slightly different content (use latest)

### Deliverables
- Modified `scraper.ts` — new `getStableId()` function
- Modified `background/index.ts` — `mergePosts()` function replaces direct assignment
- `tests/unit/merge.test.ts` — merge logic tests
- `tests/unit/stable-id.test.ts` — ID generation tests

### Test & Validation
```bash
npm run test -- --filter merge     # Merge tests pass
npm run test -- --filter stable-id # ID stability tests pass
```

**Manual validation**:
1. Build extension (`npm run build`), load in Chrome
2. Sync once → posts appear
3. Sync again → no duplicates, count stays same
4. Delete a post in popup → sync again → deleted post does NOT reappear (new posts merge in, nothing is lost)

---

## Phase 2 — Storage Migration (IndexedDB via Dexie.js)

**Goal**: Replace `chrome.storage.local` with IndexedDB for post data. Keeps settings in `chrome.storage.local`.

### Scope

#### 2a. Dexie.js schema
- `posts` table with indexes on `id`, `scrapedAt`, `tags` (multi-entry)
- `settings` remain in `chrome.storage.local` (popup size, preferences)

#### 2b. Implement `LocalPostStore` (implements `IPostStore`)
- Methods: `getAll()`, `getById()`, `upsertMany()`, `deleteById()`, `search(query)`, `filterByTag(tag)`
- Search uses Dexie's full-text search or a simple `.filter()` on content

#### 2c. Migration script
- On first load, migrate any existing data from `chrome.storage.local` → IndexedDB
- Delete old `lspm_data` key after successful migration

### Deliverables
- `src/shared/store/LocalPostStore.ts`
- `src/shared/store/migration.ts`
- Updated `background/index.ts` to use `IPostStore`
- `tests/unit/local-store.test.ts`
- `tests/unit/migration.test.ts`

### Test & Validation
```bash
npm run test -- --filter local-store  # CRUD tests pass
npm run test -- --filter migration    # Migration from old format works
```

**Manual validation**:
1. Install old version of extension (with `chrome.storage.local` data)
2. Update to new version → data migrates automatically
3. Open DevTools → Application → IndexedDB → verify data exists
4. `chrome.storage.local` → `lspm_data` key is gone

---

## Phase 3 — Non-AI Tagging & Summaries

**Goal**: Replace Groq AI with in-browser, zero-cost alternatives.

### Scope

#### 3a. `KeywordTagEngine` (implements `ITagEngine`)
- Extract hashtags (existing logic)
- Add TF-IDF keyword extraction (top 3-5 terms per post)
- Merge and deduplicate both sources
- Lightweight — runs synchronously in the service worker

#### 3b. `FirstSentenceSummaryEngine` (implements `ISummaryEngine`)
- Extract first complete sentence (up to first `.` `!` `?` or 120 chars)
- Clean up: trim whitespace, remove leading emojis/bullet points
- Fallback: first 100 chars + `…`

#### 3c. Remove Groq dependency
- Remove `background/ai.ts`, `AI_ENRICHMENT_STATUS` message type, Groq constants
- Remove `ApiKeyBanner.tsx` component
- Remove `groqApiKey` from storage schema
- Remove `host_permissions` for `api.groq.com` from manifest
- Keep `aiSummary`, `aiTags`, `aiEnrichedAt` fields in the `Post` type (for future backend AI)

### Deliverables
- `src/shared/engines/KeywordTagEngine.ts`
- `src/shared/engines/FirstSentenceSummaryEngine.ts`
- Updated `background/index.ts` — call engines after scrape
- Removed: `ai.ts`, `crypto.ts`, `ApiKeyBanner.tsx`
- `tests/unit/keyword-engine.test.ts`
- `tests/unit/summary-engine.test.ts`

### Test & Validation
```bash
npm run test -- --filter keyword-engine  # Tag extraction works
npm run test -- --filter summary-engine  # Summary extraction works
```

**Manual validation**:
1. Build and load extension
2. Sync posts → every post shows tags (even without hashtags in content)
3. Every post shows a summary line (first sentence)
4. No API key prompt anywhere
5. Manifest no longer lists `api.groq.com` in `host_permissions`

---

## Phase 4 — Full-Page Dashboard Tab

**Goal**: Rich, full-page UI inside the extension for search, filtering, and management.

### Scope

#### 4a. Dashboard page
- New HTML entry point: `src/dashboard/index.html`
- Opened via `chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") })`
- Button in popup header: "Open Dashboard"

#### 4b. Dashboard features
- Full-text search with result highlighting
- Tag filter (multi-select)
- Sort: by date scraped, by date posted
- Post detail view (full content, all metadata)
- Bulk delete
- Export to CSV / JSON

#### 4c. Shared component library
- Move reusable components (`PostCard`, `SearchBar`, `TagFilter`) to `src/shared/components/`
- Both popup and dashboard import from the same source

### Deliverables
- `src/dashboard/` — new page with its own React entry point
- `src/shared/components/` — extracted shared components
- Updated `vite.config.ts` — multi-page build (popup + dashboard)
- Updated popup `Header.tsx` — "Open Dashboard" button
- `tests/unit/export.test.ts` — CSV/JSON export logic tests

### Test & Validation
```bash
npm run test -- --filter export  # Export generates valid CSV/JSON
npm run build                     # Both popup and dashboard build
```

**Manual validation**:
1. Click "Open Dashboard" in popup → full-page tab opens
2. Search works, tag filter works, sort works
3. Export → download CSV → open in Excel → data is correct
4. Popup still works independently

---

## Phase 5 — Security Hardening & Chrome Web Store Submission

**Goal**: Production-ready security, polish, and CWS listing.

### Scope

#### 5a. Security
- Audit all permissions — remove any unused (`activeTab` may be removable)
- Add `Content-Security-Policy` to manifest
- Sanitize all rendered post content (prevent XSS from scraped HTML)
- Remove all `console.log` / debug code from production build

#### 5b. Privacy
- Write a privacy policy (required for CWS)
- All data stays local — document this clearly
- No analytics, no telemetry in MVP

#### 5c. CWS submission
- Screenshots (5 required)
- Store description and promotional images
- Category: Productivity
- Privacy practices declaration

### Deliverables
- Updated `manifest.json` — CSP, minimal permissions
- `PRIVACY_POLICY.md`
- CWS listing assets in `store-assets/`
- `tests/unit/sanitize.test.ts` — XSS prevention tests

### Test & Validation
```bash
npm run test                # All tests pass
npm run build               # Production build succeeds
npm run lint                # Zero warnings
```

**Manual validation**:
1. Load unpacked in Chrome → no console warnings about CSP
2. Open DevTools → no debug logs in console
3. Test with a post containing `<script>alert(1)</script>` in content → renders as text, not executed

---

## Phase Summary

| Phase | Scope | Est. Time | Tests |
|-------|-------|-----------|-------|
| **0** | Foundation + interfaces + Vitest | 2 days | Setup only |
| **1** | Fix data integrity (IDs, merge, dedup) | 3-4 days | Unit: merge, stable-id |
| **2** | IndexedDB migration | 2-3 days | Unit: store, migration |
| **3** | Non-AI tags + summaries, remove Groq | 2-3 days | Unit: engines |
| **4** | Full-page dashboard | 3-4 days | Unit: export |
| **5** | Security + CWS submission | 2-3 days | Unit: sanitize |
| **Total** | | **~3 weeks** | |

> Each phase is independently deployable. You can ship after Phase 1 for a "fixed" extension, or go all the way through Phase 5 for the CWS listing.

---

## What's NOT in This Plan (Deferred to Backend Phase)

| Feature | Why Deferred |
|---------|-------------|
| AI summaries / tags (LLM) | Requires backend API key management |
| User accounts / auth | Requires server |
| Cross-device sync | Requires server |
| Semantic search (vector embeddings) | Requires server-side compute |
| Collections / folders | Can be local, but more valuable with sync |
| Team sharing | Requires server |

> When you're ready for the backend, the `IPostStore`, `ITagEngine`, and `ISummaryEngine` interfaces swap from local → cloud implementations. The popup and dashboard code remain untouched.
