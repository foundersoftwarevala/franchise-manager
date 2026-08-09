import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createComplianceRecord,
  listAuditTrail,
  listCompliance,
  setComplianceStatus,
} from "./compliance.functions";

export type ComplianceRow = {
  id: string;
  franchiseId: string;
  franchise: string;
  requirement: string;
  category: string;
  severity: string;
  status: string;
  dueDate: string | null;
  lastChecked: string | null;
  notes: string | null;
};

export type AuditTrailRow = {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
  scope: string;
  oldValue: string | null;
  newValue: string | null;
  result: string;
  meta: string | null;
};

export const useCompliance = () =>
  useQuery<ComplianceRow[]>({
    queryKey: ["fm-compliance"],
    queryFn: () => listCompliance() as Promise<ComplianceRow[]>,
    staleTime: 30_000,
  });

export const useAuditTrail = () =>
  useQuery<AuditTrailRow[]>({
    queryKey: ["fm-audit-trail"],
    queryFn: () => listAuditTrail() as Promise<AuditTrailRow[]>,
    staleTime: 15_000,
  });

export const useSetComplianceStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      ids: string[];
      status: string;
      notes?: string;
      escalate?: boolean;
    }) => setComplianceStatus({ data: { ...vars, actor: "Boss Admin" } } as never),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["fm-compliance"] });
      void qc.invalidateQueries({ queryKey: ["fm-escalations"] });
      void qc.invalidateQueries({ queryKey: ["fm-audit-trail"] });
      void qc.invalidateQueries({ queryKey: ["audit"] });
    },
  });
};

export const useCreateComplianceRecord = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      franchiseId?: string | null;
      franchise: string;
      requirement: string;
      category: string;
      severity: string;
      status?: string;
      dueDate?: string;
      notes?: string;
    }) => createComplianceRecord({ data: { ...vars, actor: "Boss Admin" } } as never),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["fm-compliance"] });
      void qc.invalidateQueries({ queryKey: ["fm-audit-trail"] });
    },
  });
};
