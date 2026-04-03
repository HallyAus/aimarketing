const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;
const WEEK = 604800;
const MONTH = 2592000;
const YEAR = 31536000;

export function relativeTime(date: Date | string | null | undefined): string {
  if (!date) return "Never";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = Date.now();
  const diffSec = Math.floor((now - d.getTime()) / 1000);

  if (diffSec < 0) {
    const absSec = Math.abs(diffSec);
    if (absSec < MINUTE) return "in a few seconds";
    if (absSec < HOUR) return `in ${Math.floor(absSec / MINUTE)}m`;
    if (absSec < DAY) return `in ${Math.floor(absSec / HOUR)}h`;
    if (absSec < WEEK) return `in ${Math.floor(absSec / DAY)}d`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  if (diffSec < 10) return "just now";
  if (diffSec < MINUTE) return `${diffSec}s ago`;
  if (diffSec < HOUR) return `${Math.floor(diffSec / MINUTE)}m ago`;
  if (diffSec < DAY) return `${Math.floor(diffSec / HOUR)}h ago`;
  if (diffSec < WEEK) return `${Math.floor(diffSec / DAY)}d ago`;
  if (diffSec < MONTH) return `${Math.floor(diffSec / WEEK)}w ago`;
  if (diffSec < YEAR) return `${Math.floor(diffSec / MONTH)}mo ago`;
  return `${Math.floor(diffSec / YEAR)}y ago`;
}
