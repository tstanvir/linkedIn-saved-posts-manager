import { Search, X } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="relative">
      <Search
        size={14}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mt-text-dim pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search posts…"
        className="w-full pl-8 pr-7 py-1.5 text-sm border border-mt-border rounded-lg
          focus:outline-none focus:border-mt-accent focus:ring-1 focus:ring-mt-accent
          placeholder:text-mt-text-dim bg-mt-bg-input text-mt-text"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-mt-text-dim hover:text-mt-text"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
