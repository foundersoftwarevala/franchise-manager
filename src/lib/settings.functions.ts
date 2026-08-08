import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const listSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { panelClient } = await import("./api.server");
  const { data, error } = await panelClient()
    .from("franchise_settings")
    .select("*")
    .order("category")
    .order("label");
  if (error) throw new Error(error.message);
  return (data ?? []).map((s) => ({
    id: s.id,
    key: s.key,
    label: s.label,
    description: s.description,
    category: s.category,
    value: JSON.stringify(s.value ?? null),
    updatedAt: (s.updated_at ?? "").slice(0, 10),
  }));
});

export const updateSetting = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        value: z.string().min(1).max(4000),
        actor: z.string().max(120).default("Boss Admin"),
        label: z.string().max(200).default("Policy"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(data.value);
    } catch {
      throw new Error('Value must be valid JSON (e.g. true, 30, "monthly").');
    }
    const { panelClient } = await import("./api.server");
    const db = panelClient();
    const { error } = await db
      .from("franchise_settings")
      .update({ value: parsed as never })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await db.from("audit_log").insert({
      actor: data.actor,
      action: "policy_updated",
      target: data.id,
      scope: "settings",
      meta: `${data.label} → ${data.value}`,
    });
    return { ok: true };
  });

export const updateFranchiseControls = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        royaltyRate: z.number().min(0).max(100),
        pricingVariation: z.number().min(0).max(100),
        leadRouting: z.boolean(),
        actor: z.string().max(120).default("Boss Admin"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { panelClient } = await import("./api.server");
    const db = panelClient();
    const { error } = await db
      .from("franchises")
      .update({
        royalty_rate: data.royaltyRate,
        pricing_variation: data.pricingVariation,
        lead_routing: data.leadRouting,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await db.from("audit_log").insert({
      actor: data.actor,
      action: "franchise_controls_updated",
      target: data.id,
      scope: "franchise",
      meta: `royalty ${data.royaltyRate}% · pricing ±${data.pricingVariation}% · lead routing ${
        data.leadRouting ? "on" : "off"
      }`,
    });
    return { ok: true };
  });

export const approveApplication = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        reviewer: z.string().max(120).default("Boss Admin"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: franchiseId, error } = await supabaseAdmin.rpc("fm_approve_application", {
      _application_id: data.id,
      _reviewer: data.reviewer,
    });
    if (error) throw new Error(error.message);
    return { ok: true, franchiseId: franchiseId as string };
  });
