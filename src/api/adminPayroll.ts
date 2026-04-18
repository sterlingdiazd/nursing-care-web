import { httpClient } from "./httpClient";
import { extractApiErrorMessage } from "./errorMessage";

export interface AdminPayrollPeriodListItem {
  id: string;
  startDate: string;
  endDate: string;
  cutoffDate: string;
  paymentDate: string;
  status: "Open" | "Closed";
  createdAtUtc: string;
  closedAtUtc: string | null;
  lineCount: number;
}

export interface AdminPayrollLineItem {
  id: string;
  nurseUserId: string;
  nurseDisplayName: string;
  serviceExecutionId: string | null;
  description: string;
  baseCompensation: number;
  transportIncentive: number;
  complexityBonus: number;
  medicalSuppliesCompensation: number;
  adjustmentsTotal: number;
  deductionsTotal: number;
  netCompensation: number;
  createdAtUtc: string;
}

export interface AdminPayrollStaffSummary {
  nurseUserId: string;
  nurseDisplayName: string;
  lineCount: number;
  grossCompensation: number;
  transportIncentives: number;
  adjustmentsTotal: number;
  deductionsTotal: number;
  netCompensation: number;
}

export interface AdminPayrollPeriodDetail {
  id: string;
  startDate: string;
  endDate: string;
  cutoffDate: string;
  paymentDate: string;
  status: "Open" | "Closed";
  createdAtUtc: string;
  closedAtUtc: string | null;
  lines: AdminPayrollLineItem[];
  staffSummary: AdminPayrollStaffSummary[];
}

export interface AdminPayrollPeriodListResult {
  items: AdminPayrollPeriodListItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface CreatePayrollPeriodParams {
  startDate: string;
  endDate: string;
  cutoffDate: string;
  paymentDate: string;
}

export async function getAdminPayrollPeriods(params?: {
  pageNumber?: number;
  pageSize?: number;
  status?: "Open" | "Closed" | null;
}): Promise<AdminPayrollPeriodListResult> {
  try {
    const response = await httpClient.get<AdminPayrollPeriodListResult>(
      "/admin/payroll/periods",
      { params }
    );
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar los periodos de nomina."));
  }
}

export async function getAdminPayrollPeriodById(
  id: string
): Promise<AdminPayrollPeriodDetail> {
  try {
    const response = await httpClient.get<AdminPayrollPeriodDetail>(
      `/admin/payroll/periods/${id}`
    );
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar el detalle del periodo."));
  }
}

export async function createAdminPayrollPeriod(
  params: CreatePayrollPeriodParams
): Promise<{ id: string }> {
  try {
    const response = await httpClient.post<{ id: string }>(
      "/admin/payroll/periods",
      params
    );
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible crear el periodo de nomina."));
  }
}

export async function closeAdminPayrollPeriod(id: string): Promise<void> {
  try {
    await httpClient.patch(`/admin/payroll/periods/${id}/close`);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cerrar el periodo de nomina."));
  }
}

export async function getAdminPayrollPeriodLines(
  id: string
): Promise<AdminPayrollLineItem[]> {
  try {
    const response = await httpClient.get<AdminPayrollLineItem[]>(
      `/admin/payroll/periods/${id}/lines`
    );
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar las lineas del periodo."));
  }
}

export function getAdminPayrollPeriodExportUrl(id: string): string {
  const baseUrl = httpClient.defaults.baseURL ?? "";
  return `${baseUrl}/admin/payroll/periods/${id}/export`;
}

export async function downloadNurseVoucher(
  periodId: string,
  nurseId: string,
  fallbackFilename?: string
): Promise<void> {
  try {
    const response = await httpClient.get(
      `/admin/payroll/periods/${periodId}/voucher/${nurseId}`,
      { responseType: "blob" }
    );
    const contentDisposition = response.headers["content-disposition"] as string | undefined;
    const filenameMatch = contentDisposition?.match(/filename="?([^";\n]+)"?/);
    const filename = filenameMatch?.[1] ?? fallbackFilename ?? `voucher-${nurseId}.pdf`;
    const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible descargar el comprobante de pago."));
  }
}

