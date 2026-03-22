import type {
  NurseProfileAdminRecord,
  NurseProfileSummary,
  NurseWorkloadSummary,
  PendingNurseProfile,
} from "../api/adminNurseProfiles";

type NurseStatusLike =
  | Pick<NurseProfileAdminRecord, "name" | "lastName" | "email" | "userIsActive" | "nurseProfileIsActive" | "isPendingReview" | "isAssignmentReady">
  | Pick<NurseProfileSummary, "name" | "lastName" | "email" | "userIsActive" | "nurseProfileIsActive" | "isProfileComplete" | "isAssignmentReady">
  | Pick<PendingNurseProfile, "name" | "lastName" | "email">;

export function formatNurseDisplayName(profile: Pick<NurseStatusLike, "name" | "lastName" | "email">) {
  return [profile.name, profile.lastName].filter(Boolean).join(" ").trim() || profile.email;
}

export function isPendingNurseProfile(profile: Partial<NurseStatusLike>) {
  if (typeof profile.isPendingReview === "boolean") {
    return profile.isPendingReview;
  }

  if (typeof profile.isAssignmentReady === "boolean" && profile.isAssignmentReady) {
    return false;
  }

  if (typeof (profile as NurseProfileSummary).isProfileComplete === "boolean") {
    return (profile as NurseProfileSummary).isProfileComplete === false;
  }

  return !Boolean(profile.userIsActive && profile.nurseProfileIsActive);
}

export function getNurseStatusLabel(profile: Partial<NurseStatusLike>) {
  if (isPendingNurseProfile(profile)) {
    return "Pendiente de revision";
  }

  return profile.userIsActive && profile.nurseProfileIsActive ? "Activa" : "Inactiva";
}

export function getNurseStatusStyles(profile: Partial<NurseStatusLike>) {
  if (isPendingNurseProfile(profile)) {
    return { bg: "rgba(193, 138, 66, 0.14)", color: "#8a5e22" };
  }

  return profile.userIsActive && profile.nurseProfileIsActive
    ? { bg: "rgba(44, 122, 100, 0.12)", color: "#205e4d" }
    : { bg: "rgba(183, 79, 77, 0.12)", color: "#9a3f3d" };
}

export function getNurseReadinessLabel(profile: Partial<NurseStatusLike>) {
  if (profile.isAssignmentReady) {
    return "Lista para asignacion";
  }

  return isPendingNurseProfile(profile)
    ? "Pendiente de completar"
    : "No disponible para asignacion";
}

export function formatNurseWorkloadSummary(workload?: NurseWorkloadSummary) {
  const total = workload?.totalAssignedCareRequests ?? 0;
  const pending = workload?.pendingAssignedCareRequests ?? 0;
  const approved = workload?.approvedAssignedCareRequests ?? 0;
  const completed = workload?.completedAssignedCareRequests ?? 0;

  if (total === 0) {
    return "Sin solicitudes asignadas";
  }

  return `${total} asignadas · ${pending} pendientes · ${approved} aprobadas · ${completed} completadas`;
}
