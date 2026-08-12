import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { History, Send, Sparkles } from "lucide-react";
import { Card, Section, Stat, WallBody, WallHeader } from "@/components/boss/Wall";
import { EnterpriseTable, type Column } from "@/components/boss/EnterpriseTable";
import { Toolbar } from "@/components/boss/Toolbar";
import { FilterSelect } from "@/components/boss/FilterSelect";
import { ExportMenu } from "@/components/boss/ExportMenu";
import { StatusBadge } from "@/components/boss/StatusBadge";
import { Modal } from "@/components/boss/Modal";
import { ErrorBanner } from "@/components/boss/ErrorState";
import { ACTION_CLS, ago, num, pct } from "@/lib/module-ui";
import { useToast } from "@/lib/toast";
import {
  useCommunications,
  useCreateCommunication,
  useModuleAudit,
  useSendCommunication,
  type MessageRow,
} from "@/lib/modules-hooks";

export const Route = createFileRoute("/communication")({
  head: () => ({
    meta: [
      { title: "Communication Center · Boss Panel" },
      {
        name: "description",
        content:
          "Franchise communication center: inbox, templates, broadcast composer, delivery metrics and inline audit history.",
      },
      { property: "og:title", content: "Communication Center · Boss Panel" },
      {
        property: "og:description",
        content: "Compose broadcasts, reuse templates and track delivery and read rates across every channel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CommunicationWall,
});

const CHANNELS = ["announcement", "broadcast", "email", "sms", "whatsapp", "push", "video_meeting"];
const AUDIENCES = [
  "All franchises",
  "All owners",
  "Owners + managers",
  "Pending KYC franchises",
  "India + UAE franchises",
];

type Tab = "inbox" | "templates";

function CommunicationWall() {
  const { data: rows = [], isLoading, error, refetch } = useCommunications();
  const send = useSendCommunication();
  const create = useCreateCommunication();
  const audit = useModuleAudit("communication");
  const { toast } = useToast();

  const [tab, setTab] = useState<Tab>("inbox");
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<MessageRow | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [draft, setDraft] = useState({
    subject: "",
    body: "",
    channel: "announcement",
    audience: "All franchises",
    recipients: 24,
    scheduledAt: "",
    asTemplate: false,
  });

  const templates = useMemo(() => rows.filter((r) => r.status === "template"), [rows]);
  const inbox = useMemo(() => rows.filter((r) => r.status !== "template"), [rows]);

  const source = tab === "templates" ? templates : inbox;
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return source.filter(
      (m) =>
        (!channel || m.channel === channel) &&
        (!status || m.status === status) &&
        (!q ||
          m.subject.toLowerCase().includes(q) ||
          m.body.toLowerCase().includes(q) ||
          m.audience.toLowerCase().includes(q)),
    );
  }, [source, search, channel, status]);

  const statuses = useMemo(() => [...new Set(inbox.map((m) => m.status))].sort(), [inbox]);

  const sentRows = inbox.filter((m) => m.status === "sent");
  const delivered = sentRows.reduce((a, m) => a + m.delivered, 0);
  const reads = sentRows.reduce((a, m) => a + m.readCount, 0);
  const queued = inbox.filter((m) => m.status === "scheduled" || m.status === "draft").length;

  const dispatch = async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      await send.mutateAsync({ ids });
      setSelected(new Set());
      toast({ title: `${ids.length} message(s) dispatched`, tone: "success" });
    } catch (err) {
      toast({
        title: "Send failed",
        description: err instanceof Error ? err.message : "Nothing was dispatched.",
        tone: "destructive",
      });
    }
  };

  const submitCompose = async (mode: "send" | "schedule" | "save") => {
    try {
      await create.mutateAsync({
        subject: draft.subject.trim(),
        body: draft.body.trim(),
        channel: draft.channel,
        audience: draft.audience,
        recipients: draft.recipients,
        scheduledAt: mode === "schedule" && draft.scheduledAt ? new Date(draft.scheduledAt).toISOString() : null,
        status: draft.asTemplate ? "template" : mode === "send" ? "sent" : mode === "schedule" ? "scheduled" : "draft",
      });
      setComposeOpen(false);
      setDraft((d) => ({ ...d, subject: "", body: "", scheduledAt: "" }));
      toast({
        title:
          draft.asTemplate
            ? "Template saved"
            : mode === "send"
              ? "Broadcast dispatched"
              : mode === "schedule"
                ? "Broadcast scheduled"
                : "Draft saved",
        tone: "success",
      });
    } catch (err) {
      toast({
        title: "Could not save message",
        description: err instanceof Error ? err.message : "Please retry.",
        tone: "destructive",
      });
    }
  };

  const useTemplate = (t: MessageRow) => {
    setDraft((d) => ({
      ...d,
      subject: t.subject,
      body: t.body,
      channel: t.channel,
      audience: t.audience,
      asTemplate: false,
    }));
    setComposeOpen(true);
  };

  const columns: Column<MessageRow>[] = [
    {
      id: "subject",
      header: "Message",
      cell: (m) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">{m.subject}</div>
          <div className="truncate text-[11.5px] text-muted-foreground">{m.audience}</div>
        </div>
      ),
    },
    { id: "channel", header: "Channel", cell: (m) => <span className="capitalize">{m.channel.replace(/_/g, " ")}</span> },
    { id: "status", header: "Status", cell: (m) => <StatusBadge status={m.status} /> },
    { id: "sentBy", header: "Sent By", cell: (m) => m.sentBy },
    { id: "recipients", header: "Recipients", cell: (m) => <span className="tabular-nums">{num(m.recipients)}</span> },
    {
      id: "delivered",
      header: "Delivered",
      cell: (m) => <span className="tabular-nums">{pct(m.delivered, m.recipients)}</span>,
    },
    { id: "readCount", header: "Read", cell: (m) => <span className="tabular-nums">{pct(m.readCount, m.recipients || 1)}</span> },
    {
      id: "actions",
      header: "",
      cell: (m) =>
        m.status === "template" ? (
          <button type="button" className={ACTION_CLS} onClick={() => useTemplate(m)}>
            Use
          </button>
        ) : m.status === "sent" ? (
          <span className="text-[11.5px] text-muted-foreground">—</span>
        ) : (
          <button type="button" className={ACTION_CLS} onClick={() => void dispatch([m.id])}>
            <Send className="h-3.5 w-3.5" aria-hidden="true" /> Send
          </button>
        ),
    },
  ];

  return (
    <>
      <WallHeader
        eyebrow="Communication"
        title="Communication Center"
        description="Announcements, broadcasts and templates with delivery metrics and a full audit history."
      />
      <WallBody>
        {error && <ErrorBanner title="Messages failed to load" error={error} onRetry={() => void refetch()} />}

        <div className="wall-grid">
          <Stat label="Messages Sent" value={sentRows.length || undefined} loading={isLoading} />
          <Stat label="Delivered" value={delivered || undefined} tone="success" loading={isLoading} />
          <Stat
            label="Read Rate"
            value={delivered ? pct(reads, delivered) : undefined}
            tone="info"
            loading={isLoading}
          />
          <Stat label="Queued / Draft" value={queued || undefined} tone="warning" loading={isLoading} />
          <Stat label="Templates" value={templates.length || undefined} loading={isLoading} />
        </div>

        <Section title={tab === "templates" ? "Templates" : "Inbox & Outbox"}>
          <div className="mb-3 flex flex-wrap items-center gap-2" role="tablist" aria-label="Communication views">
            {(["inbox", "templates"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => {
                  setTab(t);
                  setSelected(new Set());
                }}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-md border px-3 text-[12px] font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] ${
                  tab === t
                    ? "border-primary/40 bg-accent/50 text-foreground"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "templates" && <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}
                {t}
              </button>
            ))}
            <button type="button" className={`${ACTION_CLS} ml-auto`} onClick={() => setComposeOpen(true)}>
              <Send className="h-3.5 w-3.5" aria-hidden="true" /> Compose broadcast
            </button>
          </div>

          <Toolbar
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Search subject, body or audience…"
            filters={[
              ...(channel ? [{ id: "c", label: `Channel: ${channel}`, onRemove: () => setChannel("") }] : []),
              ...(status ? [{ id: "s", label: `Status: ${status}`, onRemove: () => setStatus("") }] : []),
            ]}
            onClearFilters={() => {
              setChannel("");
              setStatus("");
            }}
            right={
              <>
                <FilterSelect label="Channel" value={channel} onChange={setChannel} options={CHANNELS} />
                {tab === "inbox" && (
                  <FilterSelect label="Status" value={status} onChange={setStatus} options={statuses} />
                )}
                <ExportMenu<MessageRow>
                  filename="communications"
                  rows={filtered}
                  sheetName="Communications"
                  permission="franchise.read"
                />
              </>
            }
            selectedCount={selected.size}
            bulkActions={
              <button type="button" className={ACTION_CLS} onClick={() => void dispatch([...selected])}>
                <Send className="h-3.5 w-3.5" aria-hidden="true" /> Send now
              </button>
            }
          />

          <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <EnterpriseTable<MessageRow>
              columns={columns}
              rows={filtered}
              loading={isLoading}
              error={error ? "Failed to load messages" : null}
              emptyTitle={tab === "templates" ? "No templates yet" : "No messages in this view"}
              emptyDescription={
                tab === "templates"
                  ? "Save a broadcast as a template from the composer to reuse it later."
                  : "Clear the filters, or compose a broadcast to reach your franchise network."
              }
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
              onRowClick={(m) => setActive(m)}
            />

            <div className="flex flex-col gap-3">
              <Card>
                <div className="text-[12px] font-semibold text-foreground">
                  {active ? active.subject : "Message preview"}
                </div>
                {active ? (
                  <>
                    <div className="mt-1 text-[11.5px] text-muted-foreground">
                      {active.channel.replace(/_/g, " ")} · {active.audience} · {active.sentBy}
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-[12.5px] leading-relaxed text-foreground">
                      {active.body}
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-[11.5px]">
                      <div>
                        <div className="text-muted-foreground">Recipients</div>
                        <div className="tabular-nums text-foreground">{num(active.recipients)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Delivered</div>
                        <div className="tabular-nums text-foreground">{num(active.delivered)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Read</div>
                        <div className="tabular-nums text-foreground">{num(active.readCount)}</div>
                      </div>
                    </div>
                    {active.status !== "sent" && active.status !== "template" && (
                      <button
                        type="button"
                        className={`${ACTION_CLS} mt-3`}
                        onClick={() => void dispatch([active.id])}
                      >
                        <Send className="h-3.5 w-3.5" aria-hidden="true" /> Send now
                      </button>
                    )}
                  </>
                ) : (
                  <div className="mt-3 text-[12.5px] text-muted-foreground">
                    Select a row to read the full message and its delivery metrics.
                  </div>
                )}
              </Card>

              <Card>
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
                  <History className="h-3.5 w-3.5" aria-hidden="true" /> Audit history
                </div>
                <ul className="mt-3 space-y-2.5">
                  {audit.isLoading &&
                    [0, 1, 2].map((i) => (
                      <li key={i} className="h-8 animate-pulse rounded bg-surface-2" aria-hidden="true" />
                    ))}
                  {!audit.isLoading && (audit.data ?? []).length === 0 && (
                    <li className="text-[12px] text-muted-foreground">
                      No communication activity recorded yet.
                    </li>
                  )}
                  {(audit.data ?? []).map((a) => (
                    <li key={a.id} className="border-l-2 border-border pl-2.5">
                      <div className="text-[12px] font-medium capitalize text-foreground">
                        {a.action.replace(/_/g, " ")}
                      </div>
                      <div className="text-[11.5px] text-muted-foreground">
                        {a.actor} · {ago(a.at)}
                        {a.meta ? ` · ${a.meta}` : ""}
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </Section>
      </WallBody>

      <Modal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        title="Compose broadcast"
        description="Reaches the selected audience through the chosen channel."
        size="lg"
        footer={
          <>
            <button type="button" className={ACTION_CLS} onClick={() => setComposeOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className={ACTION_CLS}
              disabled={draft.subject.trim().length < 3 || draft.body.trim().length < 3}
              onClick={() => void submitCompose("save")}
            >
              Save draft
            </button>
            <button
              type="button"
              className={ACTION_CLS}
              disabled={
                draft.subject.trim().length < 3 || draft.body.trim().length < 3 || !draft.scheduledAt
              }
              onClick={() => void submitCompose("schedule")}
            >
              Schedule
            </button>
            <button
              type="button"
              className={ACTION_CLS}
              disabled={draft.subject.trim().length < 3 || draft.body.trim().length < 3}
              onClick={() => void submitCompose("send")}
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" /> Send now
            </button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-[12px] font-medium text-muted-foreground">
            Channel
            <select
              value={draft.channel}
              onChange={(e) => setDraft((d) => ({ ...d, channel: e.target.value }))}
              className="mt-1.5 h-9 w-full rounded-md border border-border bg-surface px-2 text-[13px] capitalize text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
            >
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[12px] font-medium text-muted-foreground">
            Audience
            <select
              value={draft.audience}
              onChange={(e) => setDraft((d) => ({ ...d, audience: e.target.value }))}
              className="mt-1.5 h-9 w-full rounded-md border border-border bg-surface px-2 text-[13px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
            >
              {AUDIENCES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[12px] font-medium text-muted-foreground">
            Recipients
            <input
              type="number"
              min={0}
              value={draft.recipients}
              onChange={(e) => setDraft((d) => ({ ...d, recipients: Number(e.target.value) || 0 }))}
              className="mt-1.5 h-9 w-full rounded-md border border-border bg-surface px-2.5 text-[13px] tabular-nums text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
            />
          </label>
          <label className="text-[12px] font-medium text-muted-foreground">
            Schedule for
            <input
              type="datetime-local"
              value={draft.scheduledAt}
              onChange={(e) => setDraft((d) => ({ ...d, scheduledAt: e.target.value }))}
              className="mt-1.5 h-9 w-full rounded-md border border-border bg-surface px-2.5 text-[13px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
            />
          </label>
        </div>

        <label className="mt-3 block text-[12px] font-medium text-muted-foreground">
          Subject
          <input
            value={draft.subject}
            onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
            placeholder="Q3 royalty cycle reminder"
            className="mt-1.5 h-9 w-full rounded-md border border-border bg-surface px-2.5 text-[13px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
          />
        </label>

        <label className="mt-3 block text-[12px] font-medium text-muted-foreground">
          Message
          <textarea
            value={draft.body}
            onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
            rows={6}
            placeholder="Write the announcement your franchise network will receive…"
            className="mt-1.5 w-full rounded-md border border-border bg-surface p-2.5 text-[13px] leading-relaxed text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
          />
        </label>

        <label className="mt-3 flex items-center gap-2 text-[12px] text-muted-foreground">
          <input
            type="checkbox"
            checked={draft.asTemplate}
            onChange={(e) => setDraft((d) => ({ ...d, asTemplate: e.target.checked }))}
          />
          Save as reusable template instead of dispatching
        </label>
      </Modal>
    </>
  );
}
