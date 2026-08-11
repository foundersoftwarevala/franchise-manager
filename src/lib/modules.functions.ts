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

export const sendCommunication = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ ids: z.array(z.string().uuid()).min(1) }).parse(input))
  .handler(async ({ data }) => {
    const m = await import("./modules.server");
    return m.patch("communications", data.ids, { status: "sent" });
  });
