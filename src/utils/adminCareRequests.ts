import type {
  AdminCareRequestStatus,
  AdminCareRequestView,
} from "../api/adminCareRequests";

export const careRequestServiceCatalog: Record<
  string,
  {
    label: string;
    category: "hogar" | "domicilio" | "medicos";
    basePrice: number;
    unitType: string;
  }
> = {
  hogar_diario: { label: "Hogar diario", category: "hogar", basePrice: 2500, unitType: "dia_completo" },
  hogar_basico: { label: "Hogar basico", category: "hogar", basePrice: 55000, unitType: "mes" },
  hogar_estandar: { label: "Hogar estandar", category: "hogar", basePrice: 60000, unitType: "mes" },
  hogar_premium: { label: "Hogar premium", category: "hogar", basePrice: 65000, unitType: "mes" },
  domicilio_dia_12h: { label: "Domicilio de dia 12h", category: "domicilio", basePrice: 2500, unitType: "medio_dia" },
  domicilio_noche_12h: { label: "Domicilio de noche 12h", category: "domicilio", basePrice: 2500, unitType: "medio_dia" },
  domicilio_24h: { label: "Domicilio 24h", category: "domicilio", basePrice: 3500, unitType: "dia_completo" },
  suero: { label: "Suero", category: "medicos", basePrice: 2000, unitType: "sesion" },
  medicamentos: { label: "Medicamentos", category: "medicos", basePrice: 2000, unitType: "sesion" },
  sonda_vesical: { label: "Sonda vesical", category: "medicos", basePrice: 2000, unitType: "sesion" },
  sonda_nasogastrica: { label: "Sonda nasogastrica", category: "medicos", basePrice: 3000, unitType: "sesion" },
  sonda_peg: { label: "Sonda PEG", category: "medicos", basePrice: 4000, unitType: "sesion" },
  curas: { label: "Curas", category: "medicos", basePrice: 2000, unitType: "sesion" },
};

export const careRequestCategoryFactors = {
  hogar: 1.0,
  domicilio: 1.2,
  medicos: 1.5,
} as const;

export const careRequestDistanceFactors = {
  local: { label: "Local", factor: 1.0 },
  cercana: { label: "Cercana", factor: 1.1 },
  media: { label: "Media", factor: 1.2 },
  lejana: { label: "Lejana", factor: 1.3 },
} as const;

export const careRequestComplexityFactors = {
  estandar: { label: "Estandar", factor: 1.0 },
  moderada: { label: "Moderada", factor: 1.1 },
  alta: { label: "Alta", factor: 1.2 },
  critica: { label: "Critica", factor: 1.3 },
} as const;

export const adminCareRequestViewOptions: Array<{ value: AdminCareRequestView; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendientes" },
  { value: "unassigned", label: "Sin asignar" },
  { value: "pending-approval", label: "Listas para aprobacion" },
  { value: "approved", label: "Aprobadas" },
  { value: "rejected", label: "Rechazadas" },
  { value: "completed", label: "Completadas" },
  { value: "overdue", label: "Atrasadas o estancadas" },
];

export function getVolumeDiscountPercent(existingCount: number) {
  if (existingCount >= 50) return 20;
  if (existingCount >= 20) return 15;
  if (existingCount >= 10) return 10;
  if (existingCount >= 5) return 5;
  return 0;
}

export function formatAdminCareRequestCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

export function formatAdminCareRequestDateTime(value: string | null | undefined) {
  if (!value) {
    return "Sin registro";
  }

  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function getAdminCareRequestStatusLabel(status: AdminCareRequestStatus) {
  switch (status) {
    case "Approved":
      return "Aprobada";
    case "Rejected":
      return "Rechazada";
    case "Completed":
      return "Completada";
    default:
      return "Pendiente";
  }
}

export function getAdminCareRequestStatusStyles(status: AdminCareRequestStatus) {
  switch (status) {
    case "Approved":
      return { bg: "rgba(44, 122, 100, 0.12)", color: "#205e4d" };
    case "Rejected":
      return { bg: "rgba(183, 79, 77, 0.12)", color: "#9a3f3d" };
    case "Completed":
      return { bg: "rgba(59, 108, 141, 0.12)", color: "#295774" };
    default:
      return { bg: "rgba(193, 138, 66, 0.14)", color: "#8a5e22" };
  }
}

export function formatAdminCareRequestTypeLabel(value: string | null | undefined) {
  if (!value) {
    return "Sin tipo";
  }

  return careRequestServiceCatalog[value]?.label ?? value;
}

export function formatAdminCareRequestUnitTypeLabel(value: string | null | undefined) {
  switch (value) {
    case "dia_completo":
      return "Dia completo";
    case "medio_dia":
      return "Medio dia";
    case "mes":
      return "Mes";
    case "sesion":
      return "Sesion";
    default:
      return value ?? "Sin unidad";
  }
}

export function formatAdminCareRequestCategoryLabel(value: string | null | undefined) {
  switch (value) {
    case "hogar":
      return "Hogar";
    case "domicilio":
      return "Domicilio";
    case "medicos":
      return "Medicos";
    default:
      return value ?? "Sin categoria";
  }
}

export function formatAdminCareRequestDistanceLabel(value: string | null | undefined) {
  if (!value) {
    return "No aplica";
  }

  return careRequestDistanceFactors[value as keyof typeof careRequestDistanceFactors]?.label ?? value;
}

export function formatAdminCareRequestComplexityLabel(value: string | null | undefined) {
  if (!value) {
    return "No aplica";
  }

  return careRequestComplexityFactors[value as keyof typeof careRequestComplexityFactors]?.label ?? value;
}
