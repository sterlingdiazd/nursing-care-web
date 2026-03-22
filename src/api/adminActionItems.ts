import { httpClient } from "./httpClient";
import { extractApiErrorMessage } from "./errorMessage";

export type AdminActionItemSeverity = "High" | "Medium" | "Low";
export type AdminActionItemState = "Unread" | "Pending";
export type AdminActionItemEntityType =
  | "NurseProfile"
  | "CareRequest"
  | "UserAccount"
  | "SystemIssue";

export interface AdminActionItem {
  id: string;
  severity: AdminActionItemSeverity;
  state: AdminActionItemState;
  entityType: AdminActionItemEntityType;
  entityIdentifier: string;
  summary: string;
  requiredAction: string;
  assignedOwner: string | null;
  deepLinkPath: string;
  detectedAtUtc: string;
}

export async function getAdminActionItems() {
  try {
    const response = await httpClient.get<AdminActionItem[]>("/admin/action-items");
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar la cola de acciones."));
  }
}
