interface Props {
  tags: string[];
  active: string | null;
  onSelect: (tag: string | null) => void;
}

export default function TagFilter({ tags, active, onSelect }: Props) {
  return (
    <div className="tags-scroll flex gap-1.5 overflow-x-auto pb-1">
      {/* "All" chip */}
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors
          ${active === null
            ? "bg-mt-accent text-black border-mt-accent"
            : "bg-mt-bg-input text-mt-text-dim border-mt-border hover:border-mt-accent hover:text-mt-accent"
          }`}
      >
        All
      </button>

      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onSelect(active === tag ? null : tag)}
          className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors
            ${active === tag
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
