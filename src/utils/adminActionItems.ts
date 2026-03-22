import type {
  AdminActionItemEntityType,
  AdminActionItemSeverity,
  AdminActionItemState,
} from "../api/adminActionItems";

interface AccentStyles {
  bg: string;
  border: string;
  color: string;
}

export function formatAdminActionItemSeverityLabel(severity: AdminActionItemSeverity) {
  switch (severity) {
    case "High":
      return "Alta";
    case "Medium":
      return "Media";
    default:
      return "Baja";
  }
}

export function formatAdminActionItemStateLabel(state: AdminActionItemState) {
  return state === "Unread" ? "No leida" : "Pendiente";
}

export function formatAdminActionItemEntityLabel(entityType: AdminActionItemEntityType) {
  switch (entityType) {
    case "NurseProfile":
      return "Perfil de enfermeria";
    case "CareRequest":
      return "Solicitud";
    case "UserAccount":
      return "Cuenta de usuario";
    default:
      return "Incidencia del sistema";
  }
}

export function formatAdminActionItemDetectedAt(value: string) {
  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function getAdminActionItemSeverityStyles(
  severity: AdminActionItemSeverity,
): AccentStyles {
  switch (severity) {
    case "High":
      return {
        bg: "rgba(183, 79, 77, 0.12)",
        border: "rgba(183, 79, 77, 0.22)",
        color: "#943b39",
      };
    case "Medium":
      return {
        bg: "rgba(193, 138, 66, 0.14)",
        border: "rgba(183, 128, 60, 0.24)",
        color: "#8a5e22",
      };
    default:
      return {
        bg: "rgba(59, 108, 141, 0.12)",
        border: "rgba(59, 108, 141, 0.2)",
        color: "#285676",
      };
  }
}

export function getAdminActionItemStateStyles(state: AdminActionItemState): AccentStyles {
  return state === "Unread"
    ? {
        bg: "rgba(15, 49, 69, 0.08)",
        border: "rgba(15, 49, 69, 0.14)",
        color: "#173042",
      }
    : {
        bg: "rgba(95, 114, 128, 0.12)",
        border: "rgba(95, 114, 128, 0.16)",
        color: "#4f6777",
      };
}
