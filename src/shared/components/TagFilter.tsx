/**
 * Shared TagFilter component — used by both popup and dashboard.
 * Supports single-select (popup) and multi-select (dashboard).
 */
import { useEffect, useRef } from "react";

interface Props {
  tags: string[];
  /** Active tag(s) — string for single-select, string[] for multi-select. */
  active: string | string[] | null;
  /** Called when a tag is toggled. For single-select, passes string|null. */
  onSelect: (tag: string | null) => void;
}

export default function TagFilter({ tags, active, onSelect }: Props) {
  const isActive = (tag: string): boolean => {
    if (Array.isArray(active)) return active.includes(tag);
    return active === tag;
  };

  const isAllActive = (): boolean => {
    if (Array.isArray(active)) return active.length === 0;
    return active === null;
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  // Translate vertical mouse wheel scrolling into horizontal scrolling
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      
      const maxScroll = el.scrollWidth - el.clientWidth;
      const atLeft = el.scrollLeft <= 0 && e.deltaY < 0;
      const atRight = el.scrollLeft >= maxScroll - 1 && e.deltaY > 0;
      
      // Only intercept if we can actually scroll horizontally
      if (!atLeft && !atRight) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    
    // passive: false is critical so we can call e.preventDefault()
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div ref={scrollRef} className="tags-scroll flex gap-1.5 overflow-x-auto pb-1">
      {/* "All" chip */}
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors
          ${isAllActive()
            ? "bg-mt-accent text-black border-mt-accent"
            : "bg-mt-bg-input text-mt-text-dim border-mt-border hover:border-mt-accent hover:text-mt-accent"
          }`}
      >
        All
      </button>

      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onSelect(isActive(tag) ? null : tag)}
          className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors
            ${isActive(tag)
              ? "bg-mt-accent text-black border-mt-accent"
              : "bg-mt-bg-input text-mt-text-dim border-mt-border hover:border-mt-accent hover:text-mt-accent"
            }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
