import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Section, Stat, WallBody, WallHeader } from "@/components/boss/Wall";
import { EnterpriseTable, type Column } from "@/components/boss/EnterpriseTable";
import { Toolbar } from "@/components/boss/Toolbar";
import { FilterSelect } from "@/components/boss/FilterSelect";
import { ExportMenu } from "@/components/boss/ExportMenu";
import { StatusBadge } from "@/components/boss/StatusBadge";
import { ACTION_CLS, money, num } from "@/lib/module-ui";
import { useToast } from "@/lib/toast";
import {
  useProductAssignments,
  useProducts,
  useSetAssignmentStatus,
  type AssignmentRow,
  type ProductRow,
} from "@/lib/modules-hooks";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Product & Service Catalog · Boss Panel" },
      {
        name: "description",
        content:
          "Franchise product catalog with SKUs, list pricing, per-franchise assignments, regional pricing and stock.",
      },
      { property: "og:title", content: "Product & Service Catalog · Boss Panel" },
      {
        property: "og:description",
        content: "Catalog control with SKU pricing, franchise assignments and regional rules.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductsWall,
});

function ProductsWall() {
  const { data: products = [], isLoading: loadingProducts, error: productsError } = useProducts();
  const { data: rows = [], isLoading, error } = useProductAssignments();
  const setStatus = useSetAssignmentStatus();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [franchise, setFranchise] = useState("");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const franchises = useMemo(() => [...new Set(rows.map((r) => r.franchise))].sort(), [rows]);
  const categories = useMemo(() => [...new Set(rows.map((r) => r.category))].sort(), [rows]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        (!franchise || r.franchise === franchise) &&
        (!category || r.category === category) &&
        (!q || r.product.toLowerCase().includes(q) || r.franchise.toLowerCase().includes(q)),
    );
  }, [rows, search, franchise, category]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const apply = async (next: string) => {
    const ids = [...selected];
    if (ids.length === 0) return;
    try {
      await setStatus.mutateAsync({ ids, status: next });
      setSelected(new Set());
      toast({ title: `${ids.length} assignments set to ${next}`, tone: "success" });
    } catch (err) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "No changes saved.",
        tone: "destructive",
      });
    }
  };

  const columns: Column<AssignmentRow>[] = [
    {
      id: "product",
      header: "Product / Service",
      cell: (r) => (
        <div>
          <div className="font-medium text-foreground">{r.product}</div>
          <div className="text-[11.5px] capitalize text-muted-foreground">
            {r.category} · {r.kind}
          </div>
        </div>
      ),
    },
    { id: "franchise", header: "Franchise", cell: (r) => r.franchise },
    { id: "region", header: "Region", cell: (r) => <span className="text-muted-foreground">{r.region}</span> },
    { id: "price", header: "Price", cell: (r) => <span className="tabular-nums">{money(r.price)}</span> },
    {
      id: "discountPct",
      header: "Discount",
      cell: (r) => <span className="tabular-nums text-muted-foreground">{r.discountPct}%</span>,
    },
    {
      id: "stock",
      header: "Stock",
      cell: (r) => (
        <span className={`tabular-nums ${r.stock === 0 ? "text-destructive" : "text-foreground"}`}>
          {r.kind === "service" ? "—" : num(r.stock)}
        </span>
      ),
    },
    { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  ];

  const catalogColumns: Column<ProductRow>[] = [
    {
      id: "name",
      header: "Catalog Item",
      cell: (p) => (
        <div>
          <div className="font-medium text-foreground">{p.name}</div>
          <div className="text-[11.5px] text-muted-foreground">{p.sku}</div>
        </div>
      ),
    },
    { id: "category", header: "Category", cell: (p) => <span className="capitalize">{p.category}</span> },
    { id: "kind", header: "Type", cell: (p) => <span className="capitalize text-muted-foreground">{p.kind}</span> },
    {
      id: "listPrice",
      header: "List Price",
      cell: (p) => <span className="tabular-nums">{money(p.listPrice, p.currency)}</span>,
    },
    { id: "status", header: "Status", cell: (p) => <StatusBadge status={p.status} /> },
  ];

  return (
    <>
      <WallHeader
        eyebrow="Products"
        title="Product & Service Catalog"
        description="Master catalog, franchise-level assignments, regional pricing rules and stock visibility."
      />
      <WallBody>
        <div className="wall-grid">
          <Stat
            label="Catalog Items"
            value={products.length || undefined}
            loading={loadingProducts}
            error={productsError ? "Failed to load" : null}
          />
          <Stat
            label="Active Assignments"
            value={rows.filter((r) => r.status === "active").length || undefined}
            tone="success"
            loading={isLoading}
          />
          <Stat label="Franchises Served" value={franchises.length || undefined} tone="info" />
          <Stat
            label="Out of Stock"
            value={rows.filter((r) => r.kind !== "service" && r.stock === 0).length || undefined}
            tone="destructive"
          />
        </div>

        <Section title="Franchise Assignments" description="Per-franchise pricing, discounts and stock">
          <div className="space-y-3">
            <Toolbar
              search={search}
              onSearch={(v) => {
                setSearch(v);
                setPage(1);
              }}
              searchPlaceholder="Search product or franchise…"
              selectedCount={selected.size}
              bulkActions={
                <>
                  <button type="button" className={ACTION_CLS} onClick={() => apply("active")}>
                    Enable
                  </button>
                  <button type="button" className={ACTION_CLS} onClick={() => apply("paused")}>
                    Pause
                  </button>
                </>
              }
              right={
                <>
                  <FilterSelect
                    label="Franchise"
                    value={franchise}
                    onChange={(v) => {
                      setFranchise(v);
                      setPage(1);
                    }}
                    options={franchises}
                    allLabel="All franchises"
                  />
                  <FilterSelect
                    label="Category"
                    value={category}
                    onChange={(v) => {
                      setCategory(v);
                      setPage(1);
                    }}
                    options={categories}
                    allLabel="All categories"
                  />
                  <ExportMenu<AssignmentRow>
                    filename="franchise-product-assignments"
                    rows={filtered}
                    sheetName="Assignments"
                    permission="franchise.read"
                  />
                </>
              }
            />
            <EnterpriseTable<AssignmentRow>
              columns={columns}
              rows={paged}
              loading={isLoading}
              error={error ? "Failed to load product assignments" : null}
              emptyTitle="No assignments"
              emptyDescription="Assign catalog items to franchises to control pricing and stock."
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

        <Section title="Master Catalog" description="Global SKUs and list pricing">
          <EnterpriseTable<ProductRow>
            columns={catalogColumns}
            rows={products}
            loading={loadingProducts}
            error={productsError ? "Failed to load catalog" : null}
            selectable={false}
            emptyTitle="No catalog items"
            emptyDescription="Products and services appear here once the catalog is populated."
          />
        </Section>
      </WallBody>
    </>
  );
}
