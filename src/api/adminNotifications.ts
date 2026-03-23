import { httpClient } from "./httpClient";
import { extractApiErrorMessage } from "./errorMessage";

export type AdminNotificationSeverity = "High" | "Medium" | "Low";

export interface AdminNotificationItem {
  id: string;
  category: string;
  severity: AdminNotificationSeverity;
  title: string;
  body: string;
  entityType: string | null;
  entityId: string | null;
  deepLinkPath: string | null;
  source: string | null;
  requiresAction: boolean;
  isDismissed: boolean;
  createdAtUtc: string;
  readAtUtc: string | null;
  archivedAtUtc: string | null;
  createdBySystem: boolean;
}

export interface AdminNotificationSummary {
  total: number;
  unread: number;
  requiresAction: number;
  highSeverityUnread: number;
}

export async function listAdminNotifications(params?: { includeArchived?: boolean; unreadOnly?: boolean }) {
  try {
    const response = await httpClient.get<AdminNotificationItem[]>("/admin/notifications", { params });
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar las notificaciones administrativas."));
  }
}

export async function getAdminNotificationSummary() {
  try {
    const response = await httpClient.get<AdminNotificationSummary>("/admin/notifications/summary");
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible cargar el resumen de notificaciones."));
  }
}

async function postNotificationAction(id: string, action: "read" | "unread" | "archive" | "dismiss") {
  try {
    await httpClient.post(`/admin/notifications/${id}/${action}`);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible actualizar la notificacion."));
  }
}

export const markAdminNotificationAsRead = (id: string) => postNotificationAction(id, "read");
export const markAdminNotificationAsUnread = (id: string) => postNotificationAction(id, "unread");
export const archiveAdminNotification = (id: string) => postNotificationAction(id, "archive");
export const dismissAdminNotification = (id: string) => postNotificationAction(id, "dismiss");
