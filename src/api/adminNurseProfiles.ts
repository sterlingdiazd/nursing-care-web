import { httpClient } from "./httpClient";
import { extractApiErrorMessage } from "./errorMessage";

export interface NurseWorkloadSummary {
  totalAssignedCareRequests?: number;
  pendingAssignedCareRequests?: number;
  approvedAssignedCareRequests?: number;
  rejectedAssignedCareRequests?: number;
  completedAssignedCareRequests?: number;
  lastCareRequestAtUtc?: string | null;
}

export interface PendingNurseProfile {
  userId: string;
  email: string;
  name: string | null;
  lastName: string | null;
  identificationNumber: string | null;
  phone: string | null;
  hireDate?: string | null;
  specialty?: string | null;
  createdAtUtc: string;
}

export interface NurseProfileSummary {
  userId: string;
  email: string;
  name: string | null;
  lastName: string | null;
  specialty: string | null;
  category: string | null;
  userIsActive?: boolean;
  nurseProfileIsActive?: boolean;
  isProfileComplete?: boolean;
  isAssignmentReady?: boolean;
  createdAtUtc?: string;
  workload?: NurseWorkloadSummary;
}

export type ActiveNurseProfileSummary = NurseProfileSummary;

export interface NurseProfileAdminRecord {
  userId: string;
  email: string;
  name: string | null;
  lastName: string | null;
  identificationNumber: string | null;
  phone: string | null;
  profileType: number;
  userIsActive: boolean;
  nurseProfileIsActive: boolean;
  isProfileComplete?: boolean;
  isPendingReview?: boolean;
  isAssignmentReady?: boolean;
  hasHistoricalCareRequests?: boolean;
  createdAtUtc: string;
  hireDate: string | null;
  specialty: string | null;
  licenseId: string | null;
  bankName: string | null;
  accountNumber: string | null;
  category: string | null;
  workload?: NurseWorkloadSummary;
}

export interface NurseProfileIdentityRequest {
  name: string;
  lastName: string;
  identificationNumber: string;
  phone: string;
  email: string;
  hireDate: string;
  specialty: string;
  licenseId?: string | null;
  bankName: string;
  accountNumber?: string | null;
  category: string;
}

export interface CreateNurseProfileRequest extends NurseProfileIdentityRequest {
  password: string;
  confirmPassword: string;
  isOperationallyActive: boolean;
}

export type UpdateNurseProfileRequest = NurseProfileIdentityRequest;
export type CompleteNurseProfileRequest = NurseProfileIdentityRequest;

export async function getPendingNurseProfiles() {
  try {
    const response = await httpClient.get<PendingNurseProfile[]>("/admin/nurse-profiles/pending");
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar la cola de enfermeras pendientes."));
  }
}

export async function getActiveNurseProfiles() {
  try {
    const response = await httpClient.get<ActiveNurseProfileSummary[]>("/admin/nurse-profiles/active");
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar las enfermeras activas."));
  }
}

export async function getInactiveNurseProfiles() {
  try {
    const response = await httpClient.get<NurseProfileSummary[]>("/admin/nurse-profiles/inactive");
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar las enfermeras inactivas."));
  }
}

export async function getNurseProfileForAdmin(userId: string) {
  try {
    const response = await httpClient.get<NurseProfileAdminRecord>(`/admin/nurse-profiles/${userId}`);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar el perfil de enfermeria."));
  }
}

export async function createNurseProfileForAdmin(request: CreateNurseProfileRequest) {
  try {
    const response = await httpClient.post<NurseProfileAdminRecord>("/admin/nurse-profiles", request);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible crear el perfil de enfermeria."));
  }
}

export async function updateNurseProfileForAdmin(
  userId: string,
  request: UpdateNurseProfileRequest,
) {
  try {
    const response = await httpClient.put<NurseProfileAdminRecord>(`/admin/nurse-profiles/${userId}`, request);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible actualizar el perfil de enfermeria."));
  }
}

export async function completeNurseProfileForAdmin(
  userId: string,
  request: CompleteNurseProfileRequest,
) {
  try {
    const response = await httpClient.put<NurseProfileAdminRecord>(
      `/admin/nurse-profiles/${userId}/complete`,
      request,
    );

    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible completar el perfil de enfermeria."));
  }
}

export async function setNurseOperationalAccessForAdmin(
  userId: string,
  isOperationallyActive: boolean,
) {
  try {
    const response = await httpClient.put<NurseProfileAdminRecord>(
      `/admin/nurse-profiles/${userId}/operational-access`,
      { isOperationallyActive },
    );

    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible actualizar el acceso operativo."));
  }
}
