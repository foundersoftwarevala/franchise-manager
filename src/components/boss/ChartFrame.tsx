import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertCircle, BarChart3, RefreshCw } from "lucide-react";
import { Card } from "./Wall";

/** True on touch-primary devices, so charts can switch to tap tooltips. */
export function useIsTouch() {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(hover: none), (pointer: coarse)");
    setTouch(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setTouch(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return touch;
}

/** Recharts tooltip trigger: tap on touch, hover on pointer devices. */
export function useTooltipTrigger(): "hover" | "click" {
  return useIsTouch() ? "click" : "hover";
}

/** Toggleable legend state shared by every chart. */
export function useLegendToggle(keys: string[]) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const signature = keys.join("|");
  useEffect(() => {
    setHidden((prev) => {
      const next = new Set(Array.from(prev).filter((k) => keys.includes(k)));
      return next.size === prev.size ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const toggle = (key: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const isHidden = (key: string) => hidden.has(key);
  const visible = useMemo(() => keys.filter((k) => !hidden.has(k)), [keys, hidden]);
  return { hidden, isHidden, toggle, visible };
}

export function LegendToggle({
  items,
  isHidden,
  onToggle,
}: {
  items: { key: string; label: string; color: string }[];
  isHidden: (key: string) => boolean;
  onToggle: (key: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Toggle chart series">
      {items.map((i) => {
        const off = isHidden(i.key);
        return (
          <button
            key={i.key}
            type="button"
            onClick={() => onToggle(i.key)}
            aria-pressed={!off}
            className={`inline-flex min-h-8 items-center gap-1.5 rounded-md border px-2 py-1 text-[11.5px] font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] ${
              off
                ? "border-border bg-surface text-muted-foreground line-through"
                : "border-primary/40 bg-accent/50 text-foreground"
            }`}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: off ? "var(--color-border)" : i.color }}
              aria-hidden="true"
            />
            {i.label}
          </button>
        );
      })}
    </div>
  );
}

function ChartSkeleton({ height }: { height: number }) {
  const bars = [42, 61, 34, 72, 50, 84, 58, 76, 46, 90, 66, 55];
  return (
    <div
      className="flex items-end gap-2 rounded-md border border-dashed border-border p-3"
      style={{ height }}
      aria-hidden="true"
    >
      {bars.map((h, i) => (
        <div key={i} className="flex-1 animate-pulse rounded-t bg-surface-2" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

/**
 * Shared chart wrapper: consistent header, column-aware skeleton, inline error
 * with retry, empty state, and horizontal scroll on small screens.
 */
export function ChartFrame({
  title,
  subtitle,
  actions,
  height = 220,
  minWidth = 420,
  loading = false,
  error = null,
  empty = false,
  emptyText = "No data in this window",
  onRetry,
  footer,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  height?: number;
  minWidth?: number;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyText?: string;
  onRetry?: () => void;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <div className="truncate text-[12px] font-semibold text-foreground">{title}</div>
          {subtitle && <div className="truncate text-[11px] text-muted-foreground">{subtitle}</div>}
        </div>
        {actions}
      </div>

      <div className="mt-2">
        {loading ? (
          <>
            <ChartSkeleton height={height} />
            <span className="sr-only">Loading {title}</span>
          </>
        ) : error ? (
          <div
            role="alert"
            className="grid place-items-center gap-2 rounded-md border border-[color:color-mix(in_oklab,var(--destructive)_30%,transparent)] bg-[color:color-mix(in_oklab,var(--destructive)_7%,transparent)] p-4 text-center"
            style={{ minHeight: height }}
          >
            <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
            <div className="text-[12.5px] font-medium text-destructive">Couldn’t load {title.toLowerCase()}</div>
            <div className="max-w-xs text-[11.5px] text-muted-foreground">{error}</div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-1 inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-[12px] font-medium text-foreground transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Retry
              </button>
            )}
          </div>
        ) : empty ? (
          <div
            className="grid place-items-center gap-2 rounded-md border border-dashed border-border p-4 text-center"
            style={{ minHeight: height }}
          >
            <BarChart3 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <div className="text-[12px] text-muted-foreground">{emptyText}</div>
          </div>
        ) : (
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <div style={{ minWidth }}>{children}</div>
          </div>
        )}
      </div>

      {!loading && !error && footer}
    </Card>
  );
}
