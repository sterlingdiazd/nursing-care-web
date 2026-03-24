import { httpClient } from "./httpClient";

export interface AuditLogListItem {
  id: string;
  actorUserId: string | null;
  actorName: string | null;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  notes: string | null;
  createdAtUtc: string;
}

export interface AuditLogDetail {
  id: string;
  actorUserId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  notes: string | null;
  metadataJson: string | null;
  createdAtUtc: string;
}

export interface AuditLogSearchResult {
  items: AuditLogListItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface AuditLogSearchParams {
  actorUserId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  fromDate?: string;
  toDate?: string;
  pageNumber?: number;
  pageSize?: number;
}

export async function searchAuditLogs(params: AuditLogSearchParams): Promise<AuditLogSearchResult> {
  const queryParams = new URLSearchParams();
  
  if (params.actorUserId) queryParams.append("actorUserId", params.actorUserId);
  if (params.action) queryParams.append("action", params.action);
  if (params.entityType) queryParams.append("entityType", params.entityType);
  if (params.entityId) queryParams.append("entityId", params.entityId);
  if (params.fromDate) queryParams.append("fromDate", params.fromDate);
  if (params.toDate) queryParams.append("toDate", params.toDate);
  if (params.pageNumber) queryParams.append("pageNumber", params.pageNumber.toString());
  if (params.pageSize) queryParams.append("pageSize", params.pageSize.toString());

  const response = await httpClient.get<AuditLogSearchResult>(
    `/admin/audit-logs?${queryParams.toString()}`
  );
  return response.data;
}

export async function getAuditLogDetail(id: string): Promise<AuditLogDetail> {
  const response = await httpClient.get<AuditLogDetail>(`/admin/audit-logs/${id}`);
  return response.data;
}
