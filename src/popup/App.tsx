import { useEffect, useState, useCallback, useMemo } from "react";
import { Post, MessageType } from "../shared/types";
import { loadStorage } from "../shared/storage";
import SearchBar from "../shared/components/SearchBar";
import TagFilter from "../shared/components/TagFilter";
import PostList from "./components/PostList";
import Header from "./components/Header";

type ScrapeStatus = "idle" | "scraping" | "done" | "error";

export default function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [lastScraped, setLastScraped] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [status, setStatus] = useState<ScrapeStatus>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  useEffect(() => {
    loadStorage().then((data) => {
      setPosts(data.posts);
      setLastScraped(data.lastScraped);
    });
  }, []);

  // ── Listen for broadcasts from background ────────────────────────────────
  useEffect(() => {
    const listener = (msg: MessageType) => {
      if (msg.type === "SCRAPING_STATUS") {
        setStatus(msg.status);
        setStatusMsg(msg.message ?? "");
        if (msg.status === "done") {
          loadStorage().then((data) => {
            setPosts(data.posts);
            setLastScraped(data.lastScraped);
          });
        }
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  // ── Trigger scrape ────────────────────────────────────────────────────────
  const triggerScrape = useCallback(() => {
    setStatus("scraping");
    chrome.runtime.sendMessage({ type: "TRIGGER_SCRAPE" } satisfies MessageType);
  }, []);

  // ── Open dashboard tab ────────────────────────────────────────────────────
  const openDashboard = useCallback(() => {
    chrome.tabs.create({ url: chrome.runtime.getURL("src/dashboard/index.html") });
  }, []);

  // ── Delete a post (optimistic) ────────────────────────────────────────────
  const deletePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    chrome.runtime.sendMessage({ type: "DELETE_POST", postId } satisfies MessageType);
  }, []);

  // ── Derive tags — prefer aiTags per post, fallback to hashtag tags ────────
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

  // ── Filter logic — search on content, summary, aiTags (not author) ────────
  const filtered = posts.filter((post) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      post.content.toLowerCase().includes(q) ||
      (post.aiSummary?.toLowerCase().includes(q) ?? false) ||
      (post.aiTags?.some((t) => t.includes(q)) ?? false);
    const matchesTag =
      !activeTag ||
      (post.aiTags?.includes(activeTag) ?? false) ||
      post.tags.includes(activeTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="flex flex-col bg-mt-bg select-none overflow-hidden relative w-[450px] h-[600px]">
      <Header
        lastScraped={lastScraped}
        status={status}
        statusMsg={statusMsg}
        onRefresh={triggerScrape}
        postCount={posts.length}
        onOpenDashboard={openDashboard}
      />

      <div className="px-3 pt-2">
        <SearchBar value={search} onChange={setSearch} />
      </div>

      {allTags.length > 0 && (
        <div className="px-3 pt-2">
          <TagFilter tags={allTags} active={activeTag} onSelect={setActiveTag} />
        </div>
      )}

      <div className="flex-1 overflow-hidden px-3 pt-2 pb-1">
        <PostList posts={filtered} totalCount={posts.length} onDelete={deletePost} />
      </div>

    </div>
  );
}
