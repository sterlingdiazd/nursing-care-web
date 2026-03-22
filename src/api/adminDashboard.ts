import { httpClient } from "./httpClient";
import { extractApiErrorMessage } from "./errorMessage";

export interface AdminDashboardAlert {
  id: string;
  title: string;
  description: string;
  severity: string;
  modulePath: string;
}

export interface AdminDashboardSnapshot {
  pendingNurseProfilesCount: number;
  careRequestsWaitingForAssignmentCount: number;
  careRequestsWaitingForApprovalCount: number;
  careRequestsRejectedTodayCount: number;
  approvedCareRequestsStillIncompleteCount: number;
  overdueOrStaleRequestsCount: number;
  activeNursesCount: number;
  activeClientsCount: number;
  unreadAdminNotificationsCount: number;
  highSeverityAlerts: AdminDashboardAlert[];
  generatedAtUtc: string;
}

export async function getAdminDashboard() {
  try {
    const response = await httpClient.get<AdminDashboardSnapshot>("/admin/dashboard");
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar el panel de administracion."));
  }
}
