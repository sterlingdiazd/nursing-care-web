import { httpClient } from "./httpClient";
import { extractApiErrorMessage } from "./errorMessage";

export interface CareRequestPipelineReport {
  pendingCount: number;
  approvedCount: number;
  completedCount: number;
  rejectedCount: number;
  unassignedCount: number;
  overdueCount: number;
}

export interface AssignmentApprovalBacklogReport {
  pendingUnassignedCount: number;
  pendingAssignedAwaitingApprovalCount: number;
  averageDaysPending: number;
}

export interface NurseOnboardingReport {
  totalRegisteredCount: number;
  pendingReviewCount: number;
  activeCount: number;
  inactiveCount: number;
  completedThisPeriodCount: number;
}

export interface ActiveInactiveUsersReport {
  adminActiveCount: number;
  adminInactiveCount: number;
  clientActiveCount: number;
  clientInactiveCount: number;
  nurseActiveCount: number;
  nurseInactiveCount: number;
}

export interface NurseUtilizationRow {
  nurseId: string;
  nurseName: string;
  totalAssigned: number;
  completed: number;
  pending: number;
  completionRate: number;
}

export interface NurseUtilizationReport {
  rows: NurseUtilizationRow[];
  totalNurses: number;
  pageNumber: number;
  pageSize: number;
}

export interface CareRequestCompletionReport {
  totalCompletedCount: number;
  averageDaysToComplete: number;
  completionsByRange: Record<string, number>;
}

export interface PriceUsageSummaryRow {
  requestType: string;
  count: number;
  averageTotal: number;
  totalRevenue: number;
}

export interface PriceUsageSummaryReport {
  topRequestTypes: PriceUsageSummaryRow[];
  topDistanceFactors: string[];
  topComplexityLevels: string[];
}

export interface NotificationVolumeReport {
  totalNotificationsCount: number;
  unreadNotificationsCount: number;
  notificationsByCategory: Record<string, number>;
  pendingActionItemsCount: number;
}

export type AdminReportResponse =
  | CareRequestPipelineReport
  | AssignmentApprovalBacklogReport
  | NurseOnboardingReport
  | ActiveInactiveUsersReport
  | NurseUtilizationReport
  | CareRequestCompletionReport
  | PriceUsageSummaryReport
  | NotificationVolumeReport;

export interface GetAdminReportParams {
  from?: string;
  to?: string;
  pageNumber?: number;
  pageSize?: number;
}

export async function getAdminReport<T = AdminReportResponse>(
  reportKey: string,
  params?: GetAdminReportParams
): Promise<T> {
  try {
    const response = await httpClient.get<T>(`/admin/reports/${reportKey}`, {
      params,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      extractApiErrorMessage(error, `No fue posible cargar el reporte: ${reportKey}`)
    );
  }
}

export function getAdminReportExportUrl(
  reportKey: string,
  params?: GetAdminReportParams
): string {
  const baseUrl = httpClient.defaults.baseURL || "";
  const url = new URL(`${baseUrl}/admin/reports/${reportKey}/export`);
  
  if (params?.from) url.searchParams.append("from", params.from);
  if (params?.to) url.searchParams.append("to", params.to);
  if (params?.pageNumber) url.searchParams.append("pageNumber", params.pageNumber.toString());
  if (params?.pageSize) url.searchParams.append("pageSize", params.pageSize.toString());

  return url.toString();
}
