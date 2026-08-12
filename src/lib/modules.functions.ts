// Server-function API for the franchise modules: countries, catalog, team,
// support, training, legal, marketing, communication and onboarding.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const listCountries = createServerFn({ method: "GET" }).handler(async () => {
  const m = await import("./modules.server");
  return (await m.select("countries", "coverage_pct", false)).map(m.mapCountry);
});

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const m = await import("./modules.server");
  return (await m.select("products", "sku")).map(m.mapProduct);
});

export const listProductAssignments = createServerFn({ method: "GET" }).handler(async () => {
  const m = await import("./modules.server");
  return (await m.select("product_assignments", "franchise")).map(m.mapAssignment);
});

export const listTeam = createServerFn({ method: "GET" }).handler(async () => {
  const m = await import("./modules.server");
  return (await m.select("team_members", "last_login", false)).map(m.mapMember);
});

export const listTickets = createServerFn({ method: "GET" }).handler(async () => {
  const m = await import("./modules.server");
  return (await m.select("support_tickets", "updated_at", false)).map(m.mapTicket);
});

export const listCourses = createServerFn({ method: "GET" }).handler(async () => {
  const m = await import("./modules.server");
  return (await m.select("training_courses", "title")).map(m.mapCourse);
});

export const listTrainingProgress = createServerFn({ method: "GET" }).handler(async () => {
  const m = await import("./modules.server");
  return (await m.select("training_progress", "score", false)).map(m.mapProgress);
});

export const listLegalDocuments = createServerFn({ method: "GET" }).handler(async () => {
  const m = await import("./modules.server");
  return (await m.select("legal_documents", "effective_date", false)).map(m.mapLegal);
});

export const listCampaigns = createServerFn({ method: "GET" }).handler(async () => {
  const m = await import("./modules.server");
  return (await m.select("marketing_campaigns", "start_date", false)).map(m.mapCampaign);
});

export const listCommunications = createServerFn({ method: "GET" }).handler(async () => {
  const m = await import("./modules.server");
  return (await m.select("communications", "created_at", false)).map(m.mapMessage);
});

export const listOnboardingTasks = createServerFn({ method: "GET" }).handler(async () => {
  const m = await import("./modules.server");
  return (await m.select("onboarding_tasks", "step_order")).map(m.mapTask);
});

const idsWithStatus = (input: unknown) =>
  z.object({ ids: z.array(z.string().uuid()).min(1), status: z.string().min(2).max(40) }).parse(input);

export const setTicketStatus = createServerFn({ method: "POST" })
  .inputValidator(idsWithStatus)
  .handler(async ({ data }) => {
    const m = await import("./modules.server");
    return m.patch("support_tickets", data.ids, { status: data.status });
  });

export const setMemberStatus = createServerFn({ method: "POST" })
  .inputValidator(idsWithStatus)
  .handler(async ({ data }) => {
    const m = await import("./modules.server");
    return m.patch("team_members", data.ids, { status: data.status });
  });

export const setAssignmentStatus = createServerFn({ method: "POST" })
  .inputValidator(idsWithStatus)
  .handler(async ({ data }) => {
    const m = await import("./modules.server");
    return m.patch("product_assignments", data.ids, { status: data.status });
  });

export const setCampaignStatus = createServerFn({ method: "POST" })
  .inputValidator(idsWithStatus)
  .handler(async ({ data }) => {
    const m = await import("./modules.server");
    return m.patch("marketing_campaigns", data.ids, { status: data.status });
  });

export const setLegalStatus = createServerFn({ method: "POST" })
  .inputValidator(idsWithStatus)
  .handler(async ({ data }) => {
    const m = await import("./modules.server");
    return m.patch("legal_documents", data.ids, { status: data.status });
  });

export const setCountryStatus = createServerFn({ method: "POST" })
  .inputValidator(idsWithStatus)
  .handler(async ({ data }) => {
    const m = await import("./modules.server");
    return m.patch("countries", data.ids, { status: data.status });
  });

export const setOnboardingTaskStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        ids: z.array(z.string().uuid()).min(1),
        status: z.enum(["pending", "in_progress", "completed", "blocked"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const m = await import("./modules.server");
    return m.patch("onboarding_tasks", data.ids, {
      status: data.status,
      completed_at: data.status === "completed" ? new Date().toISOString().slice(0, 10) : null,
    });
  });

export const setOnboardingTaskOwner = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({ ids: z.array(z.string().uuid()).min(1), owner: z.string().min(2).max(80) })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const m = await import("./modules.server");
    const res = await m.patch("onboarding_tasks", data.ids, { owner: data.owner });
    await m.audit({
      actor: "Boss Admin",
      action: "onboarding_task_assigned",
      target: data.ids.join(","),
      scope: "onboarding",
      meta: `${data.ids.length} task(s) assigned`,
      newValue: data.owner,
    });
    return res;
  });

export const setOnboardingTaskDue = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        ids: z.array(z.string().uuid()).min(1),
        dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const m = await import("./modules.server");
    const res = await m.patch("onboarding_tasks", data.ids, { due_date: data.dueDate });
    await m.audit({
      actor: "Boss Admin",
      action: "onboarding_due_date_set",
      target: data.ids.join(","),
      scope: "onboarding",
      meta: `${data.ids.length} task(s) rescheduled`,
      newValue: data.dueDate,
    });
    return res;
  });

export const sendCommunication = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ ids: z.array(z.string().uuid()).min(1) }).parse(input))
  .handler(async ({ data }) => {
    const m = await import("./modules.server");
    const res = await m.patch("communications", data.ids, { status: "sent" });
    await m.audit({
      actor: "Boss Admin",
      action: "communication_sent",
      target: data.ids.join(","),
      scope: "communication",
      meta: `${data.ids.length} message(s) dispatched`,
      oldValue: "queued",
      newValue: "sent",
    });
    return res;
  });

export const createCommunication = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        subject: z.string().min(3).max(160),
        body: z.string().min(3).max(4000),
        channel: z.string().min(2).max(40),
        audience: z.string().min(2).max(120),
        recipients: z.number().int().min(0).max(100000),
        scheduledAt: z.string().min(4).nullable(),
        status: z.enum(["draft", "scheduled", "sent", "template"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const m = await import("./modules.server");
    const row = await m.insertRow("communications", {
      subject: data.subject,
      body: data.body,
      channel: data.channel,
      audience: data.audience,
      sent_by: "Boss Admin",
      recipients: data.recipients,
      delivered: data.status === "sent" ? data.recipients : 0,
      read_count: 0,
      scheduled_at: data.scheduledAt,
      status: data.status,
    });
    await m.audit({
      actor: "Boss Admin",
      action: data.status === "template" ? "communication_template_created" : "communication_created",
      target: data.subject,
      scope: "communication",
      meta: `${data.channel} · ${data.audience} · ${data.recipients} recipients`,
      newValue: data.status,
    });
    return m.mapMessage(row);
  });

export const listModuleAudit = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ scope: z.string().min(2).max(40) }).parse(input))
  .handler(async ({ data }) => {
    const m = await import("./modules.server");
    return (await m.auditForScope(data.scope)).map(m.mapAudit);
  });

