import { useEffect, useState } from "react";
import { Post } from "../../shared/types";
import PostCard from "../../shared/components/PostCard";
import { BookmarkX } from "lucide-react";

const PAGE_SIZE = 50;

interface Props {
  posts: Post[];
  totalCount: number;
  onDelete: (id: string) => void;
  onTagClick?: (tag: string | null) => void;
  activeTag?: string | null;
}

export default function PostList({ posts, totalCount, onDelete, onTagClick, activeTag }: Props) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Reset to first page whenever the filtered list changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [posts]);

  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-mt-text-dim">
        <BookmarkX size={36} strokeWidth={1.2} />
        <div className="text-center">
          <p className="text-sm font-medium">No saved posts yet</p>
          <p className="text-xs mt-0.5">
            Open your LinkedIn saved posts page and click <strong>Sync</strong>
          </p>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-mt-text-dim">
        <p className="text-sm">No posts match your filters</p>
      </div>
    );
  }

  const visible = posts.slice(0, visibleCount);
  const hasMore = visibleCount < posts.length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {posts.length > PAGE_SIZE && (
        <p className="text-[10px] text-mt-text-dim mb-1 shrink-0">
          Showing {Math.min(visibleCount, posts.length)} of {posts.length} posts
        </p>
      )}
      <div className="posts-scroll flex flex-col gap-2 overflow-y-auto flex-1 pr-0.5">
        {visible.map((post) => (
          <PostCard key={post.id} post={post} onDelete={onDelete} onTagClick={onTagClick} activeTag={activeTag} />
        ))}
        {hasMore && (
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="w-full py-2 text-[11px] font-medium text-mt-accent border border-mt-accent/30 rounded-lg hover:bg-mt-accent/10 transition-colors shrink-0"
          >
            Load {Math.min(PAGE_SIZE, posts.length - visibleCount)} more
          </button>
        )}
      </div>
    </div>
  );
}
