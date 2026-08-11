import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Section, Stat, WallBody, WallHeader } from "@/components/boss/Wall";
import { EnterpriseTable, type Column } from "@/components/boss/EnterpriseTable";
import { Toolbar } from "@/components/boss/Toolbar";
import { FilterSelect } from "@/components/boss/FilterSelect";
import { ExportMenu } from "@/components/boss/ExportMenu";
import { StatusBadge } from "@/components/boss/StatusBadge";
import { ACTION_CLS, day } from "@/lib/module-ui";
import { useToast } from "@/lib/toast";
import { useLegalDocuments, useSetLegalStatus, type LegalRow } from "@/lib/modules-hooks";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Legal & Agreements · Boss Panel" },
      {
        name: "description",
        content:
          "Franchise agreements, NDAs and addendums with signature status, effective dates and expiry tracking.",
      },
      { property: "og:title", content: "Legal & Agreements · Boss Panel" },
      {
        property: "og:description",
        content: "Legal document register with signature workflow and expiry monitoring.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LegalWall,
});

function LegalWall() {
  const { data: rows = [], isLoading, error } = useLegalDocuments();
  const setStatus = useSetLegalStatus();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [docType, setDocType] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const types = useMemo(() => [...new Set(rows.map((r) => r.docType))].sort(), [rows]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(
      (d) =>
        (!docType || d.docType === docType) &&
        (!q || d.title.toLowerCase().includes(q) || d.franchise.toLowerCase().includes(q)),
    );
  }, [rows, search, docType]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const apply = async (next: string) => {
    const ids = [...selected];
    if (ids.length === 0) return;
    try {
      await setStatus.mutateAsync({ ids, status: next });
      setSelected(new Set());
      toast({ title: `${ids.length} documents set to ${next.replace(/_/g, " ")}`, tone: "success" });
    } catch (err) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "No changes saved.",
        tone: "destructive",
      });
    }
  };

  const expiring = rows.filter(
    (d) =>
      d.expiryDate &&
      new Date(d.expiryDate).getTime() - Date.now() < 90 * 86_400_000 &&
      new Date(d.expiryDate).getTime() > Date.now(),
  ).length;

  const columns: Column<LegalRow>[] = [
    {
      id: "title",
      header: "Document",
      cell: (d) => (
        <div>
          <div className="font-medium text-foreground">{d.title}</div>
          <div className="text-[11.5px] capitalize text-muted-foreground">{d.docType.replace(/_/g, " ")}</div>
        </div>
      ),
    },
    { id: "franchise", header: "Franchise", cell: (d) => d.franchise },
    { id: "effectiveDate", header: "Effective", cell: (d) => <span className="tabular-nums">{day(d.effectiveDate)}</span> },
    {
      id: "expiryDate",
      header: "Expires",
      cell: (d) => {
        const soon =
          d.expiryDate && new Date(d.expiryDate).getTime() - Date.now() < 90 * 86_400_000;
        return <span className={`tabular-nums ${soon ? "text-destructive" : "text-muted-foreground"}`}>{day(d.expiryDate)}</span>;
      },
    },
    { id: "signedBy", header: "Signed By", cell: (d) => <span className="text-muted-foreground">{d.signedBy ?? "—"}</span> },
    { id: "signatureStatus", header: "Signature", cell: (d) => <StatusBadge status={d.signatureStatus} /> },
    { id: "status", header: "Status", cell: (d) => <StatusBadge status={d.status} /> },
  ];

  const count = (f: (d: LegalRow) => boolean) => rows.filter(f).length;

  return (
    <>
      <WallHeader
        eyebrow="Legal"
        title="Legal & Agreements"
        description="Franchise agreements, NDAs and addendums with signature workflow and expiry monitoring."
      />
      <WallBody>
        <div className="wall-grid">
          <Stat
            label="Active Agreements"
            value={count((d) => d.status === "active") || undefined}
            tone="success"
            loading={isLoading}
            error={error ? "Failed to load" : null}
          />
          <Stat label="Awaiting Signature" value={count((d) => d.signatureStatus === "pending") || undefined} tone="warning" />
          <Stat label="Expiring ≤ 90 Days" value={expiring || undefined} tone="destructive" />
          <Stat label="Under Review" value={count((d) => d.status === "under_review") || undefined} tone="info" />
        </div>

        <Section title="Document Register">
          <div className="space-y-3">
            <Toolbar
              search={search}
              onSearch={(v) => {
                setSearch(v);
                setPage(1);
              }}
              searchPlaceholder="Search document or franchise…"
              selectedCount={selected.size}
              bulkActions={
                <>
                  <button type="button" className={ACTION_CLS} onClick={() => apply("under_review")}>
                    Send to Review
                  </button>
                  <button type="button" className={ACTION_CLS} onClick={() => apply("active")}>
                    Mark Active
                  </button>
                  <button type="button" className={ACTION_CLS} onClick={() => apply("expired")}>
                    Mark Expired
                  </button>
                </>
              }
              right={
                <>
                  <FilterSelect
                    label="Type"
                    value={docType}
                    onChange={(v) => {
                      setDocType(v);
                      setPage(1);
                    }}
                    options={types}
                    allLabel="All types"
                  />
                  <ExportMenu<LegalRow>
                    filename="franchise-legal-documents"
                    rows={filtered}
                    sheetName="Legal"
                    permission="franchise.read"
                  />
                </>
              }
            />
            <EnterpriseTable<LegalRow>
              columns={columns}
              rows={paged}
              loading={isLoading}
              error={error ? "Failed to load legal documents" : null}
              emptyTitle="No legal documents"
              emptyDescription="Agreements and addendums appear here once issued."
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
