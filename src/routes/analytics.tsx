import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Section, Stat, WallBody, WallHeader } from "@/components/boss/Wall";
import { ChartFrame, LegendToggle, useLegendToggle, useTooltipTrigger } from "@/components/boss/ChartFrame";
import { FilterBar } from "@/components/boss/FilterBar";
import { FilterSelect } from "@/components/boss/FilterSelect";
import { ExportMenu } from "@/components/boss/ExportMenu";
import { ErrorBanner, useErrorToast } from "@/components/boss/ErrorState";
import { EnterpriseTable, type Column } from "@/components/boss/EnterpriseTable";
import { useInvoices, useFranchises, useLeads } from "@/lib/data-hooks";
import { usePerformance, type PerformanceRow } from "@/lib/franchise-ops-hooks";
import { useCampaigns, useTickets } from "@/lib/modules-hooks";
import { money, num, pct } from "@/lib/module-ui";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Franchise Analytics · Boss Panel" },
      {
        name: "description",
        content:
          "Network analytics across revenue, leads, conversion, support and marketing with drill-down filters and exports.",
      },
      { property: "og:title", content: "Franchise Analytics · Boss Panel" },
      {
        property: "og:description",
        content: "Live franchise analytics: revenue trend, country mix, conversion funnel and channel performance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyticsWall,
});

const AXIS = {
  stroke: "var(--color-border)",
  tick: { fill: "var(--color-muted-foreground)", fontSize: 11 },
} as const;

const TOOLTIP_STYLE = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 10,
  fontSize: 12,
  color: "var(--color-foreground)",
} as const;

const PIE_COLORS = [
  "var(--color-primary)",
  "var(--color-info)",
  "var(--color-success)",
  "var(--color-warning)",
  "var(--destructive)",
];

