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
  useFraudAlerts,
  useSetFraudStatus,
  type FraudAlertRow,
} from "@/lib/franchise-ops-hooks";

export const Route = createFileRoute("/fraud")({
  head: () => ({
    meta: [
      { title: "Fraud & Risk Detection · Boss Panel" },
      {
        name: "description",
        content:
          "Risk-scored fraud signals across franchises: under-reporting, licence sharing, duplicate invoices and refund spikes.",
      },
      { property: "og:title", content: "Fraud & Risk Detection · Boss Panel" },
      {
        property: "og:description",
        content:
          "Risk-scored fraud signals with severity, investigation status and franchise attribution.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FraudWall,
});

const ACTION_CLS =
  "inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 text-[12px] font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]";

function FraudWall() {
  const { data: rows = [], isLoading, error } = useFraudAlerts();
  const setStatus = useSetFraudStatus();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("");
  const [status, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(
      (a) =>
        (!severity || a.severity === severity) &&
        (!status || a.status === status) &&
        (!q ||
          a.franchise.toLowerCase().includes(q) ||
          a.alertType.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q)),
    );
  }, [rows, search, severity, status]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const apply = (next: "investigating" | "resolved" | "dismissed") => {
    const ids = [...selected];
    if (!ids.length) return;
    setStatus.mutate(
      { ids, status: next },
      {
        onSuccess: () => {
          toast({ title: `${ids.length} alert(s) marked ${next}`, tone: "success" });
          setSelected(new Set());
        },
        onError: (e) =>
          toast({ title: "Update failed", description: String(e), tone: "destructive" }),
      },
    );
  };

  const columns: Column<FraudAlertRow>[] = [
    {
      id: "risk",
      header: "Risk",
      width: "90px",
      cell: (a) => (
        <span
          className={`tabular-nums font-medium ${
            a.riskScore >= 75
              ? "text-destructive"
              : a.riskScore >= 45
                ? "text-[color:var(--color-warning)]"
                : "text-muted-foreground"
          }`}
        >
          {a.riskScore}
        </span>
      ),
    },
    {
      id: "alertType",
      header: "Signal",
      cell: (a) => (
        <span className="font-medium capitalize text-foreground">
          {a.alertType.replace(/_/g, " ")}
        </span>
      ),
    },
    { id: "franchise", header: "Franchise", cell: (a) => a.franchise },
    { id: "severity", header: "Severity", cell: (a) => <StatusBadge status={a.severity} /> },
    {
      id: "description",
      header: "Detail",
      cell: (a) => <span className="text-muted-foreground">{a.description}</span>,
    },
    { id: "status", header: "Status", cell: (a) => <StatusBadge status={a.status} /> },
    {
      id: "detectedAt",
      header: "Detected",
      cell: (a) => (
        <span className="tabular-nums text-muted-foreground">{a.detectedAt.slice(0, 10)}</span>
      ),
    },
  ];

  const count = (f: (a: FraudAlertRow) => boolean) => rows.filter(f).length;

  return (
    <>
      <WallHeader
        eyebrow="Fraud & Risk"
        title="Fraud Detection"
        description="Risk-scored signals across sales reporting, licensing, invoicing and refunds with investigation workflow."
      />
      <WallBody>
        <div className="wall-grid">
          <Stat label="Open Alerts" value={count((a) => a.status === "open") || undefined} tone="warning" loading={isLoading} />
          <Stat label="Investigating" value={count((a) => a.status === "investigating") || undefined} tone="info" />
          <Stat label="Critical" value={count((a) => a.severity === "critical") || undefined} tone="destructive" />
          <Stat label="High" value={count((a) => a.severity === "high") || undefined} tone="warning" />
          <Stat label="Resolved" value={count((a) => a.status === "resolved") || undefined} tone="success" />
          <Stat
            label="Avg Risk Score"
            value={rows.length ? Math.round(rows.reduce((a, r) => a + r.riskScore, 0) / rows.length) : undefined}
          />
        </div>

        <Section title="Risk Signals">
          <div className="space-y-3">
            <Toolbar
              search={search}
              onSearch={(v) => {
                setSearch(v);
                setPage(1);
              }}
              searchPlaceholder="Search signal, franchise or detail…"
              selectedCount={selected.size}
              bulkActions={
                <>
                  <button type="button" className={ACTION_CLS} onClick={() => apply("investigating")}>
                    Investigate
                  </button>
                  <button type="button" className={ACTION_CLS} onClick={() => apply("resolved")}>
                    Resolve
                  </button>
                  <button type="button" className={ACTION_CLS} onClick={() => apply("dismissed")}>
                    Dismiss
                  </button>
                </>
              }
              right={
                <>
                  <FilterSelect
                    label="Severity"
                    value={severity}
                    onChange={(v) => {
                      setSeverity(v);
                      setPage(1);
                    }}
                    options={["low", "medium", "high", "critical"]}
                    allLabel="All severities"
                  />
                  <FilterSelect
                    label="Status"
                    value={status}
                    onChange={(v) => {
                      setStatusFilter(v);
                      setPage(1);
                    }}
                    options={["open", "investigating", "resolved", "dismissed"]}
                    allLabel="All statuses"
                  />
                  <ExportMenu<FraudAlertRow>
                    filename="fraud-alerts"
                    rows={filtered}
                    sheetName="Fraud Alerts"
                    permission="franchise.read"
                  />
                </>
              }
            />
            <EnterpriseTable<FraudAlertRow>
              columns={columns}
              rows={paged}
              loading={isLoading}
              error={error ? "Failed to load fraud alerts" : null}
              emptyTitle="No risk signals"
              emptyDescription="Detected anomalies appear here with a risk score and investigation status."
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
