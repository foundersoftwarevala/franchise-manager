import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Btn, Card, Section, Stat, WallBody, WallHeader } from "@/components/boss/Wall";
import { EnterpriseTable, type Column } from "@/components/boss/EnterpriseTable";
import { Toolbar } from "@/components/boss/Toolbar";
import { FilterSelect } from "@/components/boss/FilterSelect";
import { ExportMenu } from "@/components/boss/ExportMenu";
import { StatusBadge } from "@/components/boss/StatusBadge";
import { Download, FileText } from "lucide-react";
import { useAuditTrail, type AuditTrailRow } from "@/lib/compliance-hooks";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Report Center · Boss Panel" },
      {
        name: "description",
        content:
          "Generate operational franchise reports and review the live audit trail with before/after change values and CSV export.",
      },
      { property: "og:title", content: "Report Center · Boss Panel" },
      {
        property: "og:description",
        content:
          "Franchise report center with a live audit trail showing actor, action, old and new values.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportsWall,
});

const REPORTS = [
  "Revenue Reports","Sales Reports","Commission Reports","Franchise Reports",
  "License Reports","Customer Reports","Support Reports","Tax Reports",
];

function ReportsWall() {
  const { data: rows = [], isLoading, error } = useAuditTrail();
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const scopes = useMemo(
    () => [...new Set(rows.map((r) => r.scope))].sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        (!scope || r.scope === scope) &&
        (!q ||
          r.action.toLowerCase().includes(q) ||
          r.actor.toLowerCase().includes(q) ||
          r.target.toLowerCase().includes(q) ||
          (r.meta ?? "").toLowerCase().includes(q)),
    );
  }, [rows, search, scope]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const today = new Date().toISOString().slice(0, 10);

  const columns: Column<AuditTrailRow>[] = [
    {
      id: "at",
      header: "Timestamp",
      cell: (r) => (
        <span className="tabular-nums text-muted-foreground">
          {r.at.slice(0, 16).replace("T", " ")}
        </span>
      ),
    },
    { id: "actor", header: "Actor", cell: (r) => r.actor },
    {
      id: "action",
      header: "Action",
      cell: (r) => (
        <span className="font-medium text-foreground">{r.action.replace(/_/g, " ")}</span>
      ),
    },
    {
      id: "scope",
      header: "Scope",
      cell: (r) => <span className="capitalize text-muted-foreground">{r.scope}</span>,
    },
    {
      id: "change",
      header: "Change",
      cell: (r) =>
        r.oldValue || r.newValue ? (
          <span className="text-[12px]">
            <span className="text-muted-foreground line-through">{r.oldValue ?? "—"}</span>
            <span className="mx-1.5 text-muted-foreground">→</span>
            <span className="text-foreground">{r.newValue ?? "—"}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    { id: "result", header: "Result", cell: (r) => <StatusBadge status={r.result} /> },
    {
      id: "meta",
      header: "Details",
      cell: (r) => <span className="text-muted-foreground">{r.meta ?? "—"}</span>,
    },
  ];

  return (
    <>
      <WallHeader
        eyebrow="Reports"
        title="Report Center"
        description="Generate, schedule and export operational reports — plus the full network audit trail."
        actions={<>
          <Btn variant="outline"><Download className="h-3.5 w-3.5" /> Export Center</Btn>
          <Btn variant="primary">New Report</Btn>
        </>}
      />
      <WallBody>
        <div className="wall-grid">
          <Stat label="Audit Events" value={rows.length || undefined} loading={isLoading} />
          <Stat
            label="Today"
            value={rows.filter((r) => r.at.slice(0, 10) === today).length || undefined}
            tone="info"
          />
          <Stat
            label="Changes Tracked"
            value={rows.filter((r) => r.oldValue || r.newValue).length || undefined}
            tone="success"
          />
          <Stat
            label="Failed Actions"
            value={rows.filter((r) => r.result !== "success").length || undefined}
            tone="destructive"
          />
          <Stat label="Scopes" value={scopes.length || undefined} />
        </div>

        <Section title="Standard Reports">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {REPORTS.map((r) => (
              <Card key={r}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[13px] font-medium text-foreground">{r}</div>
                    <div className="mt-1 text-[11.5px] text-muted-foreground">PDF · Excel · CSV</div>
                  </div>
                  <div className="grid h-8 w-8 place-items-center rounded-md bg-accent text-accent-foreground">
                    <FileText className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Btn variant="outline">Generate</Btn>
                  <Btn variant="ghost">Schedule</Btn>
                </div>
              </Card>
            ))}
          </div>
        </Section>

        <Section title="Audit Trail">
          <div className="space-y-3">
            <Toolbar
              search={search}
              onSearch={(v) => {
                setSearch(v);
                setPage(1);
              }}
              searchPlaceholder="Search actor, action, target or details…"
              right={
                <>
                  <FilterSelect
                    label="Scope"
                    value={scope}
                    onChange={(v) => {
                      setScope(v);
                      setPage(1);
                    }}
                    options={scopes}
                    allLabel="All scopes"
                  />
                  <ExportMenu<AuditTrailRow>
                    filename="audit-trail"
                    rows={filtered}
                    sheetName="Audit Trail"
                    permission="franchise.read"
                  />
                </>
              }
            />
            <EnterpriseTable<AuditTrailRow>
              columns={columns}
              rows={paged}
              loading={isLoading}
              error={error ? "Failed to load audit trail" : null}
              emptyTitle="No audit events"
              emptyDescription="Every approval, status change and policy edit is recorded here with before/after values."
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
