/**
 * Dashboard App — Full-page extension tab for managing saved posts.
 *
 * Features: search, sort, multi-tag filter, bulk delete, CSV/JSON export.
 * Opens in a new browser tab via chrome.tabs.create.
 */
import { useEffect, useState, useCallback, useMemo } from "react";
import { Post, MessageType } from "../shared/types";
import { loadStorage } from "../shared/storage";
import SearchBar from "../shared/components/SearchBar";
import TagFilter from "../shared/components/TagFilter";
import PostCard from "../shared/components/PostCard";
import { exportToCsv, exportToJson, downloadFile } from "../shared/export";
import {
  RefreshCw, Loader2, Download, Trash2, LayoutDashboard,
  ArrowUpDown, CheckSquare, Square,
} from "lucide-react";

type SortField = "scrapedAt" | "postedAt" | "author";
type SortDir = "asc" | "desc";

// Converts LinkedIn relative times ("1w", "3mo") into approximate timestamps
function getApproximateTimestamp(postedAt: string | undefined, scrapedAt: string): number {
  const baseTime = new Date(scrapedAt).getTime();
  if (!postedAt) return baseTime;
  
  const clean = postedAt.toLowerCase().replace(/.*•\s*/, "").trim();
  const match = clean.match(/^(\d+)\s*(m|h|d|w|mo|yr)/);
  if (!match) return baseTime;
  
  const val = parseInt(match[1], 10);
  const unit = match[2];
  
  let seconds = 0;
  if (unit === 'm') seconds = val * 60;
  else if (unit === 'h') seconds = val * 3600;
  else if (unit === 'd') seconds = val * 86400;
  else if (unit === 'w') seconds = val * 604800;
  else if (unit === 'mo') seconds = val * 2592000;
  else if (unit === 'yr') seconds = val * 31536000;
  
  return baseTime - (seconds * 1000);
}

