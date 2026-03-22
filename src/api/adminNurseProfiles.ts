import { httpClient } from "./httpClient";
import { extractApiErrorMessage } from "./errorMessage";

export interface PendingNurseProfile {
  userId: string;
  email: string;
  name: string | null;
  lastName: string | null;
  identificationNumber: string | null;
  phone: string | null;
  createdAtUtc: string;
}

export interface ActiveNurseProfileSummary {
  userId: string;
  email: string;
  name: string | null;
  lastName: string | null;
  specialty: string | null;
  category: string | null;
}

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
  createdAtUtc: string;
  hireDate: string | null;
  specialty: string | null;
  licenseId: string | null;
  bankName: string | null;
  accountNumber: string | null;
  category: string | null;
}

export interface CompleteNurseProfileRequest {
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

export async function getPendingNurseProfiles() {
  try {
    const response = await httpClient.get<PendingNurseProfile[]>("/admin/nurse-profiles/pending");
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar los perfiles pendientes."));
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

export async function getNurseProfileForAdmin(userId: string) {
  try {
    const response = await httpClient.get<NurseProfileAdminRecord>(`/admin/nurse-profiles/${userId}`);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar el perfil."));
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
    throw new Error(extractApiErrorMessage(error, "No fue posible completar el perfil."));
  }
}
