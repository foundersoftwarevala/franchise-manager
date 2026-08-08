import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  getDocumentLink,
  registerDocument,
  setDocumentStatus,
} from "./documents.functions";

export const DOCUMENT_BUCKET = "franchise-documents";
const MAX_SIZE = 20 * 1024 * 1024;

/** Uploads to the private vault bucket, returning the stored object path. */
export async function uploadDocumentFile(file: File, folder = "general") {
  if (file.size > MAX_SIZE) throw new Error("File is larger than 20 MB.");
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${folder}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

export const useUploadDocuments = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      files: File[];
      category: "kyc" | "compliance";
      kind: string;
      franchise?: string | null;
      targetId?: string;
      targetLabel?: string;
    }) => {
      const results: string[] = [];
      for (const file of vars.files) {
        const storagePath = await uploadDocumentFile(file, vars.category);
        await registerDocument({
          data: {
            name: file.name,
            category: vars.category,
            kind: vars.kind,
            franchise: vars.franchise ?? null,
            scope: "franchise",
            targetId: vars.targetId ?? "",
            targetLabel: vars.targetLabel ?? "",
            size: file.size,
            storagePath,
            uploadedBy: "Boss Admin",
          },
        });
        results.push(storagePath);
      }
      return results;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["documents"] });
      void qc.invalidateQueries({ queryKey: ["audit"] });
    },
  });
};

export const useDocumentLink = () =>
  useMutation({
    mutationFn: (vars: { storagePath: string }) => getDocumentLink({ data: vars }),
  });

export const useSetDocumentStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { ids: string[]; status: "pending_review" | "verified" | "attached" | "rejected" }) =>
      setDocumentStatus({ data: { ...vars, actor: "Boss Admin" } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["documents"] });
      void qc.invalidateQueries({ queryKey: ["audit"] });
    },
  });
};
