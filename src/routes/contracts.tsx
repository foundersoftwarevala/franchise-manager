import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Section, Stat, WallBody, WallHeader } from "@/components/boss/Wall";
import { EnterpriseTable, type Column } from "@/components/boss/EnterpriseTable";
import { Toolbar } from "@/components/boss/Toolbar";
import { FilterSelect } from "@/components/boss/FilterSelect";
import { ExportMenu } from "@/components/boss/ExportMenu";
import { StatusBadge } from "@/components/boss/StatusBadge";
import { useContracts, type ContractRow } from "@/lib/franchise-ops-hooks";

export const Route = createFileRoute("/contracts")({
  head: () => ({
    meta: [
      { title: "Franchise Contracts · Boss Panel" },
      {
        name: "description",
        content:
          "Agreement register for master, unit and area-developer contracts with expiry and renewal tracking.",
      },
      { property: "og:title", content: "Franchise Contracts · Boss Panel" },
      {
        property: "og:description",
        content:
          "Contract register with contract value, term, expiry and renewal status per franchise.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContractsWall,
});

const money = (n: number) =>
  new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(n);

const daysLeft = (end: string) =>
  Math.ceil((new Date(end).getTime() - Date.now()) / 86_400_000);

function ContractsWall() {
  const { data: rows = [], isLoading, error } = useContracts();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [renewal, setRenewal] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(
      (c) =>
        (!type || c.contractType === type) &&
        (!renewal || c.renewalStatus === renewal) &&
        (!q ||
          c.franchise.toLowerCase().includes(q) ||
          c.contractNo.toLowerCase().includes(q)),
    );
  }, [rows, search, type, renewal]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const expiring = rows.filter((c) => daysLeft(c.endDate) <= 90 && daysLeft(c.endDate) >= 0);

  const columns: Column<ContractRow>[] = [
    {
      id: "contractNo",
      header: "Contract",
      cell: (c) => <span className="font-medium text-foreground">{c.contractNo}</span>,
    },
    { id: "franchise", header: "Franchise", cell: (c) => c.franchise },
    {
      id: "type",
      header: "Type",
      cell: (c) => (
        <span className="capitalize text-muted-foreground">{c.contractType.replace(/_/g, " ")}</span>
      ),
    },
    {
      id: "term",
      header: "Term",
      cell: (c) => (
        <span className="tabular-nums text-muted-foreground">
          {c.startDate} → {c.endDate}
        </span>
      ),
    },
    {
      id: "daysLeft",
      header: "Days Left",
      cell: (c) => {
        const d = daysLeft(c.endDate);
        return (
          <span
            className={`tabular-nums ${d < 0 ? "text-destructive" : d <= 90 ? "text-[color:var(--color-warning)]" : ""}`}
          >
            {d < 0 ? `${Math.abs(d)} overdue` : d}
          </span>
        );
      },
    },
    { id: "value", header: "Value", cell: (c) => <span className="tabular-nums">{money(c.value)}</span> },
    { id: "status", header: "Status", cell: (c) => <StatusBadge status={c.status} /> },
    { id: "renewal", header: "Renewal", cell: (c) => <StatusBadge status={c.renewalStatus} /> },
    {
      id: "signed",
      header: "Signed",
      cell: (c) => <span className="text-muted-foreground">{c.signedAt ?? "—"}</span>,
    },
  ];

  return (
    <>
      <WallHeader
        eyebrow="Contracts"
        title="Franchise Contracts"
        description="Agreement register with contract value, term, expiry countdown and renewal pipeline."
      />
      <WallBody>
        <div className="wall-grid">
          <Stat label="Contracts" value={rows.length || undefined} loading={isLoading} />
          <Stat
            label="Active"
            value={rows.filter((c) => c.status === "active").length || undefined}
            tone="success"
          />
          <Stat label="Expiring ≤ 90d" value={expiring.length || undefined} tone="warning" />
          <Stat
            label="At Risk"
            value={rows.filter((c) => c.renewalStatus === "at_risk").length || undefined}
            tone="destructive"
          />
          <Stat
            label="Under Review"
            value={rows.filter((c) => c.status === "under_review").length || undefined}
            tone="info"
          />
          <Stat
            label="Contract Value"
            value={rows.length ? money(rows.reduce((a, c) => a + c.value, 0)) : undefined}
          />
        </div>

        <Section title="Agreement Register">
          <div className="space-y-3">
            <Toolbar
              search={search}
              onSearch={(v) => {
                setSearch(v);
                setPage(1);
              }}
              searchPlaceholder="Search contract number or franchise…"
              right={
                <>
                  <FilterSelect
                    label="Type"
                    value={type}
                    onChange={(v) => {
                      setType(v);
                      setPage(1);
                    }}
                    options={["master_franchise", "unit_franchise", "area_developer", "addendum"]}
                    allLabel="All types"
                  />
                  <FilterSelect
                    label="Renewal"
                    value={renewal}
                    onChange={(v) => {
                      setRenewal(v);
                      setPage(1);
                    }}
                    options={["not_due", "due_soon", "at_risk"]}
                    allLabel="All"
                  />
                  <ExportMenu<ContractRow>
                    filename="franchise-contracts"
                    rows={filtered}
                    sheetName="Contracts"
                    permission="franchise.read"
                  />
                </>
              }
            />
            <EnterpriseTable<ContractRow>
              columns={columns}
              rows={paged}
              loading={isLoading}
              error={error ? "Failed to load contracts" : null}
              emptyTitle="No contracts yet"
              emptyDescription="Signed franchise agreements appear here with term and renewal tracking."
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
