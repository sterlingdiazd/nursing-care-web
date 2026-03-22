import { httpClient } from "./httpClient";
import { extractApiErrorMessage } from "./errorMessage";
import type { CatalogOptionsResponse, NurseProfileOptionsResponse } from "../types/catalog";

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
