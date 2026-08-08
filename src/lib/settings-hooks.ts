import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveApplication,
  listSettings,
  updateFranchiseControls,
  updateSetting,
} from "./settings.functions";

export type ModulePolicy = {
  id: string;
  key: string;
  label: string;
  description: string;
  category: string;
  /** JSON-encoded policy value. */
  value: string;
  updatedAt: string;
};

export const useModulePolicies = () =>
  useQuery<ModulePolicy[]>({
    queryKey: ["module-policies"],
    queryFn: () => listSettings() as Promise<ModulePolicy[]>,
    staleTime: 30_000,
  });

export const useUpdatePolicy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; value: string; label: string }) =>
      updateSetting({ data: { ...vars, actor: "Boss Admin" } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["module-policies"] });
      void qc.invalidateQueries({ queryKey: ["audit"] });
    },
  });
};

export const useUpdateFranchiseControls = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      id: string;
      royaltyRate: number;
      pricingVariation: number;
      leadRouting: boolean;
    }) => updateFranchiseControls({ data: { ...vars, actor: "Boss Admin" } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["franchises"] });
      void qc.invalidateQueries({ queryKey: ["audit"] });
    },
  });
};

export const useApproveApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string }) =>
      approveApplication({ data: { id: vars.id, reviewer: "Boss Admin" } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["applications"] });
      void qc.invalidateQueries({ queryKey: ["franchises"] });
      void qc.invalidateQueries({ queryKey: ["audit"] });
    },
  });
};
