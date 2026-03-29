import i18n from '../i18n';

export function getRoleLabel(role: string) {
  const t = i18n.t.bind(i18n);
  
  // roles mapped directly match keys in translations "roles.ADMIN" etc
  const validRoles = ["ADMIN", "CLIENT", "NURSE", "USER"];
  const upperRole = role.toUpperCase();
  
  if (validRoles.includes(upperRole)) {
    return t(`roles.${upperRole}`);
  }
  
  return t('roles.UNKNOWN');
}

export function formatRoleLabels(roles: string[]) {
  if (!roles || roles.length === 0) {
    return i18n.t('roles.USER');
  }

  return roles
    .map((role) => getRoleLabel(role))
    .join(", ");
}
