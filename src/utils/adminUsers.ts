import type {
  AdminUserAccountStatus,
  AdminUserProfileType,
  AdminUserRoleName,
} from "../api/adminUsers";
import { getRoleLabel } from "./roleLabels";

const profileTypeLabelMap: Record<AdminUserProfileType, string> = {
  ADMIN: "Administración",
  CLIENT: "Cliente",
  NURSE: "Enfermería",
};

const statusLabelMap: Record<AdminUserAccountStatus, string> = {
  Active: "Activa",
  Inactive: "Inactiva",
  ProfileIncomplete: "Perfil incompleto",
  AdminReview: "En revisión administrativa",
  ManualIntervention: "Intervención manual",
};

export const adminUserRoleOptions: Array<{ value: AdminUserRoleName; label: string }> = [
  { value: "ADMIN", label: getRoleLabel("ADMIN") },
  { value: "CLIENT", label: getRoleLabel("CLIENT") },
  { value: "NURSE", label: getRoleLabel("NURSE") },
];

export const adminUserProfileTypeOptions: Array<{ value: AdminUserProfileType; label: string }> = [
  { value: "ADMIN", label: profileTypeLabelMap.ADMIN },
  { value: "CLIENT", label: profileTypeLabelMap.CLIENT },
  { value: "NURSE", label: profileTypeLabelMap.NURSE },
];

export const adminUserStatusOptions: Array<{ value: AdminUserAccountStatus; label: string }> = [
  { value: "Active", label: statusLabelMap.Active },
  { value: "Inactive", label: statusLabelMap.Inactive },
  { value: "ProfileIncomplete", label: statusLabelMap.ProfileIncomplete },
  { value: "AdminReview", label: statusLabelMap.AdminReview },
  { value: "ManualIntervention", label: statusLabelMap.ManualIntervention },
];

export function formatAdminUserProfileTypeLabel(profileType: AdminUserProfileType) {
  return profileTypeLabelMap[profileType] ?? "Perfil no reconocido";
}

export function formatAdminUserStatusLabel(status: AdminUserAccountStatus) {
  return statusLabelMap[status] ?? "Estado no reconocido";
}

export function formatAdminUserDateTime(value: string) {
  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function getAdminUserStatusStyles(status: AdminUserAccountStatus) {
  switch (status) {
    case "Active":
      return {
        bg: "rgba(44, 122, 100, 0.12)",
        color: "#1f5a49",
      };
    case "Inactive":
      return {
        bg: "rgba(96, 112, 122, 0.16)",
        color: "#42525d",
      };
    case "ProfileIncomplete":
      return {
        bg: "rgba(193, 138, 66, 0.14)",
        color: "#8a5e22",
      };
    case "AdminReview":
      return {
        bg: "rgba(59, 108, 141, 0.14)",
        color: "#214e67",
      };
    default:
      return {
        bg: "rgba(183, 79, 77, 0.14)",
        color: "#8b3635",
      };
  }
}
