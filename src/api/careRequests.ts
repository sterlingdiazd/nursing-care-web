import { AxiosHeaders } from "axios";
import { httpClient } from "./httpClient";
import { logClientEvent } from "../logging/clientLogger";

export interface CreateCareRequestRequest {
  careRequestDescription: string;
  careRequestType: string;
  unit?: number;
  suggestedNurse?: string;
  price?: number;
  clientBasePriceOverride?: number;
  distanceFactor?: string;
  complexityLevel?: string;
  medicalSuppliesCost?: number;
  careRequestDate?: string; // YYYY-MM-DD
}

export interface CareRequest {
  id: string;
  userID: string;
  careRequestDescription: string;
  careRequestType?: string;
  unit?: number;
  unitType?: string;
  price?: number;
  total?: number;
  distanceFactor?: string | null;
  complexityLevel?: string | null;
  clientBasePrice?: number | null;
  medicalSuppliesCost?: number | null;
  careRequestDate?: string | null;
  suggestedNurse?: string | null;
  assignedNurse?: string | null;
  status: "Pending" | "Approved" | "Rejected" | "Completed";
  createdAtUtc: string;
  updatedAtUtc: string;
  approvedAtUtc: string | null;
  rejectedAtUtc: string | null;
  completedAtUtc: string | null;
}

export type CareRequestTransitionAction = "approve" | "reject" | "complete";

export interface AssignCareRequestNurseRequest {
  assignedNurse: string;
}

export async function createCareRequest(
  request: CreateCareRequestRequest,
  correlationId?: string,
) {
  try {
    logClientEvent("web.ui", "Create care request submitted", {
      correlationId,
      descriptionLength: request.careRequestDescription.length,
    });

    const headers = correlationId
      ? new AxiosHeaders({ "X-Correlation-ID": correlationId })
      : undefined;
    const response = await httpClient.post("/care-requests", request, { headers });
    return response.data;
  } catch (error: any) {
    // Log full error details to console for debugging
    console.error("Care Request Creation Error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      fullError: error,
    });

    const errorMessage =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.response?.data?.title ||
      error.message ||
      "API error";

    logClientEvent(
      "web.ui",
      "Create care request failed",
      {
        correlationId,
        errorMessage,
      },
      "error",
    );

    throw new Error("API error: " + errorMessage);
  }
}

export async function getCareRequests() {
  const response = await httpClient.get<CareRequest[]>("/care-requests");
  return response.data;
}

export async function getCareRequestById(id: string) {
  const response = await httpClient.get<CareRequest>(`/care-requests/${id}`);
  return response.data;
}

export async function transitionCareRequest(
  id: string,
  action: CareRequestTransitionAction,
) {
  const response = await httpClient.post<CareRequest>(`/care-requests/${id}/${action}`);
  return response.data;
}

export async function assignCareRequestNurse(
  id: string,
  request: AssignCareRequestNurseRequest,
) {
  const response = await httpClient.put<CareRequest>(`/care-requests/${id}/assignment`, request);
  return response.data;
}
