/**
 * Shared TagFilter component — used by both popup and dashboard.
 * Supports single-select (popup) and multi-select (dashboard).
 */
import { useEffect, useRef, useState } from "react";
import { ChevronFirst } from "lucide-react";

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

  // Smooth scroll to the active tag
  useEffect(() => {
    if (!active || !scrollRef.current) return;
    
    const tagToFind = Array.isArray(active) ? active[0] : active;
    if (!tagToFind) return;

    // We can use querySelector safely by escaping CSS characters in the tag
    const btn = scrollRef.current.querySelector(
      `[data-tag="${CSS.escape(tagToFind)}"]`
    );
    
    if (btn) {
      btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [active]);

  const [canScrollLeft, setCanScrollLeft] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => setCanScrollLeft(el.scrollLeft > 20);
    el.addEventListener("scroll", handleScroll, { passive: true });
    // Check initial state after a tiny delay to ensure layout is done
    setTimeout(handleScroll, 100);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative w-full min-w-0 flex items-center">
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-1 w-12 flex items-center z-10 bg-gradient-to-r from-mt-bg via-mt-bg/95 to-transparent pointer-events-none">
          <button
            onClick={() => scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" })}
            className="pointer-events-auto shrink-0 rounded-full bg-mt-bg-input border border-mt-border text-mt-text-dim hover:text-mt-accent hover:border-mt-accent transition-colors flex items-center justify-center w-6 h-6 shadow-sm"
            title="Scroll to start"
          >
            <ChevronFirst size={13} strokeWidth={2.5} />
          </button>
        </div>
      )}
      <div ref={scrollRef} className="tags-scroll flex gap-1.5 overflow-x-auto pb-1 w-full">
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
          data-tag={tag}
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
    </div>
  );
}