export async function downloadBulkVouchersZip(
  periodId: string,
  fallbackFilename?: string
): Promise<void> {
  try {
    const response = await httpClient.get(
      `/admin/payroll/periods/${periodId}/vouchers/zip`,
      { responseType: "blob" }
    );
    const contentDisposition = response.headers["content-disposition"] as string | undefined;
    const filenameMatch = contentDisposition?.match(/filename="?([^";\n]+)"?/);
    const filename = filenameMatch?.[1] ?? fallbackFilename ?? `vouchers-${periodId}.zip`;
    const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible descargar el archivo ZIP de comprobantes."));
  }
}

export interface AdminCompensationRuleListItem {
  id: string;
  name: string;
  employmentType: "FullTime" | "PartTime" | "Contractor";
  baseCompensationPercent: number;
  transportIncentivePercent: number;
  complexityBonusPercent: number;
  medicalSuppliesPercent: number;
  isActive: boolean;
  createdAtUtc: string;
}

export interface AdminCompensationRuleDetail {
  id: string;
  name: string;
  employmentType: "FullTime" | "PartTime" | "Contractor";
  baseCompensationPercent: number;
  transportIncentivePercent: number;
  complexityBonusPercent: number;
  medicalSuppliesPercent: number;
  isActive: boolean;
  createdAtUtc: string;
}

export interface AdminCompensationRuleListResult {
  items: AdminCompensationRuleListItem[];
  totalCount: number;
}

export interface CreateCompensationRuleParams {
  name: string;
  employmentType: "FullTime" | "PartTime" | "Contractor";
  baseCompensationPercent: number;
  transportIncentivePercent: number;
  complexityBonusPercent: number;
  medicalSuppliesPercent: number;
}

export interface UpdateCompensationRuleParams {
  name: string;
  baseCompensationPercent: number;
  transportIncentivePercent: number;
  complexityBonusPercent: number;
  medicalSuppliesPercent: number;
}

export interface AdminDeductionListItem {
  id: string;
  nurseUserId: string;
  nurseDisplayName: string;
  payrollPeriodId: string | null;
  label: string;
  amount: number;
  deductionType: string;
  createdAtUtc: string;
}

export interface AdminDeductionListResult {
  items: AdminDeductionListItem[];
  totalCount: number;
}

export interface CreateDeductionParams {
  nurseUserId: string;
  payrollPeriodId: string | null;
  label: string;
  amount: number;
  deductionType: string;
}

export interface AdminCompensationAdjustmentListItem {
  id: string;
  serviceExecutionId: string;
  nurseDisplayName: string;
  label: string;
  amount: number;
  createdAtUtc: string;
}

export interface AdminCompensationAdjustmentListResult {
  items: AdminCompensationAdjustmentListItem[];
  totalCount: number;
}

export interface CreateCompensationAdjustmentParams {
  serviceExecutionId: string;
  label: string;
  amount: number;
}

export async function getAdminCompensationRules(): Promise<AdminCompensationRuleListResult> {
  try {
    const response = await httpClient.get<AdminCompensationRuleListResult>(
      "/admin/payroll/compensation-rules"
    );
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar las reglas de compensacion."));
  }
}

export async function getAdminCompensationRuleById(id: string): Promise<AdminCompensationRuleDetail> {
  try {
    const response = await httpClient.get<AdminCompensationRuleDetail>(
      `/admin/payroll/compensation-rules/${id}`
    );
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar la regla de compensacion."));
  }
}

export async function createAdminCompensationRule(params: CreateCompensationRuleParams): Promise<{ id: string }> {
  try {
    const response = await httpClient.post<{ id: string }>(
      "/admin/payroll/compensation-rules",
      params
    );
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible crear la regla de compensacion."));
  }
}

