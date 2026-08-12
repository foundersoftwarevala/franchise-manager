// Server-only row mappers + queries for the franchise modules that were
// previously UI-only shells (countries, catalog, team, support, training,
// legal, marketing, communication, onboarding).
import { panelClient } from "./api.server";

type Row = Record<string, unknown>;

const s = (v: unknown, d = "") => (typeof v === "string" ? v : d);
const n = (v: unknown, d = 0) => (typeof v === "number" ? v : Number(v ?? d) || d);
const b = (v: unknown) => v === true;
const sn = (v: unknown) => (typeof v === "string" ? v : null);
const nn = (v: unknown) => (v === null || v === undefined ? null : Number(v));

export async function select(table: string, order: string, asc = true) {
  const { data, error } = await panelClient()
    .from(table as never)
    .select("*")
    .order(order, { ascending: asc });
  if (error) throw new Error(error.message);
  return (data ?? []) as Row[];
}

export async function patch(table: string, ids: string[], values: Row) {
  if (ids.length === 0) return { updated: 0 };
  const { error } = await panelClient()
    .from(table as never)
    .update(values as never)
    .in("id", ids);
  if (error) throw new Error(error.message);
  return { updated: ids.length };
}

export const mapCountry = (r: Row) => ({
  id: s(r["id"]),
  name: s(r["name"]),
  code: s(r["code"]),
  currency: s(r["currency"]),
  population: n(r["population"]),
  marketSize: n(r["market_size"]),
  coveragePct: n(r["coverage_pct"]),
  status: s(r["status"]),
  expansionPlan: s(r["expansion_plan"]),
});

export const mapProduct = (r: Row) => ({
  id: s(r["id"]),
  name: s(r["name"]),
  sku: s(r["sku"]),
  category: s(r["category"]),
  kind: s(r["kind"]),
  listPrice: n(r["list_price"]),
  currency: s(r["currency"]),
  status: s(r["status"]),
});

export const mapAssignment = (r: Row) => ({
  id: s(r["id"]),
  product: s(r["product"]),
  category: s(r["category"]),
  franchise: s(r["franchise"]),
  region: s(r["region"]),
  price: n(r["price"]),
  discountPct: n(r["discount_pct"]),
  stock: n(r["stock"]),
  kind: s(r["kind"]),
  status: s(r["status"]),
});

export const mapMember = (r: Row) => ({
  id: s(r["id"]),
  name: s(r["name"]),
  email: s(r["email"]),
  phone: sn(r["phone"]),
  franchise: s(r["franchise"]),
  role: s(r["role"]),
  lastLogin: sn(r["last_login"]),
  sessions: n(r["sessions"]),
  twoFactor: b(r["two_factor"]),
  status: s(r["status"]),
});

export const mapTicket = (r: Row) => ({
  id: s(r["id"]),
  ticketNo: s(r["ticket_no"]),
  franchise: s(r["franchise"]),
  subject: s(r["subject"]),
  channel: s(r["channel"]),
  priority: s(r["priority"]),
  owner: s(r["owner"]),
  slaDue: sn(r["sla_due"]),
  firstResponseMins: nn(r["first_response_mins"]),
  csat: nn(r["csat"]),
  status: s(r["status"]),
  updatedAt: s(r["updated_at"]),
});

export const mapCourse = (r: Row) => ({
  id: s(r["id"]),
  title: s(r["title"]),
  kind: s(r["kind"]),
  durationMins: n(r["duration_mins"]),
  enrolled: n(r["enrolled"]),
  completed: n(r["completed"]),
  avgScore: n(r["avg_score"]),
  certificate: b(r["certificate"]),
  status: s(r["status"]),
});

export const mapProgress = (r: Row) => ({
  id: s(r["id"]),
  franchise: s(r["franchise"]),
  member: s(r["member"]),
  coursesCompleted: n(r["courses_completed"]),
  score: n(r["score"]),
  certificates: n(r["certificates"]),
});

export const mapLegal = (r: Row) => ({
  id: s(r["id"]),
  title: s(r["title"]),
  franchise: s(r["franchise"]),
  docType: s(r["doc_type"]),
  effectiveDate: sn(r["effective_date"]),
  expiryDate: sn(r["expiry_date"]),
  signedBy: sn(r["signed_by"]),
  signatureStatus: s(r["signature_status"]),
  status: s(r["status"]),
});

export const mapCampaign = (r: Row) => ({
  id: s(r["id"]),
  name: s(r["name"]),
  channel: s(r["channel"]),
  audience: s(r["audience"]),
  sent: n(r["sent"]),
  opens: n(r["opens"]),
  clicks: n(r["clicks"]),
  leads: n(r["leads"]),
  conversions: n(r["conversions"]),
  spend: n(r["spend"]),
  coupons: n(r["coupons"]),
  startDate: sn(r["start_date"]),
  endDate: sn(r["end_date"]),
  status: s(r["status"]),
});

export const mapMessage = (r: Row) => ({
  id: s(r["id"]),
  subject: s(r["subject"]),
  body: s(r["body"]),
  channel: s(r["channel"]),
  audience: s(r["audience"]),
  sentBy: s(r["sent_by"]),
  recipients: n(r["recipients"]),
  delivered: n(r["delivered"]),
  readCount: n(r["read_count"]),
  scheduledAt: sn(r["scheduled_at"]),
  status: s(r["status"]),
});

export const mapTask = (r: Row) => ({
  id: s(r["id"]),
  franchise: s(r["franchise"]),
  step: s(r["step"]),
  stepOrder: n(r["step_order"]),
  owner: s(r["owner"]),
  status: s(r["status"]),
  dueDate: sn(r["due_date"]),
  completedAt: sn(r["completed_at"]),
});

/** Insert a single row and return the created record. */
export async function insertRow(table: string, values: Row) {
  const { data, error } = await panelClient()
    .from(table as never)
    .insert(values as never)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Row;
}

/** Append an audit-log entry so module actions are audit-ready. */
export async function audit(entry: {
  actor: string;
  action: string;
  target: string;
  scope: string;
  meta?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
}) {
  const { error } = await panelClient()
    .from("audit_log" as never)
    .insert({
      actor: entry.actor,
      action: entry.action,
      target: entry.target,
      scope: entry.scope,
      meta: entry.meta ?? null,
      old_value: entry.oldValue ?? null,
      new_value: entry.newValue ?? null,
      result: "success",
    } as never);
  if (error) throw new Error(error.message);
}

/** Audit entries for one module scope, newest first. */
export async function auditForScope(scope: string, limit = 40) {
  const { data, error } = await panelClient()
    .from("audit_log" as never)
    .select("*")
    .eq("scope", scope)
    .order("at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as Row[];
}

export const mapAudit = (r: Row) => ({
  id: s(r["id"]),
  at: s(r["at"]),
  actor: s(r["actor"]),
  action: s(r["action"]),
  target: s(r["target"]),
  scope: s(r["scope"]),
  oldValue: sn(r["old_value"]),
  newValue: sn(r["new_value"]),
  result: s(r["result"]),
  meta: sn(r["meta"]),
});
