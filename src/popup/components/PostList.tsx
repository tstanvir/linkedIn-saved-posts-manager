import { Post } from "../../shared/types";
import PostCard from "./PostCard";
import { BookmarkX } from "lucide-react";

interface Props {
  posts: Post[];
  totalCount: number;
  onDelete: (id: string) => void;
}

export default function PostList({ posts, totalCount, onDelete }: Props) {
  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
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
      <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
        <p className="text-sm">No posts match your filters</p>
      </div>
    );
  }

  return (
    <div className="posts-scroll flex flex-col gap-2 overflow-y-auto h-full pr-0.5">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onDelete={onDelete} />
      ))}
    </div>
  );
}
