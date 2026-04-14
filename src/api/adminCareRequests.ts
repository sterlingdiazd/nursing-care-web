import { httpClient } from "./httpClient";
import { extractApiErrorMessage } from "./errorMessage";

export type AdminCareRequestView =
  | "all"
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "unassigned"
  | "pending-approval"
  | "rejected-today"
  | "approved-incomplete"
  | "overdue";

export type AdminCareRequestSort = "newest" | "oldest" | "scheduled" | "status" | "value";
export type AdminCareRequestStatus = "Pending" | "Approved" | "Rejected" | "Completed";

export interface AdminCareRequestListParams {
  view?: AdminCareRequestView;
  search?: string;
  scheduledFrom?: string;
  scheduledTo?: string;
  sort?: AdminCareRequestSort;
}

export interface AdminCareRequestListItem {
  id: string;
  clientUserId: string;
  clientDisplayName: string;
  clientEmail: string;
  assignedNurseUserId: string | null;
  assignedNurseDisplayName: string | null;
  assignedNurseEmail: string | null;
  careRequestDescription: string;
  careRequestType: string;
  unit: number;
  unitType: string;
  total: number;
  careRequestDate: string | null;
  status: AdminCareRequestStatus;
  createdAtUtc: string;
  updatedAtUtc: string;
  rejectedAtUtc: string | null;
  isOverdueOrStale: boolean;
}

export interface AdminCareRequestPricingBreakdown {
  category: string;
  basePrice: number;
  categoryFactor: number;
  distanceFactor: string | null;
  distanceFactorValue: number;
  complexityLevel: string | null;
  complexityFactorValue: number;
  volumeDiscountPercent: number;
  subtotalBeforeSupplies: number;
  medicalSuppliesCost: number;
  total: number;
}

export interface AdminCareRequestTimelineEvent {
  id: string;
  title: string;
  description: string;
  occurredAtUtc: string;
}

export interface AdminShiftChange {
  id: string;
  previousNurseUserId: string | null;
  previousNurseDisplayName: string | null;
  previousNurseEmail: string | null;
  newNurseUserId: string | null;
  newNurseDisplayName: string | null;
  newNurseEmail: string | null;
  reason: string;
  effectiveAtUtc: string;
  createdAtUtc: string;
}

export interface AdminShiftRecord {
  id: string;
  nurseUserId: string | null;
  nurseDisplayName: string | null;
  nurseEmail: string | null;
  scheduledStartUtc: string | null;
  scheduledEndUtc: string | null;
  actualStartUtc: string | null;
  actualEndUtc: string | null;
  status: string;
  createdAtUtc: string;
  updatedAtUtc: string;
  changes: AdminShiftChange[];
}

export interface AdminPayrollCompensationSnapshot {
  employmentType: string;
  serviceVariant: string;
  executedAtUtc: string;
  serviceDate: string;
  baseCompensation: number;
  transportIncentive: number;
  complexityBonus: number;
  medicalSuppliesCompensation: number;
  adjustmentsTotal: number;
  deductionsTotal: number;
  grossCompensation: number;
  netCompensation: number;
  ruleBaseCompensationPercent: number;
  ruleFixedAmountPerUnit: number;
  ruleTransportIncentivePercent: number;
  ruleComplexityBonusPercent: number;
  ruleMedicalSuppliesPercent: number;
  ruleVariantPercent: number;
  careRequestSubtotalBeforeSupplies: number;
  careRequestMedicalSuppliesCost: number;
  careRequestTotal: number;
  notes: string | null;
}

export interface AdminCareRequestDetail {
  id: string;
  clientUserId: string;
  clientDisplayName: string;
  clientEmail: string;
  clientIdentificationNumber: string | null;
  assignedNurseUserId: string | null;
  assignedNurseDisplayName: string | null;
  assignedNurseEmail: string | null;
  careRequestDescription: string;
  careRequestType: string;
  unit: number;
  unitType: string;
  price: number;
  total: number;
  distanceFactor: string | null;
  complexityLevel: string | null;
  clientBasePrice: number | null;
  medicalSuppliesCost: number | null;
  careRequestDate: string | null;
  suggestedNurse: string | null;
  status: AdminCareRequestStatus;
  createdAtUtc: string;
  updatedAtUtc: string;
  approvedAtUtc: string | null;
  rejectedAtUtc: string | null;
  completedAtUtc: string | null;
  isOverdueOrStale: boolean;
  pricingBreakdown: AdminCareRequestPricingBreakdown;
  payrollCompensation: AdminPayrollCompensationSnapshot | null;
  shifts: AdminShiftRecord[];
  timeline: AdminCareRequestTimelineEvent[];
}

