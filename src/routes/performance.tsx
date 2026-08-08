import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Section, Stat, WallBody, WallHeader } from "@/components/boss/Wall";
import { EnterpriseTable, type Column } from "@/components/boss/EnterpriseTable";
import { Toolbar } from "@/components/boss/Toolbar";
import { FilterSelect } from "@/components/boss/FilterSelect";
import { ExportMenu } from "@/components/boss/ExportMenu";
import { Progress } from "@/components/boss/Progress";
import { usePerformance, type PerformanceRow } from "@/lib/franchise-ops-hooks";

export const Route = createFileRoute("/performance")({
  head: () => ({
    meta: [
      { title: "Franchise Performance · Boss Panel" },
      {
        name: "description",
        content:
          "Period-wise franchise scorecards: revenue, lead conversion, ticket load, CSAT and SLA attainment.",
      },
      { property: "og:title", content: "Franchise Performance · Boss Panel" },
      {
        property: "og:description",
        content:
          "Period-wise franchise scorecards with revenue, conversion, CSAT and SLA attainment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PerformanceWall,
});

const money = (n: number) =>
  new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(n);

function PerformanceWall() {
  const { data: rows = [], isLoading, error } = usePerformance();
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const periods = useMemo(
    () => Array.from(new Set(rows.map((r) => r.period))).sort().reverse(),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        (!period || r.period === period) &&
        (!q || r.franchise.toLowerCase().includes(q) || r.period.includes(q)),
    );
  }, [rows, search, period]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const latest = periods[0];
  const latestRows = rows.filter((r) => r.period === latest);
  const sum = (f: (r: PerformanceRow) => number) =>
    latestRows.reduce((a, r) => a + f(r), 0);
  const avg = (f: (r: PerformanceRow) => number) =>
    latestRows.length ? sum(f) / latestRows.length : 0;
  const convRate = sum((r) => r.leads)
    ? Math.round((sum((r) => r.conversions) / sum((r) => r.leads)) * 100)
    : 0;

  const columns: Column<PerformanceRow>[] = [
    {
      id: "franchise",
      header: "Franchise",
      cell: (r) => <span className="font-medium text-foreground">{r.franchise}</span>,
    },
    { id: "period", header: "Period", cell: (r) => <span className="tabular-nums">{r.period}</span> },
    {
      id: "revenue",
      header: "Revenue",
      cell: (r) => <span className="tabular-nums">{money(r.revenue)}</span>,
    },
    { id: "leads", header: "Leads", cell: (r) => <span className="tabular-nums">{r.leads}</span> },
    {
      id: "conversions",
      header: "Conversions",
      cell: (r) => (
        <span className="tabular-nums">
          {r.conversions}
          <span className="ml-1.5 text-muted-foreground">
            ({r.leads ? Math.round((r.conversions / r.leads) * 100) : 0}%)
          </span>
        </span>
      ),
    },
    { id: "tickets", header: "Tickets", cell: (r) => <span className="tabular-nums">{r.tickets}</span> },
    {
      id: "csat",
      header: "CSAT",
      cell: (r) => <span className="tabular-nums">{r.csat.toFixed(1)} / 5</span>,
    },
    {
      id: "sla",
      header: "SLA",
      width: "160px",
      cell: (r) => (
        <div className="flex items-center gap-2">
          <Progress value={r.slaPercent} />
          <span className="tabular-nums text-muted-foreground">{r.slaPercent.toFixed(1)}%</span>
        </div>
      ),
    },
  ];

  return (
    <>
      <WallHeader
        eyebrow="Performance"
        title="Franchise Performance"
        description="Period-wise scorecards across revenue, conversion, support load, CSAT and SLA attainment."
      />
      <WallBody>
        <div className="wall-grid">
          <Stat label="Latest Period" value={latest ?? undefined} loading={isLoading} />
          <Stat label="Revenue" value={latestRows.length ? money(sum((r) => r.revenue)) : undefined} tone="success" />
          <Stat label="Leads" value={sum((r) => r.leads) || undefined} tone="info" />
          <Stat label="Conversion Rate" value={latestRows.length ? `${convRate}%` : undefined} />
          <Stat label="Avg CSAT" value={latestRows.length ? avg((r) => r.csat).toFixed(1) : undefined} />
          <Stat
            label="Avg SLA"
            value={latestRows.length ? `${avg((r) => r.slaPercent).toFixed(1)}%` : undefined}
            tone={avg((r) => r.slaPercent) < 90 ? "warning" : "success"}
          />
        </div>

        <Section title="Scorecards">
          <div className="space-y-3">
            <Toolbar
              search={search}
              onSearch={(v) => {
                setSearch(v);
                setPage(1);
              }}
              searchPlaceholder="Search franchise or period…"
              right={
                <>
                  <FilterSelect
                    label="Period"
                    value={period}
                    onChange={(v) => {
                      setPeriod(v);
                      setPage(1);
                    }}
                    options={periods}
                    allLabel="All periods"
                  />
                  <ExportMenu<PerformanceRow>
                    filename="franchise-performance"
                    rows={filtered}
                    sheetName="Performance"
                    permission="franchise.read"
                  />
                </>
              }
            />
            <EnterpriseTable<PerformanceRow>
              columns={columns}
              rows={paged}
              loading={isLoading}
              error={error ? "Failed to load performance data" : null}
              emptyTitle="No performance records"
              emptyDescription="Monthly franchise scorecards appear here once periods are closed."
              pagination={{
                page,
                pageSize,
                total: filtered.length,
                onPage: setPage,
                onPageSize: setPageSize,
              }}
            />
          </div>
        </Section>
      </WallBody>
    </>
  );
}
