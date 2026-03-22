import { httpClient } from "./httpClient";
import { extractApiErrorMessage } from "./errorMessage";
import type { PricingPreviewResponse } from "../types/catalog";

export interface CareRequestCategoryListItem {
  id: string;
  code: string;
  displayName: string;
  categoryFactor: number;
  isActive: boolean;
  displayOrder: number;
}

export interface CareRequestTypeListItem {
  id: string;
  code: string;
  displayName: string;
  careRequestCategoryCode: string;
  unitTypeCode: string;
  basePrice: number;
  isActive: boolean;
  displayOrder: number;
}

export interface UnitTypeListItem {
  id: string;
  code: string;
  displayName: string;
  isActive: boolean;
  displayOrder: number;
}

export interface DistanceFactorListItem {
  id: string;
  code: string;
  displayName: string;
  multiplier: number;
  isActive: boolean;
  displayOrder: number;
}

export interface ComplexityLevelListItem {
  id: string;
  code: string;
  displayName: string;
  multiplier: number;
  isActive: boolean;
  displayOrder: number;
}

export interface VolumeDiscountRuleListItem {
  id: string;
  minimumCount: number;
  discountPercent: number;
  isActive: boolean;
  displayOrder: number;
}

export interface NurseSpecialtyListItem {
  id: string;
  code: string;
  displayName: string;
  alternativeCodes: string | null;
  isActive: boolean;
  displayOrder: number;
}

export interface NurseCategoryListItem {
  id: string;
  code: string;
  displayName: string;
  alternativeCodes: string | null;
  isActive: boolean;
  displayOrder: number;
}

export interface PricingPreviewRequestBody {
  careRequestTypeCode: string;
  unit: number;
  priceOverride?: number | null;
  clientBasePriceOverride?: number | null;
  distanceFactorCode?: string | null;
  complexityLevelCode?: string | null;
  medicalSuppliesCost?: number | null;
  existingSameUnitTypeCount: number;
  useProposedOverrides: boolean;
  proposedOverrides?: {
    categoryFactor?: number | null;
    distanceMultiplier?: number | null;
    complexityMultiplier?: number | null;
    volumeDiscountPercent?: number | null;
    basePrice?: number | null;
  } | null;
}

const listPath = (resource: string, includeInactive: boolean) =>
  `/admin/catalog/${resource}${includeInactive ? "?includeInactive=true" : ""}`;

export async function listCareRequestCategories(includeInactive = false) {
  try {
    const response = await httpClient.get<CareRequestCategoryListItem[]>(
      listPath("care-request-categories", includeInactive),
    );
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar las categorias."));
  }
}

export async function createCareRequestCategory(body: {
  code: string;
  displayName: string;
  categoryFactor: number;
  isActive: boolean;
  displayOrder: number;
}) {
  try {
    const response = await httpClient.post<string>("/admin/catalog/care-request-categories", body);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible crear la categoria."));
  }
}

export async function updateCareRequestCategory(
  id: string,
  body: {
    displayName: string;
    categoryFactor: number;
    isActive: boolean;
    displayOrder: number;
  },
) {
  try {
    await httpClient.put(`/admin/catalog/care-request-categories/${id}`, body);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible actualizar la categoria."));
  }
}

export async function listCareRequestTypes(includeInactive = false) {
  try {
    const response = await httpClient.get<CareRequestTypeListItem[]>(listPath("care-request-types", includeInactive));
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar los tipos de solicitud."));
  }
}

export async function createCareRequestType(body: {
  code: string;
  displayName: string;
  careRequestCategoryCode: string;
  unitTypeCode: string;
  basePrice: number;
  isActive: boolean;
  displayOrder: number;
}) {
  try {
    const response = await httpClient.post<string>("/admin/catalog/care-request-types", body);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible crear el tipo de solicitud."));
  }
}

export async function updateCareRequestType(
  id: string,
  body: {
    displayName: string;
    careRequestCategoryCode: string;
    unitTypeCode: string;
    basePrice: number;
    isActive: boolean;
    displayOrder: number;
  },
) {
  try {
    await httpClient.put(`/admin/catalog/care-request-types/${id}`, body);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible actualizar el tipo de solicitud."));
  }
}

export async function listUnitTypes(includeInactive = false) {
  try {
    const response = await httpClient.get<UnitTypeListItem[]>(listPath("unit-types", includeInactive));
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar los tipos de unidad."));
  }
}

export async function createUnitType(body: {
  code: string;
  displayName: string;
  isActive: boolean;
  displayOrder: number;
}) {
  try {
    const response = await httpClient.post<string>("/admin/catalog/unit-types", body);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible crear el tipo de unidad."));
  }
}

