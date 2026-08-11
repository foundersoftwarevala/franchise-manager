import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Section, Stat, WallBody, WallHeader } from "@/components/boss/Wall";
import { EnterpriseTable, type Column } from "@/components/boss/EnterpriseTable";
import { Toolbar } from "@/components/boss/Toolbar";
import { FilterSelect } from "@/components/boss/FilterSelect";
import { ExportMenu } from "@/components/boss/ExportMenu";
import { StatusBadge } from "@/components/boss/StatusBadge";
import { ACTION_CLS, compact, money, num } from "@/lib/module-ui";
import { useToast } from "@/lib/toast";
import { useCountries, useSetCountryStatus, type CountryRow } from "@/lib/modules-hooks";

export const Route = createFileRoute("/countries")({
  head: () => ({
    meta: [
      { title: "Country Management · Boss Panel" },
      {
        name: "description",
        content:
          "Operating countries with market sizing, population reach, coverage, currency rules and expansion plans.",
      },
      { property: "og:title", content: "Country Management · Boss Panel" },
      {
        property: "og:description",
        content: "Franchise country registry with market size, coverage and expansion planning.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CountriesWall,
});

function CountriesWall() {
  const { data: rows = [], isLoading, error } = useCountries();
  const setStatus = useSetCountryStatus();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [status, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(
      (c) =>
        (!status || c.status === status) &&
        (!q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)),
    );
  }, [rows, search, status]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const apply = async (next: string) => {
    const ids = [...selected];
    if (ids.length === 0) return;
    try {
      await setStatus.mutateAsync({ ids, status: next });
      setSelected(new Set());
      toast({ title: `${ids.length} countries set to ${next}`, tone: "success" });
    } catch (err) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "No changes saved.",
        tone: "destructive",
      });
    }
  };

  const columns: Column<CountryRow>[] = [
    {
      id: "name",
      header: "Country",
      cell: (c) => (
        <div>
          <div className="font-medium text-foreground">{c.name}</div>
          <div className="text-[11.5px] text-muted-foreground">{c.code}</div>
        </div>
      ),
    },
    { id: "currency", header: "Currency", cell: (c) => c.currency },
    { id: "population", header: "Population", cell: (c) => <span className="tabular-nums">{compact(c.population)}</span> },
    {
      id: "marketSize",
      header: "Market Size",
      cell: (c) => <span className="tabular-nums">{money(c.marketSize, c.currency)}</span>,
    },
    {
      id: "coveragePct",
      header: "Coverage",
      cell: (c) => (
        <span className={`tabular-nums ${c.coveragePct < 25 ? "text-muted-foreground" : "text-foreground"}`}>
          {c.coveragePct}%
        </span>
      ),
    },
    { id: "status", header: "Status", cell: (c) => <StatusBadge status={c.status} /> },
    {
      id: "expansionPlan",
      header: "Expansion Plan",
      cell: (c) => <span className="text-muted-foreground">{c.expansionPlan || "—"}</span>,
    },
  ];

  const count = (f: (c: CountryRow) => boolean) => rows.filter(f).length;
  const reach = rows.reduce((a, c) => a + c.population, 0);
  const avgCoverage = rows.length
    ? (rows.reduce((a, c) => a + c.coveragePct, 0) / rows.length).toFixed(1)
    : "0";

  return (
    <>
      <WallHeader
        eyebrow="Countries"
        title="Country Management"
        description="Define operating countries, market sizing, expansion plans and currency rules."
      />
      <WallBody>
        <div className="wall-grid">
          <Stat
            label="Active Countries"
            value={count((c) => c.status === "active") || undefined}
            tone="success"
            loading={isLoading}
            error={error ? "Failed to load" : null}
          />
          <Stat label="Planned" value={count((c) => c.status === "planned") || undefined} tone="info" />
          <Stat label="Total Population (Reach)" value={rows.length ? compact(reach) : undefined} />
          <Stat label="Avg Coverage" value={rows.length ? `${avgCoverage}%` : undefined} tone="warning" />
        </div>

        <Section title="Countries" description={`${num(rows.length)} markets tracked`}>
          <div className="space-y-3">
            <Toolbar
              search={search}
              onSearch={(v) => {
                setSearch(v);
                setPage(1);
              }}
              searchPlaceholder="Search country or code…"
              selectedCount={selected.size}
              bulkActions={
                <>
                  <button type="button" className={ACTION_CLS} onClick={() => apply("active")}>
                    Mark Active
                  </button>
                  <button type="button" className={ACTION_CLS} onClick={() => apply("planned")}>
                    Mark Planned
                  </button>
                  <button type="button" className={ACTION_CLS} onClick={() => apply("paused")}>
                    Pause
                  </button>
                </>
              }
              right={
                <>
                  <FilterSelect
                    label="Status"
                    value={status}
                    onChange={(v) => {
                      setStatusFilter(v);
                      setPage(1);
                    }}
                    options={["active", "planned", "paused"]}
                    allLabel="All statuses"
                  />
                  <ExportMenu<CountryRow>
                    filename="franchise-countries"
                    rows={filtered}
                    sheetName="Countries"
                    permission="franchise.read"
                  />
                </>
              }
            />
            <EnterpriseTable<CountryRow>
              columns={columns}
              rows={paged}
              loading={isLoading}
              error={error ? "Failed to load countries" : null}
              emptyTitle="No countries"
              emptyDescription="Operating markets appear here once countries are registered."
              selected={selected}
              onToggle={(id) =>
                setSelected((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                })
              }
              onToggleAll={() =>
                setSelected((prev) => (prev.size === paged.length ? new Set() : new Set(paged.map((r) => r.id))))
              }
              pagination={{ page, pageSize, total: filtered.length, onPage: setPage, onPageSize: setPageSize }}
            />
          </div>
        </Section>
      </WallBody>
    </>
  );
}
