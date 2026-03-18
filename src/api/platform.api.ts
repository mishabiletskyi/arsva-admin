import { apiClient } from "./client";
import type {
  AdminUser,
  CallLog,
  CallLogListParams,
  CallPolicy,
  CallPolicyQueryParams,
  CreateAdminUserPayload,
  CreateDashboardTaskPayload,
  CreateOutboundCallJobPayload,
  CreateOrganizationPayload,
  CreatePropertyPayload,
  CreateTenantPayload,
  DashboardTask,
  DashboardTaskListParams,
  OutboundCallJob,
  OutboundCallJobListParams,
  CsvImport,
  CsvImportListParams,
  CsvUploadPayload,
  Organization,
  Property,
  PropertyListParams,
  ReportExportParams,
  ResourceListParams,
  Tenant,
  TenantEligibility,
  TenantEligibilityListParams,
  TenantListParams,
  UpdateCallPolicyPayload,
  UpdateAdminUserMembershipPayload,
  UpdateAdminUserPayload,
  UpdateAdminUserPropertyAccessPayload,
  UpdateDashboardTaskPayload,
  UpdateOrganizationPayload,
  UpdatePropertyPayload,
  UpdateTenantPayload,
} from "../types/platform";
import type { UserMembership, UserPropertyAccess } from "../types/access";

export async function getOrganizationsRequest(
  params?: ResourceListParams
): Promise<Organization[]> {
  const response = await apiClient.get<Organization[]>("/api/v1/organizations", {
    params,
  });
  return response.data;
}

export async function createOrganizationRequest(
  payload: CreateOrganizationPayload
): Promise<Organization> {
  const response = await apiClient.post<Organization>(
    "/api/v1/organizations",
    payload
  );
  return response.data;
}

export async function updateOrganizationRequest(
  organizationId: number,
  payload: UpdateOrganizationPayload
): Promise<Organization> {
  const response = await apiClient.put<Organization>(
    `/api/v1/organizations/${organizationId}`,
    payload
  );
  return response.data;
}

export async function getPropertiesRequest(
  params?: PropertyListParams
): Promise<Property[]> {
  const response = await apiClient.get<Property[]>("/api/v1/properties", {
    params,
  });
  return response.data;
}

export async function createPropertyRequest(
  payload: CreatePropertyPayload
): Promise<Property> {
  const response = await apiClient.post<Property>("/api/v1/properties", payload);
  return response.data;
}

export async function updatePropertyRequest(
  propertyId: number,
  payload: UpdatePropertyPayload
): Promise<Property> {
  const response = await apiClient.put<Property>(
    `/api/v1/properties/${propertyId}`,
    payload
  );
  return response.data;
}

export async function getTenantsRequest(
  params?: TenantListParams
): Promise<Tenant[]> {
  const response = await apiClient.get<Tenant[]>("/api/v1/tenants", {
    params,
  });
  return response.data;
}

export async function getTenantByIdRequest(tenantId: number): Promise<Tenant> {
  const response = await apiClient.get<Tenant>(`/api/v1/tenants/${tenantId}`);
  return response.data;
}

export async function createTenantRequest(
  payload: CreateTenantPayload
): Promise<Tenant> {
  const response = await apiClient.post<Tenant>("/api/v1/tenants", payload);
  return response.data;
}

export async function updateTenantRequest(
  tenantId: number,
  payload: UpdateTenantPayload
): Promise<Tenant> {
  const response = await apiClient.put<Tenant>(`/api/v1/tenants/${tenantId}`, payload);
  return response.data;
}

export async function archiveTenantRequest(tenantId: number): Promise<void> {
  await apiClient.post(`/api/v1/tenants/${tenantId}/archive`);
}

export async function restoreTenantRequest(tenantId: number): Promise<Tenant> {
  const response = await apiClient.post<Tenant>(
    `/api/v1/tenants/${tenantId}/restore`
  );
  return response.data;
}

export async function suppressTenantRequest(tenantId: number): Promise<Tenant> {
  const response = await apiClient.post<Tenant>(
    `/api/v1/tenants/${tenantId}/suppress`
  );
  return response.data;
}

export async function unsuppressTenantRequest(tenantId: number): Promise<Tenant> {
  const response = await apiClient.post<Tenant>(
    `/api/v1/tenants/${tenantId}/unsuppress`
  );
  return response.data;
}

export async function getTenantEligibilityRequest(
  params?: TenantEligibilityListParams
): Promise<TenantEligibility[]> {
  const response = await apiClient.get<TenantEligibility[]>(
    "/api/v1/tenant-eligibility",
    {
      params,
    }
  );
  return response.data;
}

export async function getTenantEligibilityByIdRequest(
  tenantId: number
): Promise<TenantEligibility> {
  const response = await apiClient.get<TenantEligibility>(
    `/api/v1/tenant-eligibility/${tenantId}`
  );
  return response.data;
}

export async function getAdminUsersRequest(): Promise<AdminUser[]> {
  const response = await apiClient.get<AdminUser[]>("/api/v1/admin-users");
  return response.data;
}

export async function createAdminUserRequest(
  payload: CreateAdminUserPayload
): Promise<AdminUser> {
  const response = await apiClient.post<AdminUser>("/api/v1/admin-users", payload);
  return response.data;
}

export async function updateAdminUserRequest(
  adminUserId: number,
  payload: UpdateAdminUserPayload
): Promise<AdminUser> {
  const response = await apiClient.put<AdminUser>(
    `/api/v1/admin-users/${adminUserId}`,
    payload
  );
  return response.data;
}

export async function getAdminUserMembershipsRequest(
  adminUserId: number
): Promise<UserMembership[]> {
  const response = await apiClient.get<UserMembership[]>(
    `/api/v1/admin-users/${adminUserId}/memberships`
  );
  return response.data;
}

