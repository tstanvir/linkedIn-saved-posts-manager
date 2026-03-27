import { RefreshCw, Loader2, LayoutDashboard, Info } from "lucide-react";
import ThemeSwitcher from "../../shared/components/ThemeSwitcher";

type ScrapeStatus = "idle" | "scraping" | "done" | "error";

interface Props {
  lastScraped: string | null;
  status: ScrapeStatus;
  statusMsg: string;
  onRefresh: () => void;
  postCount: number;
  onOpenDashboard: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Header({
  lastScraped,
  status,
  statusMsg,
  onRefresh,
  postCount,
  onOpenDashboard,
}: Props) {
  const scraping = status === "scraping";

  return (
    <div className="border-b border-mt-border bg-mt-bg-card shadow-sm shrink-0 z-10 relative">
      <div className="flex items-center justify-between pl-3 pr-4 py-2.5">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-mt-accent flex items-center justify-center">
          <span className="text-black text-xs font-bold leading-none">in</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-mt-text leading-tight">Saved Posts</p>
          {lastScraped ? (
            <p className="text-[10px] text-mt-text-dim leading-tight">
              {postCount} posts · {formatDate(lastScraped)}
            </p>
          ) : (
            <p className="text-[10px] text-mt-text-dim leading-tight">Not synced yet</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Scrape error */}
        {status === "error" && (
          <span className="text-[10px] text-red-500 max-w-[100px] truncate" title={statusMsg}>
            {statusMsg || "Sync failed"}
          </span>
        )}

        {/* Theme Switcher */}
        <ThemeSwitcher iconOnly />

        {/* Open Dashboard */}
        <button
          onClick={onOpenDashboard}
          title="Open full dashboard"
          className="text-mt-text-dim hover:text-mt-accent transition-colors"
        >
          <LayoutDashboard size={14} />
        </button>

        {/* Sync button */}
        <button
          onClick={onRefresh}
          disabled={scraping}
          title={scraping ? "Syncing…" : "Sync saved posts"}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors
            ${scraping
              ? "bg-mt-bg-input text-mt-text-dim cursor-not-allowed"
              : "bg-mt-accent text-black hover:bg-mt-accent-hover"
            }`}
        >
          {scraping ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <RefreshCw size={12} />
          )}
          {scraping ? "Syncing" : "Sync"}
        </button>
      </div>
      </div>
      <div className="bg-mt-bg-input/40 px-3 py-1 flex items-center justify-center gap-1.5">
        <Info size={10} className="text-mt-accent/70 shrink-0" />
        <p className="text-[10px] text-mt-text-dim leading-tight">
          Keep your LinkedIn Saved Posts tab open during sync for best results.
        </p>
      </div>
    </div>
  );
}
