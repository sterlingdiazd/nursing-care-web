import { httpClient } from "./httpClient";
import { extractApiErrorMessage } from "./errorMessage";

export type AdminUserRoleName = "Admin" | "Client" | "Nurse";
export type AdminUserProfileType = "Client" | "Nurse";
export type AdminUserAccountStatus =
  | "Active"
  | "Inactive"
  | "ProfileIncomplete"
  | "AdminReview"
  | "ManualIntervention";

export interface AdminUserListParams {
  search?: string;
  role?: AdminUserRoleName;
  profileType?: AdminUserProfileType;
  status?: AdminUserAccountStatus;
}

export interface AdminUserListItem {
  id: string;
  email: string;
  displayName: string;
  name: string | null;
  lastName: string | null;
  identificationNumber: string | null;
  phone: string | null;
  profileType: AdminUserProfileType;
  roleNames: AdminUserRoleName[];
  isActive: boolean;
  accountStatus: AdminUserAccountStatus;
  requiresProfileCompletion: boolean;
  requiresAdminReview: boolean;
  requiresManualIntervention: boolean;
  createdAtUtc: string;
}

export interface AdminUserNurseProfile {
  isActive: boolean;
  hireDate: string | null;
  specialty: string | null;
  licenseId: string | null;
  bankName: string | null;
  accountNumber: string | null;
  category: string | null;
  assignedCareRequestsCount: number;
}

export interface AdminUserClientProfile {
  ownedCareRequestsCount: number;
}

export interface AdminUserDetail {
  id: string;
  email: string;
  displayName: string;
  name: string | null;
  lastName: string | null;
  identificationNumber: string | null;
  phone: string | null;
  profileType: AdminUserProfileType;
  roleNames: AdminUserRoleName[];
  allowedRoleNames: AdminUserRoleName[];
  isActive: boolean;
  accountStatus: AdminUserAccountStatus;
  requiresProfileCompletion: boolean;
  requiresAdminReview: boolean;
  requiresManualIntervention: boolean;
  hasOperationalHistory: boolean;
  activeRefreshTokenCount: number;
  createdAtUtc: string;
  nurseProfile: AdminUserNurseProfile | null;
  clientProfile: AdminUserClientProfile | null;
}

export interface UpdateAdminUserRequest {
  name: string;
  lastName: string;
  identificationNumber: string;
  phone: string;
  email: string;
}

export interface CreateAdminAccountRequest {
  name: string;
  lastName: string;
  identificationNumber: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface InvalidateAdminUserSessionsResult {
  userId: string;
  revokedActiveSessionCount: number;
}

function buildQueryParams(params: AdminUserListParams) {
  const query = new URLSearchParams();

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params.role) {
    query.set("role", params.role);
  }

  if (params.profileType) {
    query.set("profileType", params.profileType);
  }

  if (params.status) {
    query.set("status", params.status);
  }

  return query;
}

export async function getAdminUsers(params: AdminUserListParams = {}) {
  try {
    const response = await httpClient.get<AdminUserListItem[]>("/admin/users", {
      params: buildQueryParams(params),
    });
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar los usuarios administrativos."));
  }
}

export async function getAdminUserDetail(id: string) {
  try {
    const response = await httpClient.get<AdminUserDetail>(`/admin/users/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar el detalle de la cuenta."));
  }
}

export async function updateAdminUser(id: string, request: UpdateAdminUserRequest) {
  try {
    const response = await httpClient.put<AdminUserDetail>(`/admin/users/${id}`, request);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible actualizar la cuenta."));
  }
}

export async function createAdminAccount(request: CreateAdminAccountRequest) {
  try {
    const response = await httpClient.post<AdminUserDetail>("/admin/admin-accounts", request);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible crear la cuenta administrativa."));
  }
}

export async function updateAdminUserRoles(id: string, roleNames: AdminUserRoleName[]) {
  try {
    const response = await httpClient.put<AdminUserDetail>(`/admin/users/${id}/roles`, {
      roleNames,
    });
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible actualizar los roles."));
  }
}

export async function updateAdminUserActiveState(id: string, isActive: boolean) {
  try {
    const response = await httpClient.put<AdminUserDetail>(`/admin/users/${id}/active-state`, {
      isActive,
    });
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible actualizar el estado de la cuenta."));
  }
}

export async function invalidateAdminUserSessions(id: string) {
  try {
    const response = await httpClient.post<InvalidateAdminUserSessionsResult>(`/admin/users/${id}/invalidate-sessions`);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible invalidar las sesiones activas."));
  }
}