function AnalyticsWall() {
  const perf = usePerformance();
  const invoices = useInvoices();
  const franchises = useFranchises();
  const leadsQ = useLeads();
  const campaigns = useCampaigns();
  const tickets = useTickets();

  const [period, setPeriod] = useState("");
  const [franchise, setFranchise] = useState("");
  const [country, setCountry] = useState("");
  const trigger = useTooltipTrigger();

  const loading =
    perf.isLoading || invoices.isLoading || franchises.isLoading || leadsQ.isLoading || campaigns.isLoading;
  const failed = perf.error || invoices.error || franchises.error || leadsQ.error || campaigns.error;
  useErrorToast(failed, "analytics");

  const perfRows = perf.data ?? [];
  const invoiceRows = invoices.data ?? [];
  const franchiseRows = franchises.data ?? [];
  const campaignRows = campaigns.data ?? [];
  const ticketRows = tickets.data ?? [];

  const periods = useMemo(() => [...new Set(perfRows.map((r) => r.period))].sort(), [perfRows]);
  const franchiseNames = useMemo(() => [...new Set(perfRows.map((r) => r.franchise))].sort(), [perfRows]);
  const countries = useMemo(() => [...new Set(franchiseRows.map((f) => f.country))].sort(), [franchiseRows]);

  const countryByFranchise = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of franchiseRows) m.set(f.company, f.country);
    return m;
  }, [franchiseRows]);

  const scoped = useMemo(
    () =>
      perfRows.filter(
        (r) =>
          (!period || r.period === period) &&
          (!franchise || r.franchise === franchise) &&
          (!country || countryByFranchise.get(r.franchise) === country),
      ),
    [perfRows, period, franchise, country, countryByFranchise],
  );

  const scopedInvoices = useMemo(
    () =>
      invoiceRows.filter(
        (i) =>
          (i.status === "paid" || i.status === "issued") &&
          (!country || i.country === country) &&
          (!franchise || i.franchise === franchise) &&
          (!period || i.issuedAt.slice(0, 7) === period),
      ),
    [invoiceRows, country, franchise, period],
  );

  const revenue = scoped.reduce((a, r) => a + r.revenue, 0);
  const leadCount = scoped.reduce((a, r) => a + r.leads, 0);
  const conversions = scoped.reduce((a, r) => a + r.conversions, 0);
  const csatRows = scoped.filter((r) => r.csat > 0);
  const avgCsat = csatRows.length ? csatRows.reduce((a, r) => a + r.csat, 0) / csatRows.length : null;
  const avgSla = scoped.length ? scoped.reduce((a, r) => a + r.slaPercent, 0) / scoped.length : null;

  const trend = useMemo(() => {
    const m = new Map<string, { period: string; revenue: number; leads: number; conversions: number }>();
    for (const r of scoped) {
      const cur = m.get(r.period) ?? { period: r.period, revenue: 0, leads: 0, conversions: 0 };
      cur.revenue += r.revenue;
      cur.leads += r.leads;
      cur.conversions += r.conversions;
      m.set(r.period, cur);
    }
    return [...m.values()].sort((a, b) => a.period.localeCompare(b.period));
  }, [scoped]);

  const byFranchise = useMemo(
    () =>
      [...
        scoped
          .reduce((m, r) => {
            m.set(r.franchise, (m.get(r.franchise) ?? 0) + r.revenue);
            return m;
          }, new Map<string, number>())
          .entries()
      ]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8),
    [scoped],
  );

  const byCountry = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of scopedInvoices) m.set(i.country || "—", (m.get(i.country || "—") ?? 0) + i.amount);
    return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [scopedInvoices]);

  const byChannel = useMemo(() => {
    const m = new Map<string, { channel: string; leads: number; conversions: number; spend: number }>();
    for (const c of campaignRows) {
      const cur = m.get(c.channel) ?? { channel: c.channel, leads: 0, conversions: 0, spend: 0 };
      cur.leads += c.leads;
      cur.conversions += c.conversions;
      cur.spend += c.spend;
      m.set(c.channel, cur);
    }
    return [...m.values()].sort((a, b) => b.leads - a.leads);
  }, [campaignRows]);

  const trendSeries = useLegendToggle(["revenue", "leads", "conversions"]);
  const channelSeries = useLegendToggle(["leads", "conversions"]);

  const drill: Column<PerformanceRow>[] = [
    {
      id: "franchise",
      header: "Franchise",
      cell: (r) => (
        <div>
          <div className="font-medium text-foreground">{r.franchise}</div>
          <div className="text-[11.5px] text-muted-foreground">
            {countryByFranchise.get(r.franchise) ?? "—"} · {r.period}
          </div>
        </div>
      ),
    },
    { id: "revenue", header: "Revenue", cell: (r) => <span className="tabular-nums">{money(r.revenue)}</span> },
    { id: "leads", header: "Leads", cell: (r) => <span className="tabular-nums">{num(r.leads)}</span> },
    { id: "conversions", header: "Conversions", cell: (r) => <span className="tabular-nums">{num(r.conversions)}</span> },
    {
      id: "conv",
      header: "Conv. Rate",
      cell: (r) => <span className="tabular-nums">{pct(r.conversions, r.leads)}</span>,
    },
    { id: "tickets", header: "Tickets", cell: (r) => <span className="tabular-nums">{num(r.tickets)}</span> },
    { id: "csat", header: "CSAT", cell: (r) => <span className="tabular-nums">{r.csat.toFixed(1)}</span> },
    { id: "slaPercent", header: "SLA", cell: (r) => <span className="tabular-nums">{r.slaPercent.toFixed(0)}%</span> },
  ];

  const reset = () => {
    setPeriod("");
    setFranchise("");
    setCountry("");
  };

  return (
    <>
      <WallHeader
        eyebrow="Analytics"
        title="Franchise Analytics"
        description="Live network analytics across revenue, demand, conversion, support quality and marketing channels."
      />
      <WallBody>
        {failed && (
          <ErrorBanner
            title="Analytics data failed to load"
            description="One or more analytics queries could not be completed."
            onRetry={() => {
              void perf.refetch();
              void invoices.refetch();
              void campaigns.refetch();
            }}
          />
        )}

        <FilterBar
          region={country}
          onRegion={setCountry}
          regions={countries}
          regionLabel="Country"
          status={franchise}
          onStatus={setFranchise}
          statuses={franchiseNames}
          statusLabel="Franchise"
          extra={
            <FilterSelect
              label="Period"
              value={period}
              onChange={setPeriod}
              options={periods}
              allLabel="All periods"
            />
          }
          right={
            <ExportMenu<PerformanceRow>
              filename="franchise-analytics"
              rows={scoped}
              sheetName="Analytics"
              permission="franchise.read"
            />
          }
          onReset={reset}
        />

        <div className="wall-grid">
          <Stat
            label="Network Revenue"
            value={revenue ? money(revenue) : undefined}
            loading={loading}
            error={failed ? "Failed to load" : null}
          />
          <Stat label="Leads" value={leadCount || undefined} tone="info" loading={loading} />
          <Stat
            label="Conversion Rate"
            value={leadCount ? pct(conversions, leadCount) : undefined}
            tone="success"
            loading={loading}
          />
          <Stat label="Avg CSAT" value={avgCsat !== null ? avgCsat.toFixed(1) : undefined} tone="success" loading={loading} />
          <Stat label="Avg SLA" value={avgSla !== null ? `${avgSla.toFixed(0)}%` : undefined} loading={loading} />
          <Stat label="Open Tickets" value={ticketRows.filter((t) => t.status === "open").length || undefined} tone="warning" />
        </div>

        <Section title="Trends">
          <div className="grid gap-3 xl:grid-cols-2">
            <ChartFrame
              title="Revenue & demand trend"
              subtitle="Per reporting period, filtered selection"
              loading={loading}
              error={failed ? "Query failed" : null}
              empty={trend.length === 0}
              onRetry={() => void perf.refetch()}
              footer={
                <LegendToggle
                  items={[
                    { key: "revenue", label: "Revenue", color: "var(--color-primary)" },
                    { key: "leads", label: "Leads", color: "var(--color-info)" },
                    { key: "conversions", label: "Conversions", color: "var(--color-success)" },
                  ]}
                  isHidden={trendSeries.isHidden}
                  onToggle={trendSeries.toggle}
                />
              }
            >
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trend}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="period" {...AXIS} />
                  <YAxis {...AXIS} />
                  <Tooltip trigger={trigger} contentStyle={TOOLTIP_STYLE} />
                  {!trendSeries.isHidden("revenue") && (
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--color-primary)"
                      fill="var(--color-primary)"
                      fillOpacity={0.15}
                    />
                  )}
                  {!trendSeries.isHidden("leads") && (
                    <Area type="monotone" dataKey="leads" stroke="var(--color-info)" fill="var(--color-info)" fillOpacity={0.12} />
                  )}
                  {!trendSeries.isHidden("conversions") && (
                    <Area
                      type="monotone"
                      dataKey="conversions"
                      stroke="var(--color-success)"
                      fill="var(--color-success)"
                      fillOpacity={0.12}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </ChartFrame>

            <ChartFrame
              title="Revenue by franchise"
              subtitle="Top performers in the current filter"
              loading={loading}
              error={failed ? "Query failed" : null}
              empty={byFranchise.length === 0}
            >
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byFranchise} layout="vertical">
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" {...AXIS} />
                  <YAxis type="category" dataKey="name" width={130} {...AXIS} />
                  <Tooltip trigger={trigger} contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="var(--color-primary)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>

            <ChartFrame
              title="Invoiced revenue by country"
              subtitle="Paid and issued invoices"
              loading={invoices.isLoading}
              error={invoices.error ? "Query failed" : null}
              empty={byCountry.length === 0}
              minWidth={360}
            >
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Tooltip trigger={trigger} contentStyle={TOOLTIP_STYLE} />
                  <Pie data={byCountry} dataKey="value" nameKey="name" innerRadius={48} outerRadius={84}>
                    {byCountry.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </ChartFrame>

            <ChartFrame
              title="Marketing channel performance"
              subtitle="Leads vs conversions per channel"
              loading={campaigns.isLoading}
              error={campaigns.error ? "Query failed" : null}
              empty={byChannel.length === 0}
              footer={
                <LegendToggle
                  items={[
                    { key: "leads", label: "Leads", color: "var(--color-info)" },
                    { key: "conversions", label: "Conversions", color: "var(--color-success)" },
                  ]}
                  isHidden={channelSeries.isHidden}
                  onToggle={channelSeries.toggle}
                />
              }
            >
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={byChannel}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="channel" {...AXIS} />
                  <YAxis {...AXIS} />
                  <Tooltip trigger={trigger} contentStyle={TOOLTIP_STYLE} />
                  {!channelSeries.isHidden("leads") && (
                    <Line type="monotone" dataKey="leads" stroke="var(--color-info)" strokeWidth={2} dot={false} />
                  )}
                  {!channelSeries.isHidden("conversions") && (
                    <Line type="monotone" dataKey="conversions" stroke="var(--color-success)" strokeWidth={2} dot={false} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </ChartFrame>
          </div>
        </Section>

        <Section title="Drill-down">
          <EnterpriseTable<PerformanceRow>
            columns={drill}
            rows={scoped}
            loading={perf.isLoading}
            error={perf.error ? "Failed to load performance records" : null}
            emptyTitle="No records in this selection"
            emptyDescription="Adjust the period, country or franchise filters to widen the analysis window."
          />
        </Section>
      </WallBody>
    </>
  );
}
