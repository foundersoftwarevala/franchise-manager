import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Registers an uploaded vault file against a franchise/licence record. */
export const registerDocument = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().min(1).max(300),
        category: z.enum(["kyc", "compliance"]),
        kind: z.string().max(80).default("other"),
        franchise: z.string().max(200).nullable().optional(),
        scope: z.string().max(40).default("franchise"),
        targetId: z.string().max(120).default(""),
        targetLabel: z.string().max(120).default(""),
        size: z.number().int().min(0).max(50_000_000),
        storagePath: z.string().min(1).max(500),
        uploadedBy: z.string().max(120).default("Boss Admin"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { panelClient } = await import("./api.server");
    const db = panelClient();
    const { data: row, error } = await db
      .from("documents")
      .insert({
        name: data.name,
        category: data.category,
        kind: data.kind,
        franchise: data.franchise ?? null,
        scope: data.scope,
        target_id: data.targetId,
        target_label: data.targetLabel,
        size: data.size,
        storage_path: data.storagePath,
        uploaded_by: data.uploadedBy,
        status: "pending_review",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await db.from("audit_log").insert({
      actor: data.uploadedBy,
      action: "document_uploaded",
      target: data.targetId || (row?.id ?? ""),
      scope: "document",
      meta: `${data.name} · ${data.category}`,
    });
    return { ok: true, id: row?.id ?? "" };
  });

/** Time-limited link so private vault files can be opened from the panel. */
export const getDocumentLink = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ storagePath: z.string().min(1).max(500) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { panelClient } = await import("./api.server");
    const { data: signed, error } = await panelClient()
      .storage.from("franchise-documents")
      .createSignedUrl(data.storagePath, 600);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

export const setDocumentStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        ids: z.array(z.string().uuid()).min(1).max(200),
        status: z.enum(["pending_review", "verified", "attached", "rejected"]),
        actor: z.string().max(120).default("Boss Admin"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { panelClient } = await import("./api.server");
    const db = panelClient();
    const { error } = await db.from("documents").update({ status: data.status }).in("id", data.ids);
    if (error) throw new Error(error.message);
    await db.from("audit_log").insert({
      actor: data.actor,
      action: "document_status_changed",
      target: data.ids.join(","),
      scope: "document",
      meta: `${data.ids.length} document(s) → ${data.status}`,
    });
    return { ok: true, count: data.ids.length };
  });
