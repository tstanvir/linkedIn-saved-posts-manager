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
            ? "bg-linkedin text-white border-linkedin"
            : "bg-white text-gray-600 border-gray-200 hover:border-linkedin hover:text-linkedin"
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
              ? "bg-linkedin text-white border-linkedin"
              : "bg-white text-gray-600 border-gray-200 hover:border-linkedin hover:text-linkedin"
            }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
