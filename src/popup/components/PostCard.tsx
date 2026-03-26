import { useState } from "react";
import { Post } from "../../shared/types";
import { ExternalLink, ChevronDown, ChevronUp, X } from "lucide-react";

interface Props {
  post: Post;
  onDelete: (id: string) => void;
}

const PREVIEW_LENGTH = 160;

export default function PostCard({ post, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isLong = post.content.length > PREVIEW_LENGTH;

  const displayContent =
    expanded || !isLong ? post.content : post.content.slice(0, PREVIEW_LENGTH) + "…";

  // Highlight #hashtags in content
  const renderContent = (text: string) => {
    const parts = text.split(/(#[\w\u00C0-\u024F]+)/g);
    return parts.map((part, i) =>
      part.startsWith("#") ? (
        <span key={i} className="text-mt-accent font-medium">
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  const displayTags = (post.aiTags && post.aiTags.length > 0) ? post.aiTags : post.tags;

  return (
    <div className="border border-mt-border rounded-xl p-3 bg-mt-bg-card hover:border-mt-accent/40 hover:shadow-sm transition-all shrink-0">
      {/* Author row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {post.authorAvatar ? (
            <img
              src={post.authorAvatar}
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
          {post.url && (
            <a
              href={post.url}
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
        <p className="text-[11px] text-mt-text-dim italic mb-1.5 leading-snug border-l-2 border-mt-accent/30 pl-2">
          {post.aiSummary}
        </p>
      )}

      {/* Content */}
      {post.content && (
        <div className="text-xs text-mt-text leading-relaxed whitespace-pre-line">
          {renderContent(displayContent)}
        </div>
      )}

      {/* Expand/collapse */}
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-0.5 mt-1 text-[10px] text-mt-text-dim hover:text-mt-accent transition-colors"
        >
          {expanded ? (
            <><ChevronUp size={11} /> Show less</>
          ) : (
            <><ChevronDown size={11} /> Show more</>
          )}
        </button>
      )}

      {/* Tags */}
      {displayTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {displayTags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] bg-mt-accent-subtle text-mt-accent px-1.5 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Timestamp */}
      {post.postedAt && (
        <p className="text-[10px] text-mt-border mt-2">{post.postedAt}</p>
      )}
    </div>
  );
}
