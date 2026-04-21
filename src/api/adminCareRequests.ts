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
export type AdminCareRequestStatus = "Pending" | "Approved" | "Rejected" | "Completed" | "Invoiced" | "Paid" | "Voided";

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
  lineBeforeVolumeDiscount?: number | null;
  unitPriceAfterVolumeDiscount?: number | null;
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

interface AdminCareRequestBillingInfo {
  invoiceNumber?: string | null;
  invoicedAtUtc?: string | null;
  paidAtUtc?: string | null;
  voidedAtUtc?: string | null;
  voidReason?: string | null;
  bankReference?: string | null;
  validationDate?: string | null;
  receiptNumber?: string | null;
  receiptId?: string | null;
  receiptGeneratedAtUtc?: string | null;
}

export interface AdminShiftChange {
  id: string;
  previousNurseUserId: string | null;
  previousNurseDisplayName: string | null;
  previousNurseEmail: string | null;
  newNurseUserId: string | null;
  newNurseDisplayName: string | null;
  newNurseEmail: string | null;
  reason: string;
  effectiveAtUtc: string;
  createdAtUtc: string;
}

export interface AdminShiftRecord {
  id: string;
  nurseUserId: string | null;
  nurseDisplayName: string | null;
  nurseEmail: string | null;
  scheduledStartUtc: string | null;
  scheduledEndUtc: string | null;
  actualStartUtc: string | null;
  actualEndUtc: string | null;
  status: string;
  createdAtUtc: string;
  updatedAtUtc: string;
  changes: AdminShiftChange[];
}

export interface AdminPayrollCompensationSnapshot {
  employmentType: string;
  serviceVariant: string;
  executedAtUtc: string;
  serviceDate: string;
  baseCompensation: number;
  transportIncentive: number;
  complexityBonus: number;
  medicalSuppliesCompensation: number;
  adjustmentsTotal: number;
  deductionsTotal: number;
  grossCompensation: number;
  netCompensation: number;
  ruleBaseCompensationPercent: number;
  ruleFixedAmountPerUnit: number;
  ruleTransportIncentivePercent: number;
  ruleComplexityBonusPercent: number;
  ruleMedicalSuppliesPercent: number;
  ruleVariantPercent: number;
  careRequestSubtotalBeforeSupplies: number;
  careRequestMedicalSuppliesCost: number;
  careRequestTotal: number;
  notes: string | null;
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
  invoiceNumber: string | null;
  invoicedAtUtc: string | null;
  paidAtUtc: string | null;
  voidedAtUtc: string | null;
  voidReason: string | null;
  isOverdueOrStale: boolean;
  pricingBreakdown: AdminCareRequestPricingBreakdown;
  payrollCompensation: AdminPayrollCompensationSnapshot | null;
  shifts: AdminShiftRecord[];
  timeline: AdminCareRequestTimelineEvent[];
  billingInfo?: AdminCareRequestBillingInfo | null;
}

function normalizeAdminCareRequestDetail(detail: AdminCareRequestDetail): AdminCareRequestDetail {
  const billingInfo = detail.billingInfo ?? null;

  return {
    ...detail,
    invoiceNumber: detail.invoiceNumber ?? billingInfo?.invoiceNumber ?? null,
    invoicedAtUtc: detail.invoicedAtUtc ?? billingInfo?.invoicedAtUtc ?? null,
    paidAtUtc: detail.paidAtUtc ?? billingInfo?.paidAtUtc ?? null,
    voidedAtUtc: detail.voidedAtUtc ?? billingInfo?.voidedAtUtc ?? null,
    voidReason: detail.voidReason ?? billingInfo?.voidReason ?? null,
  };
}

export interface InvoiceCareRequestPayload {
  invoiceNumber: string;
  invoiceDate?: string;
}

export interface PayCareRequestPayload {
  bankReference: string;
  paymentDate?: string;
}

export interface VoidCareRequestPayload {
  voidReason: string;
}

export interface InvoicedCareRequestResponse {
  id: string;
  invoiceNumber: string;
  invoicedAtUtc: string;
  totalAmount: number;
}

export interface PaidCareRequestResponse {
  id: string;
  paidAtUtc: string;
  totalAmount: number;
}

export interface VoidedCareRequestResponse {
  id: string;
  voidedAtUtc: string;
  voidReason: string;
}

export interface GenerateReceiptResponse {
  receiptId: string;
  receiptNumber: string;
  receiptContentBase64: string;
}

export interface GetReceiptResponse {
  receiptId: string;
  receiptNumber: string;
  receiptContentBase64: string;
  generatedAtUtc: string;
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
    return normalizeAdminCareRequestDetail(response.data);
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

export interface RegisterAdminCareRequestShiftPayload {
  nurseUserId?: string | null;
  scheduledStartUtc?: string | null;
  scheduledEndUtc?: string | null;
}

export interface RecordAdminCareRequestShiftChangePayload {
  newNurseUserId?: string | null;
  reason: string;
  effectiveAtUtc?: string | null;
}

export async function registerAdminCareRequestShift(careRequestId: string, payload: RegisterAdminCareRequestShiftPayload) {
  try {
    const response = await httpClient.post<{ shiftId: string }>(`/admin/care-requests/${careRequestId}/shifts`, payload);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible registrar el turno."));
  }
}

export async function recordAdminCareRequestShiftChange(
  careRequestId: string,
  shiftId: string,
  payload: RecordAdminCareRequestShiftChangePayload,
) {
  try {
    await httpClient.post(`/admin/care-requests/${careRequestId}/shifts/${shiftId}/changes`, payload);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible registrar el cambio de turno."));
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

export async function invoiceCareRequest(id: string, payload: InvoiceCareRequestPayload): Promise<InvoicedCareRequestResponse> {
  try {
    const response = await httpClient.post<InvoicedCareRequestResponse>(`/admin/care-requests/${id}/invoice`, payload);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible facturar la solicitud."));
  }
}

export async function payCareRequest(id: string, payload: PayCareRequestPayload): Promise<PaidCareRequestResponse> {
  try {
    const response = await httpClient.post<PaidCareRequestResponse>(`/admin/care-requests/${id}/pay`, payload);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible confirmar el pago."));
  }
}

export async function voidCareRequest(id: string, payload: VoidCareRequestPayload): Promise<VoidedCareRequestResponse> {
  try {
    const response = await httpClient.post<VoidedCareRequestResponse>(`/admin/care-requests/${id}/void`, payload);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible anular la solicitud."));
  }
}

export async function generateReceipt(id: string): Promise<GenerateReceiptResponse> {
  try {
    const response = await httpClient.post<GenerateReceiptResponse>(`/admin/care-requests/${id}/receipt`);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible generar el recibo."));
  }
}

export async function getReceipt(id: string): Promise<GetReceiptResponse | null> {
  try {
    const response = await httpClient.get<GetReceiptResponse>(`/admin/care-requests/${id}/receipt`);
    return response.data;
  } catch (error: unknown) {
    // Return null if receipt does not exist yet (404)
    if (typeof error === "object" && error !== null && "response" in error) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 404) return null;
    }
    throw new Error(extractApiErrorMessage(error, "No fue posible obtener el recibo."));
  }
}
