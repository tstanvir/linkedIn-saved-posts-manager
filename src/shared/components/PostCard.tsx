/**
 * Shared PostCard component — used by both popup and dashboard.
 * Extracted from popup/components/PostCard.tsx.
 */
import { useState } from "react";
import { Post } from "../types";
import { ExternalLink, ChevronDown, ChevronUp, X } from "lucide-react";

interface Props {
  post: Post;
  onDelete: (id: string) => void;
  /** If true, shows full content by default (dashboard mode). */
  expandedByDefault?: boolean;
}

const PREVIEW_LENGTH = 160;

export default function PostCard({ post, onDelete, expandedByDefault = false }: Props) {
  const [expanded, setExpanded] = useState(expandedByDefault);
  const isLong = post.content.length > PREVIEW_LENGTH;

  const displayContent =
    expanded || !isLong ? post.content : post.content.slice(0, PREVIEW_LENGTH) + "…";

  // Highlight #hashtags in content
  const renderContent = (text: string) => {
    const parts = text.split(/(#[\w\u00C0-\u024F]+)/g);
    return parts.map((part, i) =>
      part.startsWith("#") ? (
        <span key={i} className="text-linkedin font-medium">
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  const displayTags = (post.aiTags && post.aiTags.length > 0) ? post.aiTags : post.tags;

  return (
    <div className="border border-gray-200/60 shadow-sm rounded-xl p-3.5 bg-white hover:border-linkedin/30 hover:shadow-md transition-all shrink-0 group">
      {/* Author row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {post.authorAvatar ? (
            <img
              src={post.authorAvatar}
              alt={post.author}
              className="w-8 h-8 rounded-full object-cover shrink-0 bg-gray-100"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-gray-500 text-xs font-semibold">
              {post.author.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate leading-tight">
              {post.author || "Unknown"}
            </p>
            {post.authorHeadline && (
              <p className="text-[10px] text-gray-400 truncate leading-tight">
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
              className="text-gray-400 hover:text-linkedin transition-colors"
              title="Open on LinkedIn"
            >
              <ExternalLink size={13} />
            </a>
          )}
          <button
            onClick={() => onDelete(post.id)}
            title="Remove from list"
            className="text-gray-300 hover:text-red-400 transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* AI Summary */}
      {post.aiSummary && (
        <div className="bg-slate-50 border-l-[3px] border-linkedin/80 rounded-r-lg px-3 py-2.5 mb-2.5">
          <p className="text-[11px] text-slate-600 font-medium leading-relaxed italic">
            "{post.aiSummary}"
          </p>
        </div>
      )}

      {/* Content */}
      {post.content ? (
        <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
          {renderContent(displayContent)}
        </div>
      ) : (
        <div className="text-[11px] text-gray-400 italic bg-gray-50/50 rounded-lg p-2.5 text-center my-1 border border-dashed border-gray-200">
          No text content visible. This is likely an image or video post.
        </div>
      )}

      {/* Expand/collapse */}
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-0.5 mt-1 text-[10px] text-gray-400 hover:text-linkedin transition-colors"
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
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {displayTags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] bg-sky-50 text-linkedin border border-sky-100/50 px-2 py-0.5 rounded-full font-medium shadow-sm transition-colors hover:bg-sky-100"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Timestamp */}
      {post.postedAt && (
        <p className="text-[10px] text-gray-300 mt-2">{post.postedAt}</p>
      )}
    </div>
  );
}
