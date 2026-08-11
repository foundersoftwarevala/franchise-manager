import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Section, Stat, WallBody, WallHeader } from "@/components/boss/Wall";
import { EnterpriseTable, type Column } from "@/components/boss/EnterpriseTable";
import { Toolbar } from "@/components/boss/Toolbar";
import { FilterSelect } from "@/components/boss/FilterSelect";
import { ExportMenu } from "@/components/boss/ExportMenu";
import { StatusBadge } from "@/components/boss/StatusBadge";
import { ACTION_CLS, ago, day } from "@/lib/module-ui";
import { useToast } from "@/lib/toast";
import { useSetTicketStatus, useTickets, type TicketRow } from "@/lib/modules-hooks";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support Desk · Boss Panel" },
      {
        name: "description",
        content:
          "Franchise support tickets with channel, priority, SLA countdown, first-response time and CSAT scores.",
      },
      { property: "og:title", content: "Support Desk · Boss Panel" },
      {
        property: "og:description",
        content: "Omnichannel franchise support queue with SLA tracking and satisfaction metrics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SupportWall,
});

function SupportWall() {
  const { data: rows = [], isLoading, error } = useTickets();
  const setStatus = useSetTicketStatus();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");
  const [channel, setChannel] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const channels = useMemo(() => [...new Set(rows.map((r) => r.channel))].sort(), [rows]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(
      (t) =>
        (!priority || t.priority === priority) &&
        (!channel || t.channel === channel) &&
        (!q ||
          t.subject.toLowerCase().includes(q) ||
          t.ticketNo.toLowerCase().includes(q) ||
          t.franchise.toLowerCase().includes(q) ||
          t.owner.toLowerCase().includes(q)),
    );
  }, [rows, search, priority, channel]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const apply = async (next: string) => {
    const ids = [...selected];
    if (ids.length === 0) return;
    try {
      await setStatus.mutateAsync({ ids, status: next });
      setSelected(new Set());
      toast({ title: `${ids.length} tickets set to ${next.replace(/_/g, " ")}`, tone: "success" });
    } catch (err) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "No changes saved.",
        tone: "destructive",
      });
    }
  };

  const breached = rows.filter(
    (t) =>
      t.slaDue &&
      new Date(t.slaDue).getTime() < Date.now() &&
      t.status !== "resolved" &&
      t.status !== "closed",
  ).length;

  const csatRows = rows.filter((t) => t.csat !== null);
  const avgCsat = csatRows.length
    ? (csatRows.reduce((a, t) => a + (t.csat ?? 0), 0) / csatRows.length).toFixed(1)
    : null;
  const frtRows = rows.filter((t) => t.firstResponseMins !== null);
  const avgFrt = frtRows.length
    ? Math.round(frtRows.reduce((a, t) => a + (t.firstResponseMins ?? 0), 0) / frtRows.length)
    : null;

  const columns: Column<TicketRow>[] = [
    {
      id: "subject",
      header: "Ticket",
      cell: (t) => (
        <div>
          <div className="font-medium text-foreground">{t.subject}</div>
          <div className="text-[11.5px] text-muted-foreground">
            {t.ticketNo} · {t.franchise}
          </div>
        </div>
      ),
    },
    { id: "channel", header: "Channel", cell: (t) => <span className="capitalize">{t.channel}</span> },
    { id: "priority", header: "Priority", cell: (t) => <StatusBadge status={t.priority} /> },
    { id: "status", header: "Status", cell: (t) => <StatusBadge status={t.status} /> },
    { id: "owner", header: "Owner", cell: (t) => t.owner || <span className="text-muted-foreground">Unassigned</span> },
    {
      id: "slaDue",
      header: "SLA Due",
      cell: (t) => {
        if (!t.slaDue) return <span className="text-muted-foreground">—</span>;
        const overdue =
          new Date(t.slaDue).getTime() < Date.now() && t.status !== "resolved" && t.status !== "closed";
        return (
          <span className={`tabular-nums ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
            {day(t.slaDue)}
            {overdue ? " · breached" : ""}
          </span>
        );
      },
    },
    {
      id: "firstResponseMins",
      header: "First Response",
      cell: (t) => (
        <span className="tabular-nums text-muted-foreground">
          {t.firstResponseMins === null ? "—" : `${t.firstResponseMins}m`}
        </span>
      ),
    },
    {
      id: "csat",
      header: "CSAT",
      cell: (t) => <span className="tabular-nums">{t.csat === null ? "—" : t.csat.toFixed(1)}</span>,
    },
    { id: "updatedAt", header: "Updated", cell: (t) => <span className="text-muted-foreground">{ago(t.updatedAt)}</span> },
  ];

  const count = (f: (t: TicketRow) => boolean) => rows.filter(f).length;

  return (
    <>
      <WallHeader
        eyebrow="Support"
        title="Support Desk"
        description="Omnichannel franchise support queue with priority, SLA countdown, response times and CSAT."
      />
      <WallBody>
        <div className="wall-grid">
          <Stat
            label="Open"
            value={count((t) => t.status === "open") || undefined}
            tone="warning"
            loading={isLoading}
            error={error ? "Failed to load" : null}
          />
          <Stat label="In Progress" value={count((t) => t.status === "in_progress") || undefined} tone="info" />
          <Stat label="SLA Breached" value={breached || undefined} tone="destructive" />
          <Stat label="Resolved" value={count((t) => t.status === "resolved") || undefined} tone="success" />
          <Stat label="Avg First Response" value={avgFrt !== null ? `${avgFrt}m` : undefined} />
          <Stat label="Avg CSAT" value={avgCsat ?? undefined} tone="success" />
        </div>

        <Section title="Ticket Queue">
          <div className="space-y-3">
            <Toolbar
              search={search}
              onSearch={(v) => {
                setSearch(v);
                setPage(1);
              }}
              searchPlaceholder="Search ticket, franchise or owner…"
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
                    label="Channel"
                    value={channel}
                    onChange={(v) => {
                      setChannel(v);
                      setPage(1);
                    }}
                    options={channels}
                    allLabel="All channels"
                  />
                  <ExportMenu<TicketRow>
                    filename="franchise-support-tickets"
                    rows={filtered}
                    sheetName="Tickets"
                    permission="franchise.read"
                  />
                </>
              }
            />
            <EnterpriseTable<TicketRow>
              columns={columns}
              rows={paged}
              loading={isLoading}
              error={error ? "Failed to load tickets" : null}
              emptyTitle="No tickets"
              emptyDescription="Support requests raised by franchises appear here with SLA tracking."
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