export async function updateAdminUserMembershipsRequest(
  adminUserId: number,
  payload: UpdateAdminUserMembershipPayload[]
): Promise<UserMembership[]> {
  const response = await apiClient.put<UserMembership[]>(
    `/api/v1/admin-users/${adminUserId}/memberships`,
    payload
  );
  return response.data;
}

export async function getAdminUserPropertyAccessesRequest(
  adminUserId: number
): Promise<UserPropertyAccess[]> {
  const response = await apiClient.get<UserPropertyAccess[]>(
    `/api/v1/admin-users/${adminUserId}/property-accesses`
  );
  return response.data;
}

export async function updateAdminUserPropertyAccessesRequest(
  adminUserId: number,
  payload: UpdateAdminUserPropertyAccessPayload[]
): Promise<UserPropertyAccess[]> {
  const response = await apiClient.put<UserPropertyAccess[]>(
    `/api/v1/admin-users/${adminUserId}/property-accesses`,
    payload
  );
  return response.data;
}

export async function getCallLogsRequest(
  params?: CallLogListParams
): Promise<CallLog[]> {
  const response = await apiClient.get<CallLog[]>("/api/v1/call-logs", {
    params,
  });
  return response.data;
}

export async function getCallLogByIdRequest(callLogId: number): Promise<CallLog> {
  const response = await apiClient.get<CallLog>(`/api/v1/call-logs/${callLogId}`);
  return response.data;
}

export async function getCsvImportsRequest(
  params?: CsvImportListParams
): Promise<CsvImport[]> {
  const response = await apiClient.get<CsvImport[]>("/api/v1/csv-imports", {
    params,
  });
  return response.data;
}

export async function getCsvImportByIdRequest(csvImportId: number): Promise<CsvImport> {
  const response = await apiClient.get<CsvImport>(`/api/v1/csv-imports/${csvImportId}`);
  return response.data;
}

export async function uploadCsvImportRequest(
  payload: CsvUploadPayload
): Promise<CsvImport> {
  const formData = new FormData();
  formData.append("organization_id", String(payload.organization_id));
  formData.append("property_id", String(payload.property_id));
  formData.append("file", payload.file);

  const response = await apiClient.post<CsvImport>(
    "/api/v1/csv-imports/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
}

export async function deleteCsvImportRequest(csvImportId: number): Promise<void> {
  await apiClient.delete(`/api/v1/csv-imports/${csvImportId}`);
}

export async function getDashboardTasksRequest(
  params?: DashboardTaskListParams
): Promise<DashboardTask[]> {
  const response = await apiClient.get<DashboardTask[]>("/api/v1/dashboard-tasks", {
    params,
  });
  return response.data;
}

export async function createDashboardTaskRequest(
  payload: CreateDashboardTaskPayload
): Promise<DashboardTask> {
  const response = await apiClient.post<DashboardTask>(
    "/api/v1/dashboard-tasks",
    payload
  );
  return response.data;
}

export async function updateDashboardTaskRequest(
  taskId: number,
  payload: UpdateDashboardTaskPayload
): Promise<DashboardTask> {
  const response = await apiClient.put<DashboardTask>(
    `/api/v1/dashboard-tasks/${taskId}`,
    payload
  );
  return response.data;
}

export async function deleteDashboardTaskRequest(taskId: number): Promise<void> {
  await apiClient.delete(`/api/v1/dashboard-tasks/${taskId}`);
}

export async function getOutboundCallJobsRequest(
  params?: OutboundCallJobListParams
): Promise<OutboundCallJob[]> {
  const response = await apiClient.get<OutboundCallJob[]>("/api/v1/outbound-call-jobs", {
    params,
  });
  return response.data;
}

export async function getCallPolicyRequest(
  params?: CallPolicyQueryParams
): Promise<CallPolicy> {
  const response = await apiClient.get<CallPolicy>("/api/v1/call-policy", {
    params,
  });
  return response.data;
}

export async function updateCallPolicyRequest(
  payload: UpdateCallPolicyPayload
): Promise<CallPolicy> {
  const response = await apiClient.put<CallPolicy>("/api/v1/call-policy", payload);
  return response.data;
}

export async function getOutboundCallJobByIdRequest(
  jobId: number
): Promise<OutboundCallJob> {
  const response = await apiClient.get<OutboundCallJob>(
    `/api/v1/outbound-call-jobs/${jobId}`
  );
  return response.data;
}

export async function createOutboundCallJobRequest(
  payload: CreateOutboundCallJobPayload
): Promise<OutboundCallJob> {
  const response = await apiClient.post<OutboundCallJob>(
    "/api/v1/outbound-call-jobs",
    payload
  );
  return response.data;
}

export async function exportTenantsCsvRequest(
  params?: ReportExportParams
): Promise<Blob> {
  const response = await apiClient.get<Blob>("/api/v1/reports/tenants.csv", {
    params,
    responseType: "blob",
  });
  return response.data;
}

export async function exportCallLogsCsvRequest(
  params?: ReportExportParams
): Promise<Blob> {
  const response = await apiClient.get<Blob>("/api/v1/reports/call-logs.csv", {
    params,
    responseType: "blob",
  });
  return response.data;
}

export async function exportCsvImportsCsvRequest(
  params?: ReportExportParams
): Promise<Blob> {
  const response = await apiClient.get<Blob>("/api/v1/reports/csv-imports.csv", {
    params,
    responseType: "blob",
  });
  return response.data;
}

export async function exportDashboardTasksCsvRequest(
  params?: ReportExportParams
): Promise<Blob> {
  const response = await apiClient.get<Blob>("/api/v1/reports/dashboard-tasks.csv", {
    params,
    responseType: "blob",
  });
  return response.data;
}