export async function updateUnitType(
  id: string,
  body: { displayName: string; isActive: boolean; displayOrder: number },
) {
  try {
    await httpClient.put(`/admin/catalog/unit-types/${id}`, body);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible actualizar el tipo de unidad."));
  }
}

export async function listDistanceFactors(includeInactive = false) {
  try {
    const response = await httpClient.get<DistanceFactorListItem[]>(listPath("distance-factors", includeInactive));
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar los factores de distancia."));
  }
}

export async function createDistanceFactor(body: {
  code: string;
  displayName: string;
  multiplier: number;
  isActive: boolean;
  displayOrder: number;
}) {
  try {
    const response = await httpClient.post<string>("/admin/catalog/distance-factors", body);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible crear el factor de distancia."));
  }
}

export async function updateDistanceFactor(
  id: string,
  body: { displayName: string; multiplier: number; isActive: boolean; displayOrder: number },
) {
  try {
    await httpClient.put(`/admin/catalog/distance-factors/${id}`, body);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible actualizar el factor de distancia."));
  }
}

export async function listComplexityLevels(includeInactive = false) {
  try {
    const response = await httpClient.get<ComplexityLevelListItem[]>(
      listPath("complexity-levels", includeInactive),
    );
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar los niveles de complejidad."));
  }
}

export async function createComplexityLevel(body: {
  code: string;
  displayName: string;
  multiplier: number;
  isActive: boolean;
  displayOrder: number;
}) {
  try {
    const response = await httpClient.post<string>("/admin/catalog/complexity-levels", body);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible crear el nivel de complejidad."));
  }
}

export async function updateComplexityLevel(
  id: string,
  body: { displayName: string; multiplier: number; isActive: boolean; displayOrder: number },
) {
  try {
    await httpClient.put(`/admin/catalog/complexity-levels/${id}`, body);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible actualizar el nivel de complejidad."));
  }
}

export async function listVolumeDiscountRules(includeInactive = false) {
  try {
    const response = await httpClient.get<VolumeDiscountRuleListItem[]>(
      listPath("volume-discount-rules", includeInactive),
    );
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar las reglas de descuento."));
  }
}

export async function createVolumeDiscountRule(body: {
  minimumCount: number;
  discountPercent: number;
  isActive: boolean;
  displayOrder: number;
}) {
  try {
    const response = await httpClient.post<string>("/admin/catalog/volume-discount-rules", body);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible crear la regla de descuento."));
  }
}

export async function updateVolumeDiscountRule(
  id: string,
  body: { minimumCount: number; discountPercent: number; isActive: boolean; displayOrder: number },
) {
  try {
    await httpClient.put(`/admin/catalog/volume-discount-rules/${id}`, body);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible actualizar la regla de descuento."));
  }
}

export async function listNurseSpecialties(includeInactive = false) {
  try {
    const response = await httpClient.get<NurseSpecialtyListItem[]>(listPath("nurse-specialties", includeInactive));
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar las especialidades."));
  }
}

export async function createNurseSpecialty(body: {
  code: string;
  displayName: string;
  alternativeCodes: string | null;
  isActive: boolean;
  displayOrder: number;
}) {
  try {
    const response = await httpClient.post<string>("/admin/catalog/nurse-specialties", body);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible crear la especialidad."));
  }
}

export async function updateNurseSpecialty(
  id: string,
  body: { displayName: string; alternativeCodes: string | null; isActive: boolean; displayOrder: number },
) {
  try {
    await httpClient.put(`/admin/catalog/nurse-specialties/${id}`, body);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible actualizar la especialidad."));
  }
}

export async function listNurseCategories(includeInactive = false) {
  try {
    const response = await httpClient.get<NurseCategoryListItem[]>(listPath("nurse-categories", includeInactive));
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar las categorias de enfermeria."));
  }
}

export async function createNurseCategory(body: {
  code: string;
  displayName: string;
  alternativeCodes: string | null;
  isActive: boolean;
  displayOrder: number;
}) {
  try {
    const response = await httpClient.post<string>("/admin/catalog/nurse-categories", body);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible crear la categoria de enfermeria."));
  }
}

export async function updateNurseCategory(
  id: string,
  body: { displayName: string; alternativeCodes: string | null; isActive: boolean; displayOrder: number },
) {
  try {
    await httpClient.put(`/admin/catalog/nurse-categories/${id}`, body);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible actualizar la categoria de enfermeria."));
  }
}

export async function previewPricing(body: PricingPreviewRequestBody) {
  try {
    const response = await httpClient.post<PricingPreviewResponse>("/admin/catalog/pricing-preview", body);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible calcular la vista previa de precios."));
  }
}
