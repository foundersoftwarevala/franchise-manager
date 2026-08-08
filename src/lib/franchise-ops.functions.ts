// Server-function API layer for the franchise operations modules:
// performance, royalties, contracts, fraud alerts, escalations, notifications.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const listPerformance = createServerFn({ method: "GET" }).handler(async () => {
  const { panelClient } = await import("./api.server");
  const { data, error } = await panelClient()
    .from("franchise_performance")
    .select("*")
    .order("period", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => ({
    id: p.id,
    franchiseId: p.franchise_id ?? "",
    franchise: p.franchise,
    period: p.period,
    revenue: Number(p.revenue),
    leads: p.leads,
    conversions: p.conversions,
    tickets: p.tickets,
    csat: Number(p.csat),
    slaPercent: Number(p.sla_percent),
  }));
});

export const listRoyalties = createServerFn({ method: "GET" }).handler(async () => {
  const { panelClient } = await import("./api.server");
  const { data, error } = await panelClient()
    .from("franchise_royalties")
    .select("*")
    .order("period", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    franchiseId: r.franchise_id ?? "",
    franchise: r.franchise,
    period: r.period,
    grossSales: Number(r.gross_sales),
    royaltyRate: Number(r.royalty_rate),
    royaltyDue: Number(r.royalty_due),
    commissionDue: Number(r.commission_due),
    paidAmount: Number(r.paid_amount),
    status: r.status,
    dueDate: r.due_date,
    paidAt: r.paid_at,
  }));
});

export const listContracts = createServerFn({ method: "GET" }).handler(async () => {
  const { panelClient } = await import("./api.server");
  const { data, error } = await panelClient()
    .from("franchise_contracts")
    .select("*")
    .order("end_date");
  if (error) throw new Error(error.message);
  return (data ?? []).map((c) => ({
    id: c.id,
    franchiseId: c.franchise_id ?? "",
    franchise: c.franchise,
    contractNo: c.contract_no,
    contractType: c.contract_type,
    startDate: c.start_date,
    endDate: c.end_date,
    value: Number(c.value),
    status: c.status,
    renewalStatus: c.renewal_status,
    signedAt: c.signed_at,
  }));
});

export const listFraudAlerts = createServerFn({ method: "GET" }).handler(async () => {
  const { panelClient } = await import("./api.server");
  const { data, error } = await panelClient()
    .from("franchise_fraud_alerts")
    .select("*")
    .order("risk_score", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((a) => ({
    id: a.id,
    franchiseId: a.franchise_id ?? "",
    franchise: a.franchise,
    alertType: a.alert_type,
    severity: a.severity,
    riskScore: a.risk_score,
    description: a.description,
    status: a.status,
    detectedAt: a.detected_at,
  }));
});

export const listEscalations = createServerFn({ method: "GET" }).handler(async () => {
  const { panelClient } = await import("./api.server");
  const { data, error } = await panelClient()
    .from("franchise_escalations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((e) => ({
    id: e.id,
    franchiseId: e.franchise_id ?? "",
    franchise: e.franchise,
    title: e.title,
    category: e.category,
    priority: e.priority,
    status: e.status,
    raisedBy: e.raised_by,
    assignedTo: e.assigned_to,
    slaDue: e.sla_due,
    resolution: e.resolution,
    createdAt: e.created_at,
  }));
});

export const listNotifications = createServerFn({ method: "GET" }).handler(async () => {
  const { panelClient } = await import("./api.server");
  const { data, error } = await panelClient()
    .from("franchise_notifications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((n) => ({
    id: n.id,
    franchiseId: n.franchise_id ?? "",
    franchise: n.franchise,
    title: n.title,
    message: n.message,
    type: n.type,
    channel: n.channel,
    read: n.read,
    createdAt: n.created_at,
  }));
});

// ---------------------------------------------------------------------------
// Write endpoints
// ---------------------------------------------------------------------------

export const setRoyaltyStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        ids: z.array(z.string().uuid()).min(1).max(500),
        status: z.enum(["due", "partial", "paid", "overdue", "void"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { panelClient } = await import("./api.server");
    const { error } = await panelClient()
      .from("franchise_royalties")
      .update({
        status: data.status,
        ...(data.status === "paid"
          ? { paid_at: new Date().toISOString().slice(0, 10) }
          : {}),
      })
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true, count: data.ids.length };
  });

export const setFraudAlertStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        ids: z.array(z.string().uuid()).min(1).max(500),
        status: z.enum(["open", "investigating", "resolved", "dismissed"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { panelClient } = await import("./api.server");
    const { error } = await panelClient()
      .from("franchise_fraud_alerts")
      .update({ status: data.status })
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true, count: data.ids.length };
  });

export const setEscalationStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        ids: z.array(z.string().uuid()).min(1).max(500),
        status: z.enum(["open", "in_progress", "resolved", "closed"]),
        resolution: z.string().max(2000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { panelClient } = await import("./api.server");
    const { error } = await panelClient()
      .from("franchise_escalations")
      .update({
        status: data.status,
        ...(data.resolution ? { resolution: data.resolution } : {}),
      })
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true, count: data.ids.length };
  });

export const setNotificationsRead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        ids: z.array(z.string().uuid()).min(1).max(500),
        read: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { panelClient } = await import("./api.server");
    const { error } = await panelClient()
      .from("franchise_notifications")
      .update({ read: data.read })
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true, count: data.ids.length };
  });

export const createEscalation = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        franchiseId: z.string().uuid().nullable().optional(),
        franchise: z.string().max(200).default(""),
        title: z.string().min(3).max(200),
        category: z.enum([
          "support",
          "finance",
          "legal",
          "onboarding",
          "territory",
          "license",
        ]),
        priority: z.enum(["low", "medium", "high", "critical"]),
        raisedBy: z.string().max(120).default(""),
        assignedTo: z.string().max(120).default(""),
        slaDue: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { panelClient } = await import("./api.server");
    const { error } = await panelClient()
      .from("franchise_escalations")
      .insert({
        franchise_id: data.franchiseId ?? null,
        franchise: data.franchise,
        title: data.title,
        category: data.category,
        priority: data.priority,
        raised_by: data.raisedBy,
        assigned_to: data.assignedTo,
        sla_due: data.slaDue ?? null,
      });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
