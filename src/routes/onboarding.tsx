import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarClock, UserPlus } from "lucide-react";
import { Card, Section, Stat, WallBody, WallHeader } from "@/components/boss/Wall";
import { EnterpriseTable, type Column } from "@/components/boss/EnterpriseTable";
import { Toolbar } from "@/components/boss/Toolbar";
import { FilterSelect } from "@/components/boss/FilterSelect";
import { ExportMenu } from "@/components/boss/ExportMenu";
import { StatusBadge } from "@/components/boss/StatusBadge";
import { Progress } from "@/components/boss/Progress";
import { Modal } from "@/components/boss/Modal";
import { ErrorBanner } from "@/components/boss/ErrorState";
import { ACTION_CLS, day } from "@/lib/module-ui";
import { useToast } from "@/lib/toast";
import {
  useOnboardingTasks,
  useSetTaskDue,
  useSetTaskOwner,
  useSetTaskStatus,
  type TaskRow,
} from "@/lib/modules-hooks";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding Workspace · Boss Panel" },
      {
        name: "description",
        content:
          "Franchise onboarding checklist with step owners, due dates, progress tracking and status filters on live records.",
      },
      { property: "og:title", content: "Onboarding Workspace · Boss Panel" },
      {
        property: "og:description",
        content: "Track every franchise from signed agreement to go-live with assignable checklist steps.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OnboardingWall,
});

const STATUSES = ["pending", "in_progress", "completed", "blocked"] as const;
const isOverdue = (t: TaskRow) =>
  Boolean(t.dueDate) && t.status !== "completed" && new Date(t.dueDate as string).getTime() < Date.now();

