// Server-function API layer for the compliance register and the audit trail
// reporting view (change diffs + result).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const listCompliance = createServerFn({ method: "GET" }).handler(async () => {
  const { panelClient } = await import("./api.server");
  const { data, error } = await panelClient()
    .from("franchise_compliance")
    .select("*")
    .order("due_date", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((c) => ({
    id: c.id,
    franchiseId: c.franchise_id ?? "",
    franchise: c.franchise,
    requirement: c.requirement,
    category: c.category,
    severity: c.severity,
    status: c.status,
    dueDate: c.due_date,
    lastChecked: c.last_checked,
    notes: c.notes,
  }));
});

export const listAuditTrail = createServerFn({ method: "GET" }).handler(async () => {
  const { panelClient } = await import("./api.server");
  const { data, error } = await panelClient()
    .from("audit_log")
    .select("*")
    .order("at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    at: r.at,
    actor: r.actor,
    action: r.action,
    target: r.target,
    scope: r.scope,
    oldValue: r.old_value ?? null,
    newValue: r.new_value ?? null,
    result: r.result ?? "success",
    meta: r.meta ?? null,
  }));
});

const STATUS = z.enum([
  "pending",
  "compliant",
  "warned",
  "escalated",
  "breach",
  "resolved",
]);

export const createComplianceRecord = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        franchiseId: z.string().uuid().nullable().optional(),
        franchise: z.string().max(200).default(""),
        requirement: z.string().min(3).max(240),
        category: z.enum(["legal", "financial", "operational", "brand", "kyc"]),
        severity: z.enum(["low", "medium", "high", "critical"]),
        status: STATUS.default("pending"),
        dueDate: z.string().optional(),
        notes: z.string().max(2000).optional(),
        actor: z.string().max(120).default("Boss Admin"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { panelClient } = await import("./api.server");
    const db = panelClient();
    const { data: row, error } = await db
      .from("franchise_compliance")
      .insert({
        franchise_id: data.franchiseId ?? null,
        franchise: data.franchise,
        requirement: data.requirement,
        category: data.category,
        severity: data.severity,
        status: data.status,
        due_date: data.dueDate ?? null,
        notes: data.notes ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await db.from("audit_log").insert({
      actor: data.actor,
      action: "compliance_record_created",
      target: row?.id ?? "",
      scope: "compliance",
      new_value: `${data.status} · ${data.severity}`,
      result: "success",
      meta: `${data.requirement} · ${data.franchise}`,
    });
    return { ok: true, id: row?.id };
  });

/**
 * Updates compliance status for the given records, writes a diffed audit
 * entry per record and — when escalating — opens a real escalation ticket.
 */
export const setComplianceStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        ids: z.array(z.string().uuid()).min(1).max(200),
        status: STATUS,
        notes: z.string().max(2000).optional(),
        escalate: z.boolean().default(false),
        actor: z.string().max(120).default("Boss Admin"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { panelClient } = await import("./api.server");
    const db = panelClient();

    const { data: before, error: readErr } = await db
      .from("franchise_compliance")
      .select("*")
      .in("id", data.ids);
    if (readErr) throw new Error(readErr.message);
    const rows = before ?? [];

    const today = new Date().toISOString().slice(0, 10);
    const { error } = await db
      .from("franchise_compliance")
      .update({
        status: data.status,
        last_checked: today,
        ...(data.notes ? { notes: data.notes } : {}),
      })
      .in("id", data.ids);
    if (error) throw new Error(error.message);

    if (data.escalate && rows.length) {
      const sla = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString();
      const { error: escErr } = await db.from("franchise_escalations").insert(
        rows.map((r) => ({
          franchise_id: r.franchise_id,
          franchise: r.franchise,
          title: `Compliance breach — ${r.requirement}`,
          category: "legal",
          priority: r.severity === "critical" ? "critical" : "high",
          status: "open",
          raised_by: data.actor,
          assigned_to: "Compliance Team",
          sla_due: sla,
        })),
      );
      if (escErr) throw new Error(escErr.message);
    }

    await db.from("audit_log").insert(
      rows.map((r) => ({
        actor: data.actor,
        action: data.escalate ? "compliance_escalated" : "compliance_status_changed",
        target: r.id,
        scope: "compliance",
        old_value: r.status,
        new_value: data.status,
        result: "success",
        meta: `${r.requirement} · ${r.franchise}`,
      })),
    );

    return { ok: true, count: data.ids.length, escalations: data.escalate ? rows.length : 0 };
  });
