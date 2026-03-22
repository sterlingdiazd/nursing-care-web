import type { AdminCareRequestStatus } from "./adminCareRequests";
import { httpClient } from "./httpClient";
import { extractApiErrorMessage } from "./errorMessage";

export type AdminClientListStatus = "active" | "inactive";

export interface AdminClientListParams {
  search?: string;
  status?: AdminClientListStatus;
}

export interface AdminClientListItem {
  userId: string;
  email: string;
  displayName: string;
  name: string | null;
  lastName: string | null;
  identificationNumber: string | null;
  phone: string | null;
  isActive: boolean;
  ownedCareRequestsCount: number;
  lastCareRequestAtUtc: string | null;
  createdAtUtc: string;
}

export interface AdminClientCareRequestHistoryItem {
  careRequestId: string;
  careRequestDescription: string;
  careRequestType: string;
  status: AdminCareRequestStatus;
  total: number;
  careRequestDate: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  assignedNurseDisplayName: string | null;
  assignedNurseEmail: string | null;
}

export interface AdminClientDetail {
  userId: string;
  email: string;
  displayName: string;
  name: string | null;
  lastName: string | null;
  identificationNumber: string | null;
  phone: string | null;
  isActive: boolean;
  ownedCareRequestsCount: number;
  lastCareRequestAtUtc: string | null;
  hasHistoricalCareRequests: boolean;
  canAdminCreateCareRequest: boolean;
  createdAtUtc: string;
  careRequestHistory: AdminClientCareRequestHistoryItem[];
}

export interface CreateAdminClientRequest {
  name: string;
  lastName: string;
  identificationNumber: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface UpdateAdminClientRequest {
  name: string;
  lastName: string;
  identificationNumber: string;
  phone: string;
  email: string;
}

function buildQueryParams(params: AdminClientListParams) {
  const query = new URLSearchParams();

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params.status) {
    query.set("status", params.status);
  }

  return query;
}

export async function getAdminClients(params: AdminClientListParams = {}) {
  try {
    const response = await httpClient.get<AdminClientListItem[]>("/admin/clients", {
      params: buildQueryParams(params),
    });
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar los clientes."));
  }
}

export async function getAdminClientDetail(id: string) {
  try {
    const response = await httpClient.get<AdminClientDetail>(`/admin/clients/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar el detalle del cliente."));
  }
}

export async function createAdminClient(request: CreateAdminClientRequest) {
  try {
    const response = await httpClient.post<AdminClientDetail>("/admin/clients", request);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible crear el cliente."));
  }
}

export async function updateAdminClient(id: string, request: UpdateAdminClientRequest) {
  try {
    const response = await httpClient.put<AdminClientDetail>(`/admin/clients/${id}`, request);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible actualizar el cliente."));
  }
}

export async function updateAdminClientActiveState(id: string, isActive: boolean) {
  try {
    const response = await httpClient.put<AdminClientDetail>(`/admin/clients/${id}/active-state`, {
      isActive,
    });
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible actualizar el estado del cliente."));
  }
}
