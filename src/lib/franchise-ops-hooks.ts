// Data hooks for the franchise operations modules (performance, royalties,
// contracts, fraud, escalations, notifications) — backed by real Cloud data.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listContracts,
  listEscalations,
  listFraudAlerts,
  listNotifications,
  listPerformance,
  listRoyalties,
  setEscalationStatus,
  setFraudAlertStatus,
  setNotificationsRead,
  setRoyaltyStatus,
} from "./franchise-ops.functions";

export type PerformanceRow = {
  id: string;
  franchiseId: string;
  franchise: string;
  period: string;
  revenue: number;
  leads: number;
  conversions: number;
  tickets: number;
  csat: number;
  slaPercent: number;
};

export type RoyaltyRow = {
  id: string;
  franchiseId: string;
  franchise: string;
  period: string;
  grossSales: number;
  royaltyRate: number;
  royaltyDue: number;
  commissionDue: number;
  paidAmount: number;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
};

export type ContractRow = {
  id: string;
  franchiseId: string;
  franchise: string;
  contractNo: string;
  contractType: string;
  startDate: string;
  endDate: string;
  value: number;
  status: string;
  renewalStatus: string;
  signedAt: string | null;
};

export type FraudAlertRow = {
  id: string;
  franchiseId: string;
  franchise: string;
  alertType: string;
  severity: string;
  riskScore: number;
  description: string;
  status: string;
  detectedAt: string;
};

export type EscalationRow = {
  id: string;
  franchiseId: string;
  franchise: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  raisedBy: string;
  assignedTo: string;
  slaDue: string | null;
  resolution: string | null;
  createdAt: string;
};

export type NotificationRow = {
  id: string;
  franchiseId: string;
  franchise: string;
  title: string;
  message: string;
  type: string;
  channel: string;
  read: boolean;
  createdAt: string;
};

const STALE = 30_000;

export const usePerformance = () =>
  useQuery<PerformanceRow[]>({
    queryKey: ["fm-performance"],
    queryFn: () => listPerformance() as Promise<PerformanceRow[]>,
    staleTime: STALE,
  });

export const useRoyalties = () =>
  useQuery<RoyaltyRow[]>({
    queryKey: ["fm-royalties"],
    queryFn: () => listRoyalties() as Promise<RoyaltyRow[]>,
    staleTime: STALE,
  });

export const useContracts = () =>
  useQuery<ContractRow[]>({
    queryKey: ["fm-contracts"],
    queryFn: () => listContracts() as Promise<ContractRow[]>,
    staleTime: STALE,
  });

export const useFraudAlerts = () =>
  useQuery<FraudAlertRow[]>({
    queryKey: ["fm-fraud"],
    queryFn: () => listFraudAlerts() as Promise<FraudAlertRow[]>,
    staleTime: STALE,
  });

export const useEscalations = () =>
  useQuery<EscalationRow[]>({
    queryKey: ["fm-escalations"],
    queryFn: () => listEscalations() as Promise<EscalationRow[]>,
    staleTime: STALE,
  });

export const useNotifications = () =>
  useQuery<NotificationRow[]>({
    queryKey: ["fm-notifications"],
    queryFn: () => listNotifications() as Promise<NotificationRow[]>,
    staleTime: STALE,
  });

function useInvalidating<TVars>(
  fn: (vars: TVars) => Promise<unknown>,
  key: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => void qc.invalidateQueries({ queryKey: [key] }),
  });
}

export const useSetRoyaltyStatus = () =>
  useInvalidating(
    (vars: { ids: string[]; status: string }) =>
      setRoyaltyStatus({ data: vars } as never),
    "fm-royalties",
  );

export const useSetFraudStatus = () =>
  useInvalidating(
    (vars: { ids: string[]; status: string }) =>
      setFraudAlertStatus({ data: vars } as never),
    "fm-fraud",
  );

export const useSetEscalationStatus = () =>
  useInvalidating(
    (vars: { ids: string[]; status: string; resolution?: string }) =>
      setEscalationStatus({ data: vars } as never),
    "fm-escalations",
  );

export const useSetNotificationsRead = () =>
  useInvalidating(
    (vars: { ids: string[]; read: boolean }) =>
      setNotificationsRead({ data: vars } as never),
    "fm-notifications",
  );
