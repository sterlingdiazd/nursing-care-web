const roleLabelMap: Record<string, string> = {
  Admin: "Administracion",
  Client: "Cliente",
  Nurse: "Enfermeria",
};

export function formatRoleLabels(roles: string[]) {
  if (roles.length === 0) {
    return "Usuario";
  }

  return roles
    .map((role) => roleLabelMap[role] ?? role)
    .join(", ");
}