export default function DashboardApp() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [lastScraped, setLastScraped] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("scrapedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadPosts = useCallback(() => {
    loadStorage().then((data) => {
      setPosts(data.posts);
      setLastScraped(data.lastScraped);
    });
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  // Listen for background broadcasts
  useEffect(() => {
    const listener = (msg: MessageType) => {
      if (msg.type === "SCRAPING_STATUS" && msg.status === "done") {
        loadPosts();
        setSyncing(false);
      }
      if (msg.type === "SCRAPING_STATUS" && msg.status === "scraping") {
        setSyncing(true);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [loadPosts]);

  // ── Sync trigger ──────────────────────────────────────────────────────────
  const triggerSync = useCallback(() => {
    setSyncing(true);
    chrome.runtime.sendMessage({ type: "TRIGGER_SCRAPE" } satisfies MessageType);
  }, []);

  // ── Delete ────────────────────────────────────────────────────────────────
  const deletePost = useCallback((id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
    chrome.runtime.sendMessage({ type: "DELETE_POST", postId: id } satisfies MessageType);
  }, []);

  const bulkDelete = useCallback(() => {
    if (selected.size === 0) return;
    const ids = [...selected];
    setPosts((prev) => prev.filter((p) => !selected.has(p.id)));
    setSelected(new Set());
    for (const id of ids) {
      chrome.runtime.sendMessage({ type: "DELETE_POST", postId: id } satisfies MessageType);
    }
  }, [selected]);

  // ── Selection ─────────────────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const selectAll = () => {
    setSelected(new Set(filtered.map((p) => p.id)));
  };

  const deselectAll = () => setSelected(new Set());

  // ── Tags ──────────────────────────────────────────────────────────────────
  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of posts) {
      const tList = p.aiTags?.length ? p.aiTags : p.tags;
      for (const t of tList) {
        counts.set(t, (counts.get(t) || 0) + 1);
      }
    }
    return [...counts.keys()].sort((a, b) => {
      const diff = counts.get(b)! - counts.get(a)!;
      if (diff !== 0) return diff;
      return a.toLowerCase().localeCompare(b.toLowerCase());
    });
  }, [posts]);

  // ── Filter + Sort ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = posts;

    // Text search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.content.toLowerCase().includes(q) ||
          p.author.toLowerCase().includes(q) ||
          (p.aiSummary?.toLowerCase().includes(q) ?? false) ||
          (p.aiTags?.some((t) => t.includes(q)) ?? false)
      );
    }

    // Tag filter
    if (activeTag) {
      result = result.filter(
        (p) =>
          (p.aiTags?.includes(activeTag) ?? false) ||
          p.tags.includes(activeTag)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === "scrapedAt") {
        cmp = a.scrapedAt.localeCompare(b.scrapedAt);
      } else if (sortField === "postedAt") {
        const timeA = getApproximateTimestamp(a.postedAt, a.scrapedAt);
        const timeB = getApproximateTimestamp(b.postedAt, b.scrapedAt);
        cmp = timeA - timeB;
      } else if (sortField === "author") {
        cmp = a.author.localeCompare(b.author);
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [posts, search, activeTag, sortField, sortDir]);

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = (format: "csv" | "json") => {
    const data = selected.size > 0
      ? posts.filter((p) => selected.has(p.id))
      : filtered;
    const content = format === "csv" ? exportToCsv(data) : exportToJson(data);
    const ext = format === "csv" ? "csv" : "json";
    const mime = format === "csv" ? "text/csv" : "application/json";
    downloadFile(content, `linkedin-saved-posts.${ext}`, mime);
  };

  // ── Cycle sort ────────────────────────────────────────────────────────────
  const cycleSort = () => {
    const fields: SortField[] = ["scrapedAt", "postedAt", "author"];
    const idx = fields.indexOf(sortField);
    if (sortDir === "desc") {
      setSortDir("asc");
    } else {
      setSortDir("desc");
      setSortField(fields[(idx + 1) % fields.length]);
    }
  };

  const sortLabel = `${sortField === "scrapedAt" ? "Scraped" : sortField === "postedAt" ? "Posted" : "Author"} ${sortDir === "desc" ? "↓" : "↑"}`;

  return (
    <div className="min-h-screen bg-mt-bg">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <header className="bg-mt-bg-card border-b border-mt-border sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-mt-accent flex items-center justify-center">
              <LayoutDashboard size={16} className="text-[#323437]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-mt-text">Saved Posts Dashboard</h1>
              <p className="text-xs text-mt-text-dim">
                {posts.length} posts
                {lastScraped && ` · Last synced ${new Date(lastScraped).toLocaleDateString()}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-mt-text-dim bg-mt-bg-input hover:text-mt-text hover:bg-mt-border rounded-lg transition-colors">
                <Download size={13} />
                Export{selected.size > 0 && ` (${selected.size})`}
              </button>
              <div className="absolute right-0 top-full pt-1 hidden group-hover:block z-30 min-w-[120px]">
                <div className="bg-mt-bg-card border border-mt-border rounded-lg shadow-lg overflow-hidden">
                  <button
                    onClick={() => handleExport("csv")}
                    className="block w-full text-left px-3 py-2 text-xs text-mt-text hover:bg-mt-bg transition-colors"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => handleExport("json")}
                    className="block w-full text-left px-3 py-2 text-xs text-mt-text hover:bg-mt-bg transition-colors border-t border-mt-border"
                  >
                    Export JSON
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk delete */}
            {selected.size > 0 && (
              <button
                onClick={bulkDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-mt-error bg-mt-error/10 hover:bg-mt-error/20 rounded-lg transition-colors"
              >
                <Trash2 size={13} />
                Delete {selected.size}
              </button>
            )}

            {/* Sync */}
            <button
              onClick={triggerSync}
              disabled={syncing}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                ${syncing
                  ? "bg-mt-bg-input text-mt-text-dim cursor-not-allowed"
                  : "bg-mt-accent text-[#323437] hover:bg-mt-accent-hover"
                }`}
            >
              {syncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              {syncing ? "Syncing…" : "Sync"}
            </button>
          </div>
        </div>
      </header>

      {/* ─── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 pt-4 space-y-3">
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by content, author, or tags…" />
          </div>
          <button
            onClick={cycleSort}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-mt-text-dim bg-mt-bg-card border border-mt-border rounded-lg hover:text-mt-text hover:bg-mt-bg transition-colors shrink-0"
            title="Cycle sort field and direction"
          >
            <ArrowUpDown size={12} />
            {sortLabel}
          </button>
        </div>

        {allTags.length > 0 && (
          <TagFilter tags={allTags} active={activeTag} onSelect={setActiveTag} />
        )}

        {/* Selection toolbar */}
        <div className="flex items-center gap-3 text-xs text-mt-text-dim">
          <button onClick={selected.size === filtered.length ? deselectAll : selectAll} className="flex items-center gap-1 hover:text-mt-accent transition-colors">
            {selected.size === filtered.length && filtered.length > 0 ? <CheckSquare size={12} /> : <Square size={12} />}
            {selected.size > 0 ? `${selected.size} selected` : "Select all"}
          </button>
          <span className="text-mt-border">|</span>
          <span>{filtered.length} of {posts.length} posts shown</span>
        </div>
      </div>

      {/* ─── Post Grid ─────────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-6 py-4">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-mt-text-dim">
            <p className="text-sm font-medium">
              {posts.length === 0 ? "No saved posts yet" : "No posts match your filters"}
            </p>
            {posts.length === 0 && (
              <p className="text-xs mt-1">Click <strong>Sync</strong> to scrape your LinkedIn saved posts.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {filtered.map((post) => (
              <div key={post.id} className="relative">
                {/* Selection checkbox */}
                <button
                  onClick={() => toggleSelect(post.id)}
                  className={`absolute top-2 left-2 z-10 w-5 h-5 rounded border flex items-center justify-center text-xs transition-colors
                    ${selected.has(post.id)
                      ? "bg-mt-accent border-mt-accent text-[#323437]"
                      : "bg-mt-bg border-mt-border text-transparent hover:border-mt-accent"
                    }`}
                >
                  ✓
                </button>
                <div className="pl-6">
                  <PostCard post={post} onDelete={deletePost} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
