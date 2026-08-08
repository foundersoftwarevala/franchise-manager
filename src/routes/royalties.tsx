import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Section, Stat, WallBody, WallHeader } from "@/components/boss/Wall";
import { EnterpriseTable, type Column } from "@/components/boss/EnterpriseTable";
import { Toolbar } from "@/components/boss/Toolbar";
import { FilterSelect } from "@/components/boss/FilterSelect";
import { ExportMenu } from "@/components/boss/ExportMenu";
import { StatusBadge } from "@/components/boss/StatusBadge";
import { useToast } from "@/lib/toast";
import {
  useRoyalties,
  useSetRoyaltyStatus,
  type RoyaltyRow,
} from "@/lib/franchise-ops-hooks";

export const Route = createFileRoute("/royalties")({
  head: () => ({
    meta: [
      { title: "Royalty Billing · Boss Panel" },
      {
        name: "description",
        content:
          "Franchise royalty cycles: gross sales, royalty and commission due, collections and arrears tracking.",
      },
      { property: "og:title", content: "Royalty Billing · Boss Panel" },
      {
        property: "og:description",
        content:
          "Royalty cycles with gross sales, dues, collections and arrears per franchise.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RoyaltiesWall,
});

const money = (n: number) =>
  new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(n);

const ACTION_CLS =
  "inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 text-[12px] font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]";

function RoyaltiesWall() {
  const { data: rows = [], isLoading, error } = useRoyalties();
  const setStatus = useSetRoyaltyStatus();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [status, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        (!status || r.status === status) &&
        (!q || r.franchise.toLowerCase().includes(q) || r.period.includes(q)),
    );
  }, [rows, search, status]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const sum = (f: (r: RoyaltyRow) => number, pred?: (r: RoyaltyRow) => boolean) =>
    rows.filter((r) => (pred ? pred(r) : true)).reduce((a, r) => a + f(r), 0);

  const outstanding = sum(
    (r) => r.royaltyDue - r.paidAmount,
    (r) => r.status !== "paid" && r.status !== "void",
  );

  const apply = (next: "paid" | "partial" | "overdue" | "due") => {
    const ids = [...selected];
    if (!ids.length) return;
    setStatus.mutate(
      { ids, status: next },
      {
        onSuccess: () => {
          toast({ title: `${ids.length} cycle(s) marked ${next}`, tone: "success" });
          setSelected(new Set());
        },
        onError: (e) =>
          toast({ title: "Update failed", description: String(e), tone: "destructive" }),
      },
    );
  };

  const columns: Column<RoyaltyRow>[] = [
    {
      id: "franchise",
      header: "Franchise",
      cell: (r) => <span className="font-medium text-foreground">{r.franchise}</span>,
    },
    { id: "period", header: "Period", cell: (r) => <span className="tabular-nums">{r.period}</span> },
    { id: "gross", header: "Gross Sales", cell: (r) => <span className="tabular-nums">{money(r.grossSales)}</span> },
    { id: "rate", header: "Rate", cell: (r) => <span className="tabular-nums">{r.royaltyRate}%</span> },
    { id: "royalty", header: "Royalty Due", cell: (r) => <span className="tabular-nums">{money(r.royaltyDue)}</span> },
    {
      id: "commission",
      header: "Commission Due",
      cell: (r) => <span className="tabular-nums">{money(r.commissionDue)}</span>,
    },
    { id: "paid", header: "Collected", cell: (r) => <span className="tabular-nums">{money(r.paidAmount)}</span> },
    { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    {
      id: "due",
      header: "Due Date",
      cell: (r) => <span className="text-muted-foreground">{r.dueDate ?? "—"}</span>,
    },
  ];

  return (
    <>
      <WallHeader
        eyebrow="Royalties"
        title="Royalty Billing"
        description="Royalty and commission cycles per franchise with collections, arrears and settlement status."
      />
      <WallBody>
        <div className="wall-grid">
          <Stat label="Cycles" value={rows.length || undefined} loading={isLoading} />
          <Stat label="Royalty Billed" value={rows.length ? money(sum((r) => r.royaltyDue)) : undefined} tone="info" />
          <Stat label="Collected" value={rows.length ? money(sum((r) => r.paidAmount)) : undefined} tone="success" />
          <Stat label="Outstanding" value={rows.length ? money(outstanding) : undefined} tone="warning" />
          <Stat
            label="Overdue Cycles"
            value={rows.filter((r) => r.status === "overdue").length || undefined}
            tone="destructive"
          />
          <Stat
            label="Commission Billed"
            value={rows.length ? money(sum((r) => r.commissionDue)) : undefined}
          />
        </div>

        <Section title="Royalty Cycles">
          <div className="space-y-3">
            <Toolbar
              search={search}
              onSearch={(v) => {
                setSearch(v);
                setPage(1);
              }}
              searchPlaceholder="Search franchise or period…"
              selectedCount={selected.size}
              bulkActions={
                <>
                  <button type="button" className={ACTION_CLS} onClick={() => apply("paid")}>
                    Mark Paid
                  </button>
                  <button type="button" className={ACTION_CLS} onClick={() => apply("partial")}>
                    Mark Partial
                  </button>
                  <button type="button" className={ACTION_CLS} onClick={() => apply("overdue")}>
                    Flag Overdue
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
                    options={["due", "partial", "paid", "overdue", "void"]}
                    allLabel="All statuses"
                  />
                  <ExportMenu<RoyaltyRow>
                    filename="franchise-royalties"
                    rows={filtered}
                    sheetName="Royalties"
                    permission="franchise.read"
                  />
                </>
              }
            />
            <EnterpriseTable<RoyaltyRow>
              columns={columns}
              rows={paged}
              loading={isLoading}
              error={error ? "Failed to load royalty cycles" : null}
              emptyTitle="No royalty cycles"
              emptyDescription="Billed royalty and commission cycles appear here per franchise period."
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
                setSelected((prev) =>
                  prev.size === paged.length ? new Set() : new Set(paged.map((r) => r.id)),
                )
              }
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
