import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Section, Stat, WallBody, WallHeader } from "@/components/boss/Wall";
import { EnterpriseTable, type Column } from "@/components/boss/EnterpriseTable";
import { Toolbar } from "@/components/boss/Toolbar";
import { FilterSelect } from "@/components/boss/FilterSelect";
import { ExportMenu } from "@/components/boss/ExportMenu";
import { StatusBadge } from "@/components/boss/StatusBadge";
import { ACTION_CLS, ago } from "@/lib/module-ui";
import { useToast } from "@/lib/toast";
import { useSetMemberStatus, useTeam, type MemberRow } from "@/lib/modules-hooks";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "Users & Access · Boss Panel" },
      {
        name: "description",
        content:
          "Franchise team directory with roles, active sessions, two-factor status and last login activity.",
      },
      { property: "og:title", content: "Users & Access · Boss Panel" },
      {
        property: "og:description",
        content: "Role-based user management across the franchise network with session and 2FA visibility.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UsersWall,
});

function UsersWall() {
  const { data: rows = [], isLoading, error } = useTeam();
  const setStatus = useSetMemberStatus();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const roles = useMemo(() => [...new Set(rows.map((r) => r.role))].sort(), [rows]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(
      (m) =>
        (!role || m.role === role) &&
        (!status || m.status === status) &&
        (!q ||
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.franchise.toLowerCase().includes(q)),
    );
  }, [rows, search, role, status]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const apply = async (next: string) => {
    const ids = [...selected];
    if (ids.length === 0) return;
    try {
      await setStatus.mutateAsync({ ids, status: next });
      setSelected(new Set());
      toast({ title: `${ids.length} users set to ${next}`, tone: "success" });
    } catch (err) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "No changes saved.",
        tone: "destructive",
      });
    }
  };

  const columns: Column<MemberRow>[] = [
    {
      id: "name",
      header: "User",
      cell: (m) => (
        <div>
          <div className="font-medium text-foreground">{m.name}</div>
          <div className="text-[11.5px] text-muted-foreground">{m.email}</div>
        </div>
      ),
    },
    { id: "franchise", header: "Franchise", cell: (m) => m.franchise },
    {
      id: "role",
      header: "Role",
      cell: (m) => <span className="capitalize">{m.role.replace(/_/g, " ")}</span>,
    },
    { id: "phone", header: "Phone", cell: (m) => <span className="text-muted-foreground">{m.phone ?? "—"}</span> },
    { id: "lastLogin", header: "Last Login", cell: (m) => <span className="text-muted-foreground">{ago(m.lastLogin)}</span> },
    { id: "sessions", header: "Sessions", cell: (m) => <span className="tabular-nums">{m.sessions}</span> },
    {
      id: "twoFactor",
      header: "2FA",
      cell: (m) => <StatusBadge status={m.twoFactor ? "active" : "pending"} />,
    },
    { id: "status", header: "Status", cell: (m) => <StatusBadge status={m.status} /> },
  ];

  const count = (f: (m: MemberRow) => boolean) => rows.filter(f).length;

  return (
    <>
      <WallHeader
        eyebrow="Users"
        title="Users & Access Control"
        description="Franchise team directory with role assignments, session activity and two-factor enforcement."
      />
      <WallBody>
        <div className="wall-grid">
          <Stat
            label="Active Users"
            value={count((m) => m.status === "active") || undefined}
            tone="success"
            loading={isLoading}
            error={error ? "Failed to load" : null}
          />
          <Stat label="Suspended" value={count((m) => m.status === "suspended") || undefined} tone="destructive" />
          <Stat label="Pending Invites" value={count((m) => m.status === "pending") || undefined} tone="warning" />
          <Stat label="2FA Enabled" value={count((m) => m.twoFactor) || undefined} tone="info" />
          <Stat label="Live Sessions" value={rows.reduce((a, m) => a + m.sessions, 0) || undefined} />
          <Stat label="Roles In Use" value={roles.length || undefined} />
        </div>

        <Section title="Team Directory">
          <div className="space-y-3">
            <Toolbar
              search={search}
              onSearch={(v) => {
                setSearch(v);
                setPage(1);
              }}
              searchPlaceholder="Search name, email or franchise…"
              selectedCount={selected.size}
              bulkActions={
                <>
                  <button type="button" className={ACTION_CLS} onClick={() => apply("active")}>
                    Activate
                  </button>
                  <button type="button" className={ACTION_CLS} onClick={() => apply("suspended")}>
                    Suspend
                  </button>
                </>
              }
              right={
                <>
                  <FilterSelect
                    label="Role"
                    value={role}
                    onChange={(v) => {
                      setRole(v);
                      setPage(1);
                    }}
                    options={roles}
                    allLabel="All roles"
                  />
                  <FilterSelect
                    label="Status"
                    value={status}
                    onChange={(v) => {
                      setStatusFilter(v);
                      setPage(1);
                    }}
                    options={["active", "pending", "suspended"]}
                    allLabel="All statuses"
                  />
                  <ExportMenu<MemberRow>
                    filename="franchise-users"
                    rows={filtered}
                    sheetName="Users"
                    permission="user.manage"
                  />
                </>
              }
            />
            <EnterpriseTable<MemberRow>
              columns={columns}
              rows={paged}
              loading={isLoading}
              error={error ? "Failed to load users" : null}
              emptyTitle="No users"
              emptyDescription="Franchise team members appear here once invited."
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
