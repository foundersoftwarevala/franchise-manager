import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Btn, Section, Stat, WallBody, WallHeader } from "@/components/boss/Wall";
import { EnterpriseTable, type Column } from "@/components/boss/EnterpriseTable";
import { Toolbar } from "@/components/boss/Toolbar";
import { FilterSelect } from "@/components/boss/FilterSelect";
import { ExportMenu } from "@/components/boss/ExportMenu";
import { StatusBadge } from "@/components/boss/StatusBadge";
import { Modal } from "@/components/boss/Modal";
import { useToast } from "@/lib/toast";
import { useFranchises } from "@/lib/data-hooks";
import {
  useCompliance,
  useCreateComplianceRecord,
  useSetComplianceStatus,
  type ComplianceRow,
} from "@/lib/compliance-hooks";

export const Route = createFileRoute("/compliance")({
  head: () => ({
    meta: [
      { title: "Compliance & Risk · Boss Panel" },
      {
        name: "description",
        content:
          "Franchise compliance register with tax filings, licences, audits, severity, due dates and escalation workflow.",
      },
      { property: "og:title", content: "Compliance & Risk · Boss Panel" },
      {
        property: "og:description",
        content:
          "Track every franchise compliance requirement with severity, due dates, warnings and escalations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComplianceWall,
});

const ACTION_CLS =
  "inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 text-[12px] font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]";
const FIELD_CLS =
  "h-9 w-full rounded-md border border-border bg-surface-2 px-2.5 text-[12.5px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]";

const CATEGORIES = ["legal", "financial", "operational", "brand", "kyc"];
const SEVERITIES = ["low", "medium", "high", "critical"];
const STATUSES = ["pending", "compliant", "warned", "escalated", "breach", "resolved"];

function ComplianceWall() {
  const { data: rows = [], isLoading, error } = useCompliance();
  const { data: franchises = [] } = useFranchises();
  const setStatus = useSetComplianceStatus();
  const createRecord = useCreateComplianceRecord();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus_] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    franchiseId: "",
    requirement: "",
    category: "legal",
    severity: "medium",
    dueDate: "",
    notes: "",
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(
      (c) =>
        (!category || c.category === category) &&
        (!status || c.status === status) &&
        (!q ||
          c.requirement.toLowerCase().includes(q) ||
          c.franchise.toLowerCase().includes(q) ||
          (c.notes ?? "").toLowerCase().includes(q)),
    );
  }, [rows, search, category, status]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const count = (f: (c: ComplianceRow) => boolean) => rows.filter(f).length;
  const isOverdue = (c: ComplianceRow) =>
    !!c.dueDate &&
    new Date(c.dueDate).getTime() < Date.now() &&
    c.status !== "compliant" &&
    c.status !== "resolved";
  const overdue = rows.filter(isOverdue).length;

  const apply = (next: string, escalate = false) => {
    const ids = [...selected];
    if (!ids.length) return;
    setStatus.mutate(
      { ids, status: next, escalate },
      {
        onSuccess: (res) => {
          toast({
            title: escalate
              ? `${ids.length} record(s) escalated · ticket${ids.length > 1 ? "s" : ""} opened`
              : `${ids.length} record(s) marked ${next}`,
            description: escalate
              ? "Escalation tickets assigned to the Compliance Team with a 3-day SLA."
              : undefined,
            tone: escalate ? "warning" : "success",
          });
          void res;
          setSelected(new Set());
        },
        onError: (e) =>
          toast({ title: "Update failed", description: String(e), tone: "destructive" }),
      },
    );
  };

  const submit = () => {
    if (form.requirement.trim().length < 3) {
      toast({ title: "Requirement is required", tone: "destructive" });
      return;
    }
    const f = franchises.find((x) => x.id === form.franchiseId);
    createRecord.mutate(
      {
        franchiseId: form.franchiseId || null,
        franchise: f?.company ?? "",
        requirement: form.requirement.trim(),
        category: form.category,
        severity: form.severity,
        dueDate: form.dueDate || undefined,
        notes: form.notes || undefined,
      },
      {
        onSuccess: () => {
          toast({ title: "Compliance requirement added", tone: "success" });
          setAddOpen(false);
          setForm({
            franchiseId: "",
            requirement: "",
            category: "legal",
            severity: "medium",
            dueDate: "",
            notes: "",
          });
        },
        onError: (e) =>
          toast({ title: "Could not add record", description: String(e), tone: "destructive" }),
      },
    );
  };

  const columns: Column<ComplianceRow>[] = [
    {
      id: "requirement",
      header: "Requirement",
      cell: (c) => <span className="font-medium text-foreground">{c.requirement}</span>,
    },
    { id: "franchise", header: "Franchise", cell: (c) => c.franchise },
    {
      id: "category",
      header: "Category",
      cell: (c) => <span className="capitalize text-muted-foreground">{c.category}</span>,
    },
    { id: "severity", header: "Severity", cell: (c) => <StatusBadge status={c.severity} /> },
    { id: "status", header: "Status", cell: (c) => <StatusBadge status={c.status} /> },
    {
      id: "dueDate",
      header: "Due",
      cell: (c) =>
        c.dueDate ? (
          <span className={`tabular-nums ${isOverdue(c) ? "text-destructive" : "text-muted-foreground"}`}>
            {c.dueDate}
            {isOverdue(c) ? " · overdue" : ""}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "lastChecked",
      header: "Last Checked",
      cell: (c) => (
        <span className="tabular-nums text-muted-foreground">{c.lastChecked ?? "—"}</span>
      ),
    },
    {
      id: "notes",
      header: "Notes",
      cell: (c) => <span className="text-muted-foreground">{c.notes ?? "—"}</span>,
    },
  ];

  return (
    <>
      <WallHeader
        eyebrow="Compliance"
        title="Compliance & Risk"
        description="KYC, tax, business licensing, audits and risk monitoring across the franchise network."
        actions={
          <Btn variant="primary" onClick={() => setAddOpen(true)}>
            Add Requirement
          </Btn>
        }
      />
      <WallBody>
        <div className="wall-grid">
          <Stat
            label="Compliant"
            value={count((c) => c.status === "compliant") || undefined}
            tone="success"
            loading={isLoading}
          />
          <Stat label="Pending" value={count((c) => c.status === "pending") || undefined} tone="warning" />
          <Stat label="Warned" value={count((c) => c.status === "warned") || undefined} tone="warning" />
          <Stat
            label="Breach / Escalated"
            value={count((c) => c.status === "breach" || c.status === "escalated") || undefined}
            tone="destructive"
          />
          <Stat label="Overdue" value={overdue || undefined} tone="destructive" />
          <Stat
            label="Critical Severity"
            value={count((c) => c.severity === "critical") || undefined}
            tone="destructive"
          />
        </div>

        <Section title="Compliance Register">
          <div className="space-y-3">
            <Toolbar
              search={search}
              onSearch={(v) => {
                setSearch(v);
                setPage(1);
              }}
              searchPlaceholder="Search requirement, franchise or note…"
              selectedCount={selected.size}
              bulkActions={
                <>
                  <button type="button" className={ACTION_CLS} onClick={() => apply("compliant")}>
                    Mark Compliant
                  </button>
                  <button type="button" className={ACTION_CLS} onClick={() => apply("warned")}>
                    Issue Warning
                  </button>
                  <button type="button" className={ACTION_CLS} onClick={() => apply("escalated", true)}>
                    Escalate
                  </button>
                  <button type="button" className={ACTION_CLS} onClick={() => apply("resolved")}>
                    Resolve
                  </button>
                </>
              }
              right={
                <>
                  <FilterSelect
                    label="Category"
                    value={category}
                    onChange={(v) => {
                      setCategory(v);
                      setPage(1);
                    }}
                    options={CATEGORIES}
                    allLabel="All categories"
                  />
                  <FilterSelect
                    label="Status"
                    value={status}
                    onChange={(v) => {
                      setStatus_(v);
                      setPage(1);
                    }}
                    options={STATUSES}
                    allLabel="All statuses"
                  />
                  <ExportMenu<ComplianceRow>
                    filename="franchise-compliance"
                    rows={filtered}
                    sheetName="Compliance"
                    permission="franchise.read"
                  />
                </>
              }
            />
            <EnterpriseTable<ComplianceRow>
              columns={columns}
              rows={paged}
              loading={isLoading}
              error={error ? "Failed to load compliance register" : null}
              emptyTitle="No compliance records"
              emptyDescription="Add a requirement to start tracking filings, licences and audits per franchise."
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

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add compliance requirement"
        description="Tracked in the register with severity, due date and audit history."
        footer={
          <>
            <Btn variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </Btn>
            <Btn variant="primary" onClick={submit} disabled={createRecord.isPending}>
              {createRecord.isPending ? "Saving…" : "Add Requirement"}
            </Btn>
          </>
        }
      >
        <div className="grid gap-3">
          <label className="grid gap-1 text-[11.5px] text-muted-foreground">
            Franchise
            <select
              className={FIELD_CLS}
              value={form.franchiseId}
              onChange={(e) => setForm((f) => ({ ...f, franchiseId: e.target.value }))}
            >
              <option value="">Network-wide</option>
              {franchises.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.company} · {f.code}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-[11.5px] text-muted-foreground">
            Requirement
            <input
              className={FIELD_CLS}
              value={form.requirement}
              placeholder="GST return filing — Q3 FY26"
              onChange={(e) => setForm((f) => ({ ...f, requirement: e.target.value }))}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-[11.5px] text-muted-foreground">
              Category
              <select
                className={FIELD_CLS}
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-[11.5px] text-muted-foreground">
              Severity
              <select
                className={FIELD_CLS}
                value={form.severity}
                onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-[11.5px] text-muted-foreground">
              Due date
              <input
                type="date"
                className={FIELD_CLS}
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </label>
          </div>
          <label className="grid gap-1 text-[11.5px] text-muted-foreground">
            Notes
            <textarea
              className="min-h-[72px] w-full rounded-md border border-border bg-surface-2 p-2.5 text-[12.5px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </label>
        </div>
      </Modal>
    </>
  );
}
