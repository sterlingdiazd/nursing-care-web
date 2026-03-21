import { httpClient } from "./httpClient";

export interface PendingNurseProfile {
  userId: string;
  email: string;
  name: string | null;
  lastName: string | null;
  identificationNumber: string | null;
  phone: string | null;
  createdAtUtc: string;
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
  const response = await httpClient.get<PendingNurseProfile[]>("/admin/nurse-profiles/pending");
  return response.data;
}

export async function getNurseProfileForAdmin(userId: string) {
  const response = await httpClient.get<NurseProfileAdminRecord>(`/admin/nurse-profiles/${userId}`);
  return response.data;
}

export async function completeNurseProfileForAdmin(
  userId: string,
  request: CompleteNurseProfileRequest,
) {
  const response = await httpClient.put<NurseProfileAdminRecord>(
    `/admin/nurse-profiles/${userId}/complete`,
    request,
  );

  return response.data;
}
