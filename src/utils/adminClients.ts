export function formatAdminClientDateTime(value: string | null | undefined) {
  if (!value) {
    return "Sin registros";
  }

  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatAdminClientStatusLabel(isActive: boolean) {
  return isActive ? "Activa" : "Inactiva";
}

export function getAdminClientStatusStyles(isActive: boolean) {
  return isActive
    ? {
      bg: "rgba(44, 122, 100, 0.14)",
      color: "#1f6a56",
    }
    : {
      bg: "rgba(183, 79, 77, 0.12)",
      color: "#923a38",
    };
}

export function formatAdminClientCareRequestCount(count: number) {
  if (count === 0) {
    return "Sin historial de solicitudes";
  }

  return count === 1
    ? "1 solicitud historica"
    : `${count} solicitudes historicas`;
}
