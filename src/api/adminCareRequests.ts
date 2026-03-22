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
