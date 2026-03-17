import { httpClient } from "./httpClient";
import { logClientEvent } from "../logging/clientLogger";

// This interface represents the payload your API expects
export interface CreateCareRequestRequest {
  residentId: string;
  description: string;
}

// This function calls the ASP.NET API endpoint
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
