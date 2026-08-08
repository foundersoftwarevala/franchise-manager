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
  useEscalations,
  useSetEscalationStatus,
  type EscalationRow,
} from "@/lib/franchise-ops-hooks";

export const Route = createFileRoute("/escalations")({
  head: () => ({
    meta: [
      { title: "Escalations · Boss Panel" },
      {
        name: "description",
        content:
          "Cross-functional franchise escalations with priority, ownership, SLA deadlines and resolution notes.",
      },
      { property: "og:title", content: "Escalations · Boss Panel" },
      {
        property: "og:description",
        content:
          "Franchise escalation desk with priority, owner, SLA countdown and resolution tracking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EscalationsWall,
});

const ACTION_CLS =
  "inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 text-[12px] font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]";

function EscalationsWall() {
  const { data: rows = [], isLoading, error } = useEscalations();
  const setStatus = useSetEscalationStatus();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(
      (e) =>
        (!priority || e.priority === priority) &&
        (!category || e.category === category) &&
        (!q ||
          e.title.toLowerCase().includes(q) ||
          e.franchise.toLowerCase().includes(q) ||
          e.assignedTo.toLowerCase().includes(q)),
    );
  }, [rows, search, priority, category]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const breached = rows.filter(
    (e) =>
      e.slaDue &&
      new Date(e.slaDue).getTime() < Date.now() &&
      e.status !== "resolved" &&
      e.status !== "closed",
  ).length;

  const apply = (next: "in_progress" | "resolved" | "closed") => {
    const ids = [...selected];
    if (!ids.length) return;
    setStatus.mutate(
      { ids, status: next },
      {
        onSuccess: () => {
          toast({ title: `${ids.length} escalation(s) marked ${next.replace(/_/g, " ")}`, tone: "success" });
          setSelected(new Set());
        },
        onError: (e) =>
          toast({ title: "Update failed", description: String(e), tone: "destructive" }),
      },
    );
  };

  const columns: Column<EscalationRow>[] = [
    {
      id: "title",
      header: "Escalation",
      cell: (e) => <span className="font-medium text-foreground">{e.title}</span>,
    },
    { id: "franchise", header: "Franchise", cell: (e) => e.franchise },
    {
      id: "category",
      header: "Category",
      cell: (e) => <span className="capitalize text-muted-foreground">{e.category}</span>,
    },
    { id: "priority", header: "Priority", cell: (e) => <StatusBadge status={e.priority} /> },
    { id: "status", header: "Status", cell: (e) => <StatusBadge status={e.status} /> },
    { id: "assignedTo", header: "Owner", cell: (e) => e.assignedTo || <span className="text-muted-foreground">Unassigned</span> },
    {
      id: "slaDue",
      header: "SLA Due",
      cell: (e) => {
        if (!e.slaDue) return <span className="text-muted-foreground">—</span>;
        const overdue =
          new Date(e.slaDue).getTime() < Date.now() && e.status !== "resolved" && e.status !== "closed";
        return (
          <span className={`tabular-nums ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
            {e.slaDue.slice(0, 10)}
            {overdue ? " · breached" : ""}
          </span>
        );
      },
    },
    {
      id: "resolution",
      header: "Resolution",
      cell: (e) => <span className="text-muted-foreground">{e.resolution ?? "—"}</span>,
    },
  ];

  const count = (f: (e: EscalationRow) => boolean) => rows.filter(f).length;

  return (
    <>
      <WallHeader
        eyebrow="Escalations"
        title="Escalation Desk"
        description="Cross-functional franchise escalations with priority, ownership, SLA deadlines and resolution notes."
      />
      <WallBody>
        <div className="wall-grid">
          <Stat label="Open" value={count((e) => e.status === "open") || undefined} tone="warning" loading={isLoading} />
          <Stat label="In Progress" value={count((e) => e.status === "in_progress") || undefined} tone="info" />
          <Stat label="Critical" value={count((e) => e.priority === "critical") || undefined} tone="destructive" />
          <Stat label="SLA Breached" value={breached || undefined} tone="destructive" />
          <Stat label="Resolved" value={count((e) => e.status === "resolved") || undefined} tone="success" />
          <Stat label="Closed" value={count((e) => e.status === "closed") || undefined} />
        </div>

        <Section title="Escalation Queue">
          <div className="space-y-3">
            <Toolbar
              search={search}
              onSearch={(v) => {
                setSearch(v);
                setPage(1);
              }}
              searchPlaceholder="Search escalation, franchise or owner…"
              selectedCount={selected.size}
              bulkActions={
                <>
                  <button type="button" className={ACTION_CLS} onClick={() => apply("in_progress")}>
                    Start Work
                  </button>
                  <button type="button" className={ACTION_CLS} onClick={() => apply("resolved")}>
                    Resolve
                  </button>
                  <button type="button" className={ACTION_CLS} onClick={() => apply("closed")}>
                    Close
                  </button>
                </>
              }
              right={
                <>
                  <FilterSelect
                    label="Priority"
                    value={priority}
                    onChange={(v) => {
                      setPriority(v);
                      setPage(1);
                    }}
                    options={["low", "medium", "high", "critical"]}
                    allLabel="All priorities"
                  />
                  <FilterSelect
                    label="Category"
                    value={category}
                    onChange={(v) => {
                      setCategory(v);
                      setPage(1);
                    }}
                    options={["support", "finance", "legal", "onboarding", "territory", "license"]}
                    allLabel="All categories"
                  />
                  <ExportMenu<EscalationRow>
                    filename="franchise-escalations"
                    rows={filtered}
                    sheetName="Escalations"
                    permission="franchise.read"
                  />
                </>
              }
            />
            <EnterpriseTable<EscalationRow>
              columns={columns}
              rows={paged}
              loading={isLoading}
              error={error ? "Failed to load escalations" : null}
              emptyTitle="No escalations"
              emptyDescription="Raised escalations appear here with priority, owner and SLA tracking."
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
