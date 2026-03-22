const roleLabelMap: Record<string, string> = {
  Admin: "Administracion",
  Client: "Cliente",
  Nurse: "Enfermeria",
};

export function getRoleLabel(role: string) {
  return roleLabelMap[role] ?? "Rol no reconocido";
}

export function formatRoleLabels(roles: string[]) {
  if (roles.length === 0) {
    return "Usuario";
  }

  return roles
    .map((role) => getRoleLabel(role))
    .join(", ");
}