export async function updateAdminCompensationRule(id: string, params: UpdateCompensationRuleParams): Promise<void> {
  try {
    await httpClient.put(`/admin/payroll/compensation-rules/${id}`, params);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible actualizar la regla de compensacion."));
  }
}

export async function deactivateAdminCompensationRule(id: string): Promise<void> {
  try {
    await httpClient.delete(`/admin/payroll/compensation-rules/${id}`);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible desactivar la regla de compensacion."));
  }
}

export async function getAdminDeductions(params?: {
  nurseId?: string;
  periodId?: string;
}): Promise<AdminDeductionListResult> {
  try {
    const response = await httpClient.get<AdminDeductionListResult>(
      "/admin/payroll/deductions",
      { params }
    );
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar las deducciones."));
  }
}

export async function createAdminDeduction(params: CreateDeductionParams): Promise<{ id: string }> {
  try {
    const response = await httpClient.post<{ id: string }>(
      "/admin/payroll/deductions",
      params
    );
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible crear la deduccion."));
  }
}

export async function deleteAdminDeduction(id: string): Promise<void> {
  try {
    await httpClient.delete(`/admin/payroll/deductions/${id}`);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible eliminar la deduccion."));
  }
}

export async function getAdminAdjustments(params?: {
  executionId?: string;
}): Promise<AdminCompensationAdjustmentListResult> {
  try {
    const response = await httpClient.get<AdminCompensationAdjustmentListResult>(
      "/admin/payroll/adjustments",
      { params }
    );
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar los ajustes de compensacion."));
  }
}

export async function createAdminAdjustment(params: CreateCompensationAdjustmentParams): Promise<{ id: string }> {
  try {
    const response = await httpClient.post<{ id: string }>(
      "/admin/payroll/adjustments",
      params
    );
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible crear el ajuste de compensacion."));
  }
}

export async function deleteAdminAdjustment(id: string): Promise<void> {
  try {
    await httpClient.delete(`/admin/payroll/adjustments/${id}`);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible eliminar el ajuste de compensacion."));
  }
}

export interface AdminShiftRecordListItem {
  id: string;
  careRequestId: string;
  nurseUserId: string;
  nurseDisplayName: string;
  scheduledStartUtc: string;
  scheduledEndUtc: string | null;
  status: "Planned" | "Completed" | "Changed";
  createdAtUtc: string;
}

export interface AdminShiftChangeItem {
  id: string;
  previousNurseUserId: string | null;
  previousNurseDisplayName: string | null;
  newNurseUserId: string | null;
  newNurseDisplayName: string | null;
  reason: string;
  effectiveAtUtc: string;
  createdAtUtc: string;
}

export interface AdminShiftRecordDetail {
  id: string;
  careRequestId: string;
  nurseUserId: string;
  nurseDisplayName: string;
  scheduledStartUtc: string;
  scheduledEndUtc: string | null;
  status: "Planned" | "Completed" | "Changed";
  createdAtUtc: string;
  changeHistory: AdminShiftChangeItem[];
}

export interface AdminShiftListResult {
  items: AdminShiftRecordListItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export async function getAdminShifts(params?: {
  pageNumber?: number;
  pageSize?: number;
  nurseId?: string;
  careRequestId?: string;
  startDate?: string;
  endDate?: string;
  status?: "Planned" | "Completed" | "Changed" | null;
}): Promise<AdminShiftListResult> {
  try {
    const response = await httpClient.get<AdminShiftListResult>(
      "/admin/shifts",
      { params }
    );
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar los turnos."));
  }
}

export async function getAdminShiftById(id: string): Promise<AdminShiftRecordDetail> {
  try {
    const response = await httpClient.get<AdminShiftRecordDetail>(
      `/admin/shifts/${id}`
    );
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar el turno."));
  }
}

export async function getAdminShiftChanges(id: string): Promise<AdminShiftChangeItem[]> {
  try {
    const response = await httpClient.get<AdminShiftChangeItem[]>(
      `/admin/shifts/${id}/changes`
    );
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar el historial de cambios."));
  }
}
