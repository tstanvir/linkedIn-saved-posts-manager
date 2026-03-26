import { Palette } from "lucide-react";
import { useTheme, ThemeName } from "../hooks/useTheme";

const THEMES: { id: ThemeName; name: string }[] = [
  { id: "monkey", name: "Monkey" },
  { id: "dracula", name: "Dracula" },
  { id: "tokyo-night", name: "Tokyo Night" },
  { id: "nord", name: "Nord" },
  { id: "solarized-dark", name: "Solarized Dark" },
  { id: "solarized-light", name: "Solarized Light" },
  { id: "matrix", name: "Matrix" },
  { id: "gruvbox-dark", name: "Gruvbox Dark" },
  { id: "cyberpunk", name: "Cyberpunk" },
  { id: "midnight", name: "Midnight" },
  { id: "cafe", name: "Cafe" },
];

export default function ThemeSwitcher({ iconOnly = false }: { iconOnly?: boolean }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="relative group">
      <button 
        title="Theme Selector"
        className={`flex items-center gap-1.5 ${
          iconOnly
            ? "text-mt-text-dim hover:text-mt-accent transition-colors"
            : "px-3 py-1.5 text-xs font-medium text-mt-text-dim bg-mt-bg-input hover:text-mt-text hover:bg-mt-border rounded-lg transition-colors"
        }`}
      >
        <Palette size={iconOnly ? 14 : 13} />
        {!iconOnly && "Theme"}
      </button>
      <div className="absolute right-0 top-full pt-1 hidden group-hover:block z-30 min-w-[140px]">
        <div className="bg-mt-bg-card border border-mt-border rounded-lg shadow-lg overflow-hidden flex flex-col max-h-64 overflow-y-auto posts-scroll">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`block w-full text-left px-3 py-2 text-xs transition-colors ${
                theme === t.id
                  ? "bg-mt-accent/10 text-mt-accent font-bold"
                  : "text-mt-text hover:bg-mt-bg"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
