/**
 * Shared PostCard component — used by both popup and dashboard.
 * Extracted from popup/components/PostCard.tsx.
 */
import { Post } from "../types";
import { sanitizeUrl } from "../sanitize";
import { ExternalLink, X } from "lucide-react";

interface Props {
  post: Post;
  onDelete: (id: string) => void;
  onTagClick?: (tag: string | null) => void;
  activeTag?: string | null;
  className?: string;
}

export default function PostCard({ post, onDelete, onTagClick, activeTag, className = "" }: Props) {
  const displayTags = (post.aiTags && post.aiTags.length > 0) ? post.aiTags : post.tags;
  const safeUrl = sanitizeUrl(post.url);
  const safeAvatar = sanitizeUrl(post.authorAvatar);

  return (
    <div className={`border border-mt-border shadow-sm rounded-xl p-3.5 bg-mt-bg-card hover:border-mt-accent/40 hover:shadow-md transition-all shrink-0 group flex flex-col ${className}`.trim()}>
      {/* Author row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {safeAvatar ? (
            <img
              src={safeAvatar}
              alt={post.author}
              className="w-8 h-8 rounded-full object-cover shrink-0 bg-mt-bg-input"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-mt-bg-input shrink-0 flex items-center justify-center text-mt-text-dim text-xs font-semibold">
              {post.author.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-mt-text truncate leading-tight">
              {post.author || "Unknown"}
            </p>
            {post.authorHeadline && (
              <p className="text-[10px] text-mt-text-dim truncate leading-tight">
                {post.authorHeadline}
              </p>
            )}
          </div>
        </div>

          <div className="flex items-center gap-1 shrink-0 mt-0.5">
          {safeUrl && (
            <a
              href={safeUrl}
              target="_blank"
              rel="noreferrer"
              className="text-mt-text-dim hover:text-mt-accent transition-colors"
              title="Open on LinkedIn"
            >
              <ExternalLink size={13} />
            </a>
          )}
          <button
            onClick={() => onDelete(post.id)}
            title="Remove from list"
            className="text-mt-border hover:text-mt-error transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* AI Summary */}
      {post.aiSummary && (
        <div className="bg-mt-bg-input border-l-[3px] border-mt-accent/80 rounded-r-lg px-3 py-2.5 mb-2.5">
          <p className="text-[11px] text-mt-text-dim font-medium leading-relaxed italic">
            "{post.aiSummary}"
          </p>
        </div>
      )}

      {/* Tags */}
      {displayTags.length > 0 && (
        <div className="flex gap-1.5 mt-auto pt-2 overflow-x-auto tags-scroll whitespace-nowrap">
          {displayTags.map((tag) => {
            const isActive = activeTag === tag;
            return (
              <button
                key={tag}
                onClick={() => onTagClick?.(isActive ? null : tag)}
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium shadow-sm transition-colors shrink-0
                  ${isActive 
                    ? "bg-mt-accent text-black border border-mt-accent" 
                    : "bg-mt-accent-subtle text-mt-accent border border-mt-accent/20 hover:bg-mt-accent/20"
                  }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}

      {/* Timestamp */}
      {post.postedAt && (
        <p className="text-[10px] text-mt-border mt-2">{post.postedAt}</p>
      )}
    </div>
  );
}
