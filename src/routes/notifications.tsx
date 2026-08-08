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
  useNotifications,
  useSetNotificationsRead,
  type NotificationRow,
} from "@/lib/franchise-ops-hooks";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · Boss Panel" },
      {
        name: "description",
        content:
          "Franchise notification centre across in-app, email and SMS channels with read tracking.",
      },
      { property: "og:title", content: "Notifications · Boss Panel" },
      {
        property: "og:description",
        content:
          "Notification centre for franchise alerts across in-app, email and SMS channels.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotificationsWall,
});

const ACTION_CLS =
  "inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 text-[12px] font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]";

function NotificationsWall() {
  const { data: rows = [], isLoading, error } = useNotifications();
  const setRead = useSetNotificationsRead();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [channel, setChannel] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(
      (n) =>
        (!type || n.type === type) &&
        (!channel || n.channel === channel) &&
        (!q ||
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q) ||
          n.franchise.toLowerCase().includes(q)),
    );
  }, [rows, search, type, channel]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const apply = (read: boolean) => {
    const ids = [...selected];
    if (!ids.length) return;
    setRead.mutate(
      { ids, read },
      {
        onSuccess: () => {
          toast({
            title: `${ids.length} notification(s) marked ${read ? "read" : "unread"}`,
            tone: "success",
          });
          setSelected(new Set());
        },
        onError: (e) =>
          toast({ title: "Update failed", description: String(e), tone: "destructive" }),
      },
    );
  };

  const columns: Column<NotificationRow>[] = [
    {
      id: "title",
      header: "Notification",
      cell: (n) => (
        <span className={n.read ? "text-muted-foreground" : "font-medium text-foreground"}>
          {n.title}
        </span>
      ),
    },
    { id: "message", header: "Message", cell: (n) => <span className="text-muted-foreground">{n.message}</span> },
    { id: "franchise", header: "Franchise", cell: (n) => n.franchise },
    {
      id: "type",
      header: "Type",
      cell: (n) => (
        <StatusBadge
          status={
            n.type === "critical"
              ? "terminated"
              : n.type === "warning"
                ? "pending"
                : n.type === "success"
                  ? "active"
                  : "issued"
          }
        >
          {n.type}
        </StatusBadge>
      ),
    },
    {
      id: "channel",
      header: "Channel",
      cell: (n) => <span className="uppercase text-muted-foreground">{n.channel.replace(/_/g, " ")}</span>,
    },
    {
      id: "read",
      header: "State",
      cell: (n) =>
        n.read ? (
          <span className="text-muted-foreground">Read</span>
        ) : (
          <span className="font-medium text-[color:var(--color-info)]">Unread</span>
        ),
    },
    {
      id: "createdAt",
      header: "Sent",
      cell: (n) => <span className="tabular-nums text-muted-foreground">{n.createdAt.slice(0, 10)}</span>,
    },
  ];

  const count = (f: (n: NotificationRow) => boolean) => rows.filter(f).length;

  return (
    <>
      <WallHeader
        eyebrow="Notifications"
        title="Notification Centre"
        description="Outbound franchise alerts across in-app, email and SMS channels with delivery type and read state."
      />
      <WallBody>
        <div className="wall-grid">
          <Stat label="Total" value={rows.length || undefined} loading={isLoading} />
          <Stat label="Unread" value={count((n) => !n.read) || undefined} tone="info" />
          <Stat label="Critical" value={count((n) => n.type === "critical") || undefined} tone="destructive" />
          <Stat label="Warnings" value={count((n) => n.type === "warning") || undefined} tone="warning" />
          <Stat label="Email" value={count((n) => n.channel === "email") || undefined} />
          <Stat label="In-App" value={count((n) => n.channel === "in_app") || undefined} />
        </div>

        <Section title="Delivery Log">
          <div className="space-y-3">
            <Toolbar
              search={search}
              onSearch={(v) => {
                setSearch(v);
                setPage(1);
              }}
              searchPlaceholder="Search notification, message or franchise…"
              selectedCount={selected.size}
              bulkActions={
                <>
                  <button type="button" className={ACTION_CLS} onClick={() => apply(true)}>
                    Mark Read
                  </button>
                  <button type="button" className={ACTION_CLS} onClick={() => apply(false)}>
                    Mark Unread
                  </button>
                </>
              }
              right={
                <>
                  <FilterSelect
                    label="Type"
                    value={type}
                    onChange={(v) => {
                      setType(v);
                      setPage(1);
                    }}
                    options={["info", "success", "warning", "critical"]}
                    allLabel="All types"
                  />
                  <FilterSelect
                    label="Channel"
                    value={channel}
                    onChange={(v) => {
                      setChannel(v);
                      setPage(1);
                    }}
                    options={[
                      { value: "in_app", label: "In-App" },
                      { value: "email", label: "Email" },
                      { value: "sms", label: "SMS" },
                    ]}
                    allLabel="All channels"
                  />
                  <ExportMenu<NotificationRow>
                    filename="franchise-notifications"
                    rows={filtered}
                    sheetName="Notifications"
                    permission="franchise.read"
                  />
                </>
              }
            />
            <EnterpriseTable<NotificationRow>
              columns={columns}
              rows={paged}
              loading={isLoading}
              error={error ? "Failed to load notifications" : null}
              emptyTitle="No notifications"
              emptyDescription="Alerts sent to franchises appear here with channel and read state."
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
