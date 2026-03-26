import { RefreshCw, Loader2, LayoutDashboard } from "lucide-react";

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
    <div className="flex items-center justify-between pl-3 pr-4 py-2.5 border-b border-gray-100 bg-white shadow-sm shrink-0 z-10 relative">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-linkedin flex items-center justify-center">
          <span className="text-white text-xs font-bold leading-none">in</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 leading-tight">Saved Posts</p>
          {lastScraped ? (
            <p className="text-[10px] text-gray-400 leading-tight">
              {postCount} posts · {formatDate(lastScraped)}
            </p>
          ) : (
            <p className="text-[10px] text-gray-400 leading-tight">Not synced yet</p>
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

        {/* Open Dashboard */}
        <button
          onClick={onOpenDashboard}
          title="Open full dashboard"
          className="text-gray-400 hover:text-linkedin transition-colors"
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
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-linkedin text-white hover:bg-blue-700 active:bg-blue-800"
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
  );
}
