import { axiosInstance } from "./axiosInstance";

export interface SystemSetting {
  key: string;
  value: string;
  description: string;
  category: string;
  valueType: string;
  allowedValuesJson?: string;
  modifiedAtUtc: string;
  modifiedByActorName?: string;
}

export interface UpdateSystemSettingRequest {
  value: string;
}

export const getAdminSettings = async (): Promise<SystemSetting[]> => {
  const response = await axiosInstance.get<SystemSetting[]>("/api/admin/settings");
  return response.data;
};

export const updateAdminSetting = async (
  key: string,
  request: UpdateSystemSettingRequest
): Promise<SystemSetting> => {
  const response = await axiosInstance.put<SystemSetting>(
    `/api/admin/settings/${key}`,
    request
  );
  return response.data;
};
