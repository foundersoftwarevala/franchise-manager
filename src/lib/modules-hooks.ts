// TanStack Query hooks for the franchise modules backed by real Cloud tables.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCommunication,
  listCampaigns,
  listCommunications,
  listCountries,
  listCourses,
  listLegalDocuments,
  listModuleAudit,
  listOnboardingTasks,
  listProductAssignments,
  listProducts,
  listTeam,
  listTickets,
  listTrainingProgress,
  sendCommunication,
  setAssignmentStatus,
  setCampaignStatus,
  setCountryStatus,
  setLegalStatus,
  setMemberStatus,
  setOnboardingTaskDue,
  setOnboardingTaskOwner,
  setOnboardingTaskStatus,
  setTicketStatus,
} from "./modules.functions";

const STALE = 30_000;


export type CountryRow = {
  id: string; name: string; code: string; currency: string; population: number;
  marketSize: number; coveragePct: number; status: string; expansionPlan: string;
};
export type ProductRow = {
  id: string; name: string; sku: string; category: string; kind: string;
  listPrice: number; currency: string; status: string;
};
export type AssignmentRow = {
  id: string; product: string; category: string; franchise: string; region: string;
  price: number; discountPct: number; stock: number; kind: string; status: string;
};
export type MemberRow = {
  id: string; name: string; email: string; phone: string | null; franchise: string;
  role: string; lastLogin: string | null; sessions: number; twoFactor: boolean; status: string;
};
export type TicketRow = {
  id: string; ticketNo: string; franchise: string; subject: string; channel: string;
  priority: string; owner: string; slaDue: string | null; firstResponseMins: number | null;
  csat: number | null; status: string; updatedAt: string;
};
export type CourseRow = {
  id: string; title: string; kind: string; durationMins: number; enrolled: number;
  completed: number; avgScore: number; certificate: boolean; status: string;
};
export type ProgressRow = {
  id: string; franchise: string; member: string; coursesCompleted: number;
  score: number; certificates: number;
};
export type LegalRow = {
  id: string; title: string; franchise: string; docType: string; effectiveDate: string | null;
  expiryDate: string | null; signedBy: string | null; signatureStatus: string; status: string;
};
export type CampaignRow = {
  id: string; name: string; channel: string; audience: string; sent: number; opens: number;
  clicks: number; leads: number; conversions: number; spend: number; coupons: number;
  startDate: string | null; endDate: string | null; status: string;
};
export type MessageRow = {
  id: string; subject: string; body: string; channel: string; audience: string; sentBy: string;
  recipients: number; delivered: number; readCount: number; scheduledAt: string | null; status: string;
};
export type TaskRow = {
  id: string; franchise: string; step: string; stepOrder: number; owner: string;
  status: string; dueDate: string | null; completedAt: string | null;
};

const list = <T,>(key: string, fn: () => unknown) =>
  useQuery<T[]>({ queryKey: [key], queryFn: () => fn() as Promise<T[]>, staleTime: STALE });

export const useCountries = () => list<CountryRow>("fm-countries", listCountries);
export const useProducts = () => list<ProductRow>("fm-products", listProducts);
export const useProductAssignments = () =>
  list<AssignmentRow>("fm-product-assignments", listProductAssignments);
export const useTeam = () => list<MemberRow>("fm-team", listTeam);
export const useTickets = () => list<TicketRow>("fm-tickets", listTickets);
export const useCourses = () => list<CourseRow>("fm-courses", listCourses);
export const useTrainingProgress = () => list<ProgressRow>("fm-training-progress", listTrainingProgress);
export const useLegalDocuments = () => list<LegalRow>("fm-legal", listLegalDocuments);
export const useCampaigns = () => list<CampaignRow>("fm-campaigns", listCampaigns);
export const useCommunications = () => list<MessageRow>("fm-communications", listCommunications);
export const useOnboardingTasks = () => list<TaskRow>("fm-onboarding-tasks", listOnboardingTasks);

function useInvalidating<TVars>(fn: (vars: TVars) => Promise<unknown>, key: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => void qc.invalidateQueries({ queryKey: [key] }),
  });
}

export const useSetTicketStatus = () =>
  useInvalidating((v: { ids: string[]; status: string }) => setTicketStatus({ data: v } as never), "fm-tickets");
export const useSetMemberStatus = () =>
  useInvalidating((v: { ids: string[]; status: string }) => setMemberStatus({ data: v } as never), "fm-team");
export const useSetAssignmentStatus = () =>
  useInvalidating(
    (v: { ids: string[]; status: string }) => setAssignmentStatus({ data: v } as never),
    "fm-product-assignments",
  );
export const useSetCampaignStatus = () =>
  useInvalidating((v: { ids: string[]; status: string }) => setCampaignStatus({ data: v } as never), "fm-campaigns");
export const useSetLegalStatus = () =>
  useInvalidating((v: { ids: string[]; status: string }) => setLegalStatus({ data: v } as never), "fm-legal");
export const useSetCountryStatus = () =>
  useInvalidating((v: { ids: string[]; status: string }) => setCountryStatus({ data: v } as never), "fm-countries");
export const useSetTaskStatus = () =>
  useInvalidating(
    (v: { ids: string[]; status: string }) => setOnboardingTaskStatus({ data: v } as never),
    "fm-onboarding-tasks",
  );
export const useSendCommunication = () =>
  useInvalidating((v: { ids: string[] }) => sendCommunication({ data: v } as never), "fm-communications");
