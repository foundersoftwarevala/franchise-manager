import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Invoice, RevenueStream } from "@/lib/data-hooks";
import { Section } from "./Wall";
import { ChartFrame, LegendToggle, useLegendToggle, useTooltipTrigger } from "./ChartFrame";
import { fmtMoney } from "@/lib/export";


type Range = "7d" | "30d" | "90d" | "ytd";

const STREAM_COLORS: Record<RevenueStream, string> = {
  royalty: "var(--color-primary)",
  subscription: "var(--color-info)",
  license: "var(--color-success)",
  renewal: "var(--color-warning)",
  product: "var(--color-accent, var(--color-primary))",
};

export function RevenueCharts({
  invoices,
  loading,
  error,
  range,
  onRangeChange,
  onRetry,
}: {
  invoices: Invoice[];
  loading?: boolean;
  error?: boolean;
  range: Range;
  onRangeChange: (r: Range) => void;
  onRetry?: () => void;
}) {

  const paid = useMemo(() => invoices.filter((i) => i.status === "paid" || i.status === "issued"), [invoices]);

  const byCountry = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of paid) m.set(i.country || "—", (m.get(i.country || "—") ?? 0) + i.amount);
    return Array.from(m, ([country, amount]) => ({ country, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [paid]);

  const byStream = useMemo(() => {
    const m = new Map<RevenueStream, number>();
    for (const i of paid) m.set(i.type, (m.get(i.type) ?? 0) + i.amount);
    return Array.from(m, ([type, amount]) => ({ type, amount }));
  }, [paid]);

  const overTime = useMemo(() => {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365;
    const cutoff = Date.now() - days * 86400_000;
    const buckets = new Map<string, number>();
    for (const i of paid) {
      const t = Date.parse(i.issuedAt);
      if (!Number.isFinite(t) || t < cutoff) continue;
      const key = new Date(t).toISOString().slice(0, 10);
      buckets.set(key, (buckets.get(key) ?? 0) + i.amount);
    }
    return Array.from(buckets, ([date, amount]) => ({ date, amount })).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }, [paid, range]);

  const empty = !loading && !error && paid.length === 0;
  const errorText = error ? "Revenue aggregates are unavailable right now." : null;
  const trigger = useTooltipTrigger();

  const streamKeys = useMemo(() => byStream.map((s) => s.type as string), [byStream]);
  const streamLegend = useLegendToggle(streamKeys);
  const visibleStreams = byStream.filter((s) => !streamLegend.isHidden(s.type));

  const countryKeys = useMemo(() => byCountry.map((c) => c.country), [byCountry]);
  const countryLegend = useLegendToggle(countryKeys);
  const visibleCountries = byCountry.filter((c) => !countryLegend.isHidden(c.country));

  return (
    <Section
      title="Revenue Breakdown"
      description="Live aggregates from the filtered invoice ledger. Charts respect search, status, type and country filters."
      actions={
        <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-0.5">
          {(["7d", "30d", "90d", "ytd"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              aria-pressed={range === r}
              className={`min-h-8 rounded px-2.5 py-1 text-[11.5px] font-medium uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] ${
                range === r ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartFrame
          title="Revenue Over Time"
          subtitle={`Paid + issued · last ${range.toUpperCase()}`}
          loading={loading}
          error={errorText}
          empty={empty || overTime.length === 0}
          emptyText="No revenue in this window"
          onRetry={onRetry}
          minWidth={420}
        >
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={overTime} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => fmtMoney(v)} width={70} />
              <Tooltip trigger={trigger} formatter={(v: number) => fmtMoney(v)} contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="amount" stroke="var(--color-primary)" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame
          title="Revenue by Country"
          subtitle="Top 10 countries by gross revenue"
          loading={loading}
          error={errorText}
          empty={byCountry.length === 0}
          emptyText="No country revenue yet"
          onRetry={onRetry}
          minWidth={Math.max(420, byCountry.length * 60)}
          footer={
            <LegendToggle
              items={countryKeys.map((c) => ({ key: c, label: c, color: "var(--color-primary)" }))}
              isHidden={countryLegend.isHidden}
              onToggle={countryLegend.toggle}
            />
          }
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={visibleCountries} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="country" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => fmtMoney(v)} width={70} />
              <Tooltip trigger={trigger} formatter={(v: number) => fmtMoney(v)} contentStyle={tooltipStyle} />
              <Bar dataKey="amount" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame
          title="Revenue by Product / Stream"
          subtitle="Royalty, subscription, license, renewal, product"
          loading={loading}
          error={errorText}
          empty={byStream.length === 0}
          emptyText="No stream revenue yet"
          onRetry={onRetry}
          minWidth={280}
          footer={
            <LegendToggle
              items={streamKeys.map((s) => ({
                key: s,
                label: s,
                color: STREAM_COLORS[s as RevenueStream] ?? "var(--color-primary)",
              }))}
              isHidden={streamLegend.isHidden}
              onToggle={streamLegend.toggle}
            />
          }
        >
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Tooltip trigger={trigger} formatter={(v: number) => fmtMoney(v)} contentStyle={tooltipStyle} />
              <Pie data={visibleStreams} dataKey="amount" nameKey="type" innerRadius={45} outerRadius={75} paddingAngle={2}>
                {visibleStreams.map((s) => (
                  <Cell key={s.type} fill={STREAM_COLORS[s.type]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartFrame>
      </div>
    </Section>
  );
}

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 6,
  fontSize: 12,
  color: "var(--color-popover-foreground)",
};

