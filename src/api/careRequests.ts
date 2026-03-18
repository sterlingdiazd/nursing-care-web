import { httpClient } from "./httpClient";
import { logClientEvent } from "../logging/clientLogger";

export interface CreateCareRequestRequest {
  residentId: string;
  description: string;
}

export interface CareRequest {
  id: string;
  residentId: string;
  description: string;
  status: "Pending" | "Approved" | "Rejected" | "Completed";
  createdAtUtc: string;
  updatedAtUtc: string;
  approvedAtUtc: string | null;
  rejectedAtUtc: string | null;
  completedAtUtc: string | null;
}

export type CareRequestTransitionAction = "approve" | "reject" | "complete";

export async function createCareRequest(request: CreateCareRequestRequest) {
  try {
    logClientEvent("web.ui", "Create care request submitted", {
      residentId: request.residentId,
      descriptionLength: request.description.length,
    });

    const response = await httpClient.post("/care-requests", request);
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
        residentId: request.residentId,
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
