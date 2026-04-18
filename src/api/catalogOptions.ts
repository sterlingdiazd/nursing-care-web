import { httpClient } from "./httpClient";
import { extractApiErrorMessage } from "./errorMessage";
import type { CatalogOptionsResponse, NurseProfileOptionsResponse } from "../types/catalog";
import { logClientEvent } from "../logging/clientLogger";

export interface AvailableNurse {
  userId: string;
  displayName: string;
  specialty: string;
  category: string;
}

export async function getCareRequestOptions() {
  try {
    const response = await httpClient.get<CatalogOptionsResponse>("/catalog/care-request-options");
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar el catalogo de solicitudes."));
  }
}

/** Opciones de perfil de enfermeria; el endpoint es publico (sin sesion) para el registro. */
export async function getNurseProfileOptions() {
  try {
    const response = await httpClient.get<NurseProfileOptionsResponse>("/catalog/nurse-profile-options", {
      skipAuthRefresh: true,
    });
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar las opciones de perfil de enfermeria."));
  }
}

/** Obtiene lista de enfermeras activas disponibles para autocompletar */
export async function getAvailableNurses() {
  try {
    logClientEvent("getAvailableNurses", "Fetching available nurses from /catalog/available-nurses");
    const response = await httpClient.get<AvailableNurse[]>("/catalog/available-nurses");
    logClientEvent("getAvailableNurses", "Available nurses response received", { count: response.data.length });
    return response.data;
  } catch (error) {
    logClientEvent("getAvailableNurses", "Error fetching available nurses", { error: error instanceof Error ? error.message : String(error) }, "error");
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar la lista de enfermeras disponibles."));
  }
}
