import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Btn, Card, Section, WallBody, WallHeader } from "@/components/boss/Wall";
import { Modal } from "@/components/boss/Modal";
import { StatusBadge } from "@/components/boss/StatusBadge";
import { useModulePolicies, useUpdatePolicy, type ModulePolicy } from "@/lib/settings-hooks";
import { useToast } from "@/lib/toast";
import { ChevronRight, RefreshCw, SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Boss Panel" },
      { name: "description", content: "Franchise network policies: territory exclusivity, royalty cycles, approval gates and SLAs." },
      { property: "og:title", content: "Settings · Software Vala Boss Panel" },
      { property: "og:description", content: "Franchise network policies: territory exclusivity, royalty cycles, approval gates and SLAs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsWall,
});

const GROUPS: { title: string; items: string[] }[] = [
  { title: "Templates", items: ["Email Templates","WhatsApp Templates","SMS Templates","Document Templates","Notification Rules"] },
  { title: "Platform", items: ["Branding","Automation","Audit Settings","Security","API Keys","Integrations"] },
  { title: "System", items: ["Backup","Logs","System Health","Version Control"] },
];

const CATEGORY_LABEL: Record<string, string> = {
  territory: "Territory Rules",
  finance: "Royalty & Commission Rules",
  onboarding: "Approval Workflow",
  operations: "Operations & SLA",
  risk: "Risk Controls",
  licensing: "Licensing Limits",
  legal: "Legal & Contracts",
  growth: "Growth & Lead Routing",
  general: "General",
};

function SettingsWall() {
  const { data: policies = [], isLoading, error, refetch, isFetching } = useModulePolicies();
  const update = useUpdatePolicy();
  const { toast } = useToast();

  const [editing, setEditing] = useState<ModulePolicy | null>(null);
  const [draft, setDraft] = useState("");
  const [invalid, setInvalid] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, ModulePolicy[]>();
    for (const p of policies) {
      const list = map.get(p.category) ?? [];
      list.push(p);
      map.set(p.category, list);
    }
    return Array.from(map.entries());
  }, [policies]);

  const open = (p: ModulePolicy) => {
    setEditing(p);
    setDraft(p.value);
    setInvalid(null);
  };

  const save = () => {
    if (!editing) return;
    try {
      JSON.parse(draft);
    } catch {
      setInvalid('Value must be valid JSON — e.g. true, 30 or "monthly".');
      return;
    }
    update.mutate(
      { id: editing.id, value: draft, label: editing.label },
      {
        onSuccess: () => {
          toast({ title: "Policy updated", description: `${editing.label} saved to the network policy store.`, tone: "success" });
          setEditing(null);
        },
        onError: (e: Error) => toast({ title: "Update failed", description: e.message, tone: "destructive" }),
      },
    );
  };

  return (
    <>
      <WallHeader
        eyebrow="Settings"
        title="Platform Settings"
        description="Configure network policies, templates, security, integrations and system operations."
        actions={
          <Btn variant="outline" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </Btn>
        }
      />
      <WallBody>
        <Section
          title="Network Policies"
          description="Live rules enforced across onboarding, royalties, territory and risk. Every change is written to the audit trail."
        >
          {error ? (
            <Card>
              <div className="text-[13px] text-destructive">Could not load policies. {(error as Error).message}</div>
            </Card>
          ) : isLoading ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                  <div className="mt-2 h-3 w-full animate-pulse rounded bg-muted/60" />
                </Card>
              ))}
            </div>
          ) : policies.length === 0 ? (
            <Card>
              <div className="text-[13px] text-muted-foreground">No policies configured yet.</div>
            </Card>
          ) : (
            <div className="space-y-5">
              {grouped.map(([category, items]) => (
                <div key={category}>
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    {CATEGORY_LABEL[category] ?? category}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((p) => (
                      <Card key={p.id}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium text-foreground">{p.label}</div>
                            <div className="mt-0.5 text-[11.5px] text-muted-foreground">{p.description}</div>
                          </div>
                          <Btn variant="outline" onClick={() => open(p)}>Edit</Btn>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <code className="truncate font-mono text-[11.5px] text-[color:var(--color-info)]">{p.value}</code>
                          <StatusBadge status="neutral">{p.updatedAt}</StatusBadge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {GROUPS.map((g) => (
          <Section key={g.title} title={g.title}>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {g.items.map((i) => (
                <Card key={i}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[13px] font-medium text-foreground">{i}</div>
                      <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                        Configure {i.toLowerCase()}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          </Section>
        ))}
      </WallBody>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit policy"
        description={editing?.description}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Btn variant="ghost" onClick={() => setEditing(null)}>Cancel</Btn>
            <Btn variant="primary" onClick={save} disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save policy"}
            </Btn>
          </div>
        }
      >
        <div className="space-y-2">
          <label htmlFor="policy-value" className="text-[11.5px] font-medium text-muted-foreground">
            Value (JSON)
          </label>
          <textarea
            id="policy-value"
            rows={4}
            value={draft}
            onChange={(e) => { setDraft(e.target.value); setInvalid(null); }}
            className="w-full rounded-lg border border-border bg-background/60 p-2.5 font-mono text-[12px] text-foreground outline-none focus:border-primary"
          />
          {invalid ? <div className="text-[11.5px] text-destructive">{invalid}</div> : null}
        </div>
      </Modal>
    </>
  );
}
