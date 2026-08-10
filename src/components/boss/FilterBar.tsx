import type { ReactNode } from "react";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { FilterSelect } from "./FilterSelect";

export type DateRangeKey = "7d" | "30d" | "90d" | "ytd" | "all";

export const DATE_RANGES: { value: DateRangeKey; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "ytd", label: "Year to date" },
  { value: "all", label: "All time" },
];

export function rangeCutoff(range: DateRangeKey): number {
  if (range === "all") return 0;
  if (range === "ytd") return new Date(new Date().getFullYear(), 0, 1).getTime();
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return Date.now() - days * 86400_000;
}

/**
 * Shared responsive filter bar (date / region / status) so every dashboard view
 * uses identical spacing, typography and control density.
 */
export function FilterBar({
  range,
  onRange,
  region,
  onRegion,
  regions = [],
  regionLabel = "Region",
  status,
  onStatus,
  statuses = [],
  statusLabel = "Status",
  extra,
  right,
  onReset,
}: {
  range?: DateRangeKey;
  onRange?: (r: DateRangeKey) => void;
  region?: string;
  onRegion?: (v: string) => void;
  regions?: string[];
  regionLabel?: string;
  status?: string;
  onStatus?: (v: string) => void;
  statuses?: string[];
  statusLabel?: string;
  extra?: ReactNode;
  right?: ReactNode;
  onReset?: () => void;
}) {
  const dirty =
    (range !== undefined && range !== "all") || Boolean(region) || Boolean(status);

  return (
    <div
      role="group"
      aria-label="Dashboard filters"
      className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-2 lg:flex-row lg:flex-wrap lg:items-center"
    >
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="lg:sr-only">Filters</span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
        {range !== undefined && onRange && (
          <FilterSelect
            label="Date"
            value={range === "all" ? "" : range}
            onChange={(v) => onRange((v || "all") as DateRangeKey)}
            options={DATE_RANGES.filter((r) => r.value !== "all")}
            allLabel="All time"
          />
        )}
        {region !== undefined && onRegion && (
          <FilterSelect label={regionLabel} value={region} onChange={onRegion} options={regions} />
        )}
        {status !== undefined && onStatus && (
          <FilterSelect label={statusLabel} value={status} onChange={onStatus} options={statuses} />
        )}
        {extra}
      </div>

      <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
        {onReset && dirty && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reset
          </button>
        )}
        {right}
      </div>
    </div>
  );
}
