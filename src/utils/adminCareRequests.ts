import type {
  AdminCareRequestStatus,
  AdminCareRequestView,
} from "../api/adminCareRequests";

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
    case "Invoiced":
      return "Facturada";
    case "Paid":
      return "Pagada";
    case "Voided":
      return "Anulada";
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
      return { bg: "rgba(193, 138, 66, 0.14)", color: "#8a5e22" };
    case "Invoiced":
      return { bg: "rgba(59, 108, 141, 0.12)", color: "#295774" };
    case "Paid":
      return { bg: "rgba(44, 122, 100, 0.18)", color: "#1a5e3a" };
    case "Voided":
      return { bg: "rgba(183, 79, 77, 0.15)", color: "#8b1a1a" };
    default:
      return { bg: "rgba(193, 138, 66, 0.14)", color: "#8a5e22" };
  }
}

export function formatAdminCareRequestTypeLabel(
  value: string | null | undefined,
  codeToDisplayName?: Record<string, string>,
) {
  if (!value) {
    return "Sin tipo";
  }

  return codeToDisplayName?.[value] ?? value;
}

export function formatAdminCareRequestUnitTypeLabel(
  value: string | null | undefined,
  codeToDisplayName?: Record<string, string>,
) {
  if (!value) {
    return "Sin unidad";
  }

  return codeToDisplayName?.[value] ?? value;
}

export function formatAdminCareRequestCategoryLabel(
  value: string | null | undefined,
  codeToDisplayName?: Record<string, string>,
) {
  if (!value) {
    return "Sin categoria";
  }

  return codeToDisplayName?.[value] ?? value;
}

export function formatAdminCareRequestDistanceLabel(
  value: string | null | undefined,
  codeToDisplayName?: Record<string, string>,
) {
  if (!value) {
    return "No aplica";
  }

  return codeToDisplayName?.[value] ?? value;
}

export function formatAdminCareRequestComplexityLabel(
  value: string | null | undefined,
  codeToDisplayName?: Record<string, string>,
) {
  if (!value) {
    return "No aplica";
  }

  return codeToDisplayName?.[value] ?? value;
}