function OnboardingWall() {
  const { data: rows = [], isLoading, error, refetch } = useOnboardingTasks();
  const setStatus = useSetTaskStatus();
  const setOwner = useSetTaskOwner();
  const setDue = useSetTaskDue();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [franchise, setFranchise] = useState("");
  const [status, setStatus_] = useState("");
  const [dueFilter, setDueFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assignOpen, setAssignOpen] = useState(false);
  const [dueOpen, setDueOpen] = useState(false);
  const [ownerDraft, setOwnerDraft] = useState("");
  const [dueDraft, setDueDraft] = useState("");

  const franchises = useMemo(() => [...new Set(rows.map((r) => r.franchise))].sort(), [rows]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(
      (t) =>
        (!franchise || t.franchise === franchise) &&
        (!status || t.status === status) &&
        (dueFilter !== "Overdue" || isOverdue(t)) &&
        (dueFilter !== "Due this week" ||
          (t.dueDate &&
            new Date(t.dueDate).getTime() - Date.now() < 7 * 86400_000 &&
            t.status !== "completed")) &&
        (!q ||
          t.step.toLowerCase().includes(q) ||
          t.franchise.toLowerCase().includes(q) ||
          t.owner.toLowerCase().includes(q)),
    );
  }, [rows, search, franchise, status, dueFilter]);

  const journeys = useMemo(() => {
    const m = new Map<string, TaskRow[]>();
    for (const t of rows) m.set(t.franchise, [...(m.get(t.franchise) ?? []), t]);
    return [...m.entries()]
      .map(([name, tasks]) => {
        const sorted = [...tasks].sort((a, b) => a.stepOrder - b.stepOrder);
        const done = sorted.filter((t) => t.status === "completed").length;
        return {
          name,
          tasks: sorted,
          done,
          total: sorted.length,
          next: sorted.find((t) => t.status !== "completed") ?? null,
          overdue: sorted.filter(isOverdue).length,
        };
      })
      .sort((a, b) => b.done / b.total - a.done / a.total);
  }, [rows]);

  const clearSelection = () => setSelected(new Set());

  const run = async (fn: () => Promise<unknown>, message: string) => {
    try {
      await fn();
      clearSelection();
      toast({ title: message, tone: "success" });
    } catch (err) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "No changes saved.",
        tone: "destructive",
      });
    }
  };

  const applyStatus = (next: (typeof STATUSES)[number]) => {
    const ids = [...selected];
    if (ids.length === 0) return;
    void run(
      () => setStatus.mutateAsync({ ids, status: next }),
      `${ids.length} step(s) set to ${next.replace(/_/g, " ")}`,
    );
  };

  const columns: Column<TaskRow>[] = [
    {
      id: "step",
      header: "Step",
      cell: (t) => (
        <div>
          <div className="font-medium text-foreground">
            <span className="mr-1.5 tabular-nums text-muted-foreground">{t.stepOrder}.</span>
            {t.step}
          </div>
          <div className="text-[11.5px] text-muted-foreground">{t.franchise}</div>
        </div>
      ),
    },
    { id: "status", header: "Status", cell: (t) => <StatusBadge status={t.status} /> },
    {
      id: "owner",
      header: "Owner",
      cell: (t) => t.owner || <span className="text-muted-foreground">Unassigned</span>,
    },
    {
      id: "dueDate",
      header: "Due",
      cell: (t) =>
        isOverdue(t) ? (
          <span className="font-medium text-destructive">{day(t.dueDate)} · overdue</span>
        ) : (
          <span className="tabular-nums">{day(t.dueDate)}</span>
        ),
    },
    { id: "completedAt", header: "Completed", cell: (t) => <span className="tabular-nums">{day(t.completedAt)}</span> },
  ];

  const completed = rows.filter((t) => t.status === "completed").length;
  const blocked = rows.filter((t) => t.status === "blocked").length;
  const overdue = rows.filter(isOverdue).length;
  const goLive = journeys.filter((j) => j.done === j.total).length;

  return (
    <>
      <WallHeader
        eyebrow="Onboarding"
        title="Onboarding Workspace"
        description="Standardised journey from signed agreement to go-live, with owners, due dates and live progress."
      />
      <WallBody>
        {error && (
          <ErrorBanner title="Onboarding tasks failed to load" error={error} onRetry={() => void refetch()} />
        )}

        <div className="wall-grid">
          <Stat label="Franchises Onboarding" value={journeys.length || undefined} loading={isLoading} />
          <Stat label="Steps Completed" value={completed || undefined} tone="success" loading={isLoading} />
          <Stat label="Overdue Steps" value={overdue || undefined} tone="warning" loading={isLoading} />
          <Stat label="Blocked Steps" value={blocked || undefined} tone="destructive" loading={isLoading} />
          <Stat label="Ready to Go-Live" value={goLive || undefined} tone="info" loading={isLoading} />
        </div>

        <Section title="Journey Progress">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {isLoading && journeys.length === 0
              ? [0, 1, 2].map((i) => (
                  <Card key={i}>
                    <div className="h-4 w-32 animate-pulse rounded bg-surface-2" />
                    <div className="mt-4 h-2 w-full animate-pulse rounded bg-surface-2" />
                    <div className="mt-4 h-3 w-40 animate-pulse rounded bg-surface-2" />
                  </Card>
                ))
              : journeys.map((j) => (
                  <Card key={j.name}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-semibold text-foreground">{j.name}</div>
                        <div className="text-[11.5px] text-muted-foreground">
                          {j.done}/{j.total} steps · next: {j.next ? j.next.step : "Go-live ready"}
                        </div>
                      </div>
                      <StatusBadge status={j.done === j.total ? "completed" : j.overdue > 0 ? "blocked" : "in_progress"} />
                    </div>
                    <div className="mt-3">
                      <Progress value={(j.done / j.total) * 100} label="Completion" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setFranchise(j.name)}
                      className={`${ACTION_CLS} mt-3`}
                    >
                      View steps
                    </button>
                  </Card>
                ))}
          </div>
        </Section>

        <Section title="Checklist">
          <Toolbar
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Search step, franchise or owner…"
            filters={[
              ...(franchise ? [{ id: "f", label: `Franchise: ${franchise}`, onClear: () => setFranchise("") }] : []),
              ...(status ? [{ id: "s", label: `Status: ${status}`, onClear: () => setStatus_("") }] : []),
              ...(dueFilter ? [{ id: "d", label: dueFilter, onClear: () => setDueFilter("") }] : []),
            ]}
            onClearFilters={() => {
              setFranchise("");
              setStatus_("");
              setDueFilter("");
            }}
            right={
              <>
                <FilterSelect label="Franchise" value={franchise} onChange={setFranchise} options={franchises} />
                <FilterSelect label="Status" value={status} onChange={setStatus_} options={[...STATUSES]} />
                <FilterSelect
                  label="Due"
                  value={dueFilter}
                  onChange={setDueFilter}
                  options={["Overdue", "Due this week"]}
                />
                <ExportMenu<TaskRow>
                  filename="onboarding-tasks"
                  rows={filtered}
                  sheetName="Onboarding"
                  permission="franchise.read"
                />
              </>
            }
            selectedCount={selected.size}
            bulkActions={
              <>
                <button type="button" className={ACTION_CLS} onClick={() => applyStatus("in_progress")}>
                  Start
                </button>
                <button type="button" className={ACTION_CLS} onClick={() => applyStatus("completed")}>
                  Complete
                </button>
                <button type="button" className={ACTION_CLS} onClick={() => applyStatus("blocked")}>
                  Block
                </button>
                <button type="button" className={ACTION_CLS} onClick={() => setAssignOpen(true)}>
                  <UserPlus className="h-3.5 w-3.5" aria-hidden="true" /> Assign
                </button>
                <button type="button" className={ACTION_CLS} onClick={() => setDueOpen(true)}>
                  <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" /> Set due date
                </button>
              </>
            }
          />
          <div className="mt-3">
            <EnterpriseTable<TaskRow>
              columns={columns}
              rows={filtered}
              loading={isLoading}
              error={error ? "Failed to load onboarding tasks" : null}
              emptyTitle="No onboarding steps in this view"
              emptyDescription="Clear the filters, or approve an application to generate a new onboarding journey."
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
                  prev.size === filtered.length ? new Set() : new Set(filtered.map((r) => r.id)),
                )
              }
            />
          </div>
        </Section>
      </WallBody>

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign owner"
        description={`${selected.size} step(s) will be reassigned.`}
        footer={
          <>
            <button type="button" className={ACTION_CLS} onClick={() => setAssignOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className={ACTION_CLS}
              disabled={ownerDraft.trim().length < 2}
              onClick={() => {
                setAssignOpen(false);
                void run(
                  () => setOwner.mutateAsync({ ids: [...selected], owner: ownerDraft.trim() }),
                  `Owner set to ${ownerDraft.trim()}`,
                );
              }}
            >
              Assign
            </button>
          </>
        }
      >
        <label className="block text-[12px] font-medium text-muted-foreground" htmlFor="ob-owner">
          Owner name or team
        </label>
        <input
          id="ob-owner"
          value={ownerDraft}
          onChange={(e) => setOwnerDraft(e.target.value)}
          placeholder="e.g. Onboarding Desk"
          className="mt-1.5 h-9 w-full rounded-md border border-border bg-surface px-2.5 text-[13px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
        />
      </Modal>

      <Modal
        open={dueOpen}
        onClose={() => setDueOpen(false)}
        title="Set due date"
        description={`${selected.size} step(s) will be rescheduled.`}
        footer={
          <>
            <button type="button" className={ACTION_CLS} onClick={() => setDueOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className={ACTION_CLS}
              disabled={!/^\d{4}-\d{2}-\d{2}$/.test(dueDraft)}
              onClick={() => {
                setDueOpen(false);
                void run(
                  () => setDue.mutateAsync({ ids: [...selected], dueDate: dueDraft }),
                  `Due date set to ${dueDraft}`,
                );
              }}
            >
              Save
            </button>
          </>
        }
      >
        <label className="block text-[12px] font-medium text-muted-foreground" htmlFor="ob-due">
          Due date
        </label>
        <input
          id="ob-due"
          type="date"
          value={dueDraft}
          onChange={(e) => setDueDraft(e.target.value)}
          className="mt-1.5 h-9 w-full rounded-md border border-border bg-surface px-2.5 text-[13px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
        />
      </Modal>
    </>
  );
}