export interface AdminCareRequestClientOption {
  userId: string;
  displayName: string;
  email: string;
  identificationNumber: string | null;
}

export interface CreateAdminCareRequestRequest {
  clientUserId: string;
  careRequestDescription: string;
  careRequestType: string;
  unit?: number;
  suggestedNurse?: string;
  price?: number;
  clientBasePriceOverride?: number;
  distanceFactor?: string;
  complexityLevel?: string;
  medicalSuppliesCost?: number;
  careRequestDate?: string;
}

function buildQueryParams(params: AdminCareRequestListParams) {
  const query = new URLSearchParams();

  if (params.view && params.view !== "all") {
    query.set("view", params.view);
  }

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params.scheduledFrom) {
    query.set("scheduledFrom", params.scheduledFrom);
  }

  if (params.scheduledTo) {
    query.set("scheduledTo", params.scheduledTo);
  }

  if (params.sort && params.sort !== "newest") {
    query.set("sort", params.sort);
  }

  return query;
}

export async function getAdminCareRequests(params: AdminCareRequestListParams = {}) {
  try {
    const response = await httpClient.get<AdminCareRequestListItem[]>("/admin/care-requests", {
      params: buildQueryParams(params),
    });
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar las solicitudes administrativas."));
  }
}

export async function getAdminCareRequestDetail(id: string) {
  try {
    const response = await httpClient.get<AdminCareRequestDetail>(`/admin/care-requests/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar el detalle administrativo."));
  }
}

export async function getAdminCareRequestClients(search?: string) {
  try {
    const response = await httpClient.get<AdminCareRequestClientOption[]>("/admin/care-requests/clients", {
      params: search?.trim() ? { search: search.trim() } : undefined,
    });
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar los clientes disponibles."));
  }
}

export interface RegisterAdminCareRequestShiftPayload {
  nurseUserId?: string | null;
  scheduledStartUtc?: string | null;
  scheduledEndUtc?: string | null;
}

export interface RecordAdminCareRequestShiftChangePayload {
  newNurseUserId?: string | null;
  reason: string;
  effectiveAtUtc?: string | null;
}

export async function registerAdminCareRequestShift(careRequestId: string, payload: RegisterAdminCareRequestShiftPayload) {
  try {
    const response = await httpClient.post<{ shiftId: string }>(`/admin/care-requests/${careRequestId}/shifts`, payload);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible registrar el turno."));
  }
}

export async function recordAdminCareRequestShiftChange(
  careRequestId: string,
  shiftId: string,
  payload: RecordAdminCareRequestShiftChangePayload,
) {
  try {
    await httpClient.post(`/admin/care-requests/${careRequestId}/shifts/${shiftId}/changes`, payload);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible registrar el cambio de turno."));
  }
}

export async function createAdminCareRequest(request: CreateAdminCareRequestRequest) {
  try {
    const response = await httpClient.post<{ id: string }>("/admin/care-requests", request);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible crear la solicitud administrativa."));
  }
}

export async function exportAdminCareRequestsCsv(params: AdminCareRequestListParams = {}) {
  try {
    const response = await httpClient.get<Blob>("/admin/care-requests/export", {
      params: buildQueryParams(params),
      responseType: "blob",
    });

    const contentDisposition = response.headers["content-disposition"] as string | undefined;
    const fileNameMatch = contentDisposition?.match(/filename=\"?([^\";]+)\"?/i);

    return {
      blob: response.data,
      fileName: fileNameMatch?.[1] ?? "solicitudes-admin.csv",
    };
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible exportar las solicitudes."));
  }
}
