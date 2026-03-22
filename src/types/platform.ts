import type { UserMembership, UserPropertyAccess } from "./access";

export type Organization = {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Property = {
  id: number;
  organization_id: number;
  name: string;
  timezone: string;
  address_line: string | null;
  city: string | null;
  state: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Tenant = {
  id: number;
  organization_id: number;
  property_id: number;
  external_id: string | null;
  first_name: string;
  last_name: string | null;
  phone_number: string;
  property_name: string | null;
  timezone: string;
  rent_due_date: string | null;
  days_late: number;
  consent_status: boolean;
  consent_timestamp: string | null;
  consent_source: string | null;
  consent_document_version: string | null;
  opt_out_flag: boolean;
  opt_out_timestamp: string | null;
  eviction_status: boolean;
  is_suppressed: boolean;
  is_archived: boolean;
  archived_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CallLog = {
  id: number;
  organization_id: number;
  property_id: number;
  tenant_id: number;
  vapi_call_id: string | null;
  call_status: string | null;
  call_outcome: string | null;
  call_summary: string | null;
  started_at: string | null;
  ended_at: string | null;
  ended_reason: string | null;
  provider_cost: number | null;
  transcript: string | null;
  recording_url: string | null;
  opt_out_detected: boolean;
  expected_payment_date: string | null;
  duration_seconds: number | null;
  script_version: string | null;
  sms_sent: boolean;
  sms_status: string | null;
  sms_message_sid: string | null;
  sms_error_message: string | null;
  sms_sent_at: string | null;
  raw_payload: unknown | null;
  created_at: string;
  updated_at: string;
};

export type TenantEligibility = {
  tenant_id: number;
  can_call_now: boolean;
  blocked_reasons: string[];
  consent_required: boolean;
  suppressed: boolean;
  outside_call_window: boolean;
  state_restriction: boolean;
  call_frequency_limited: boolean;
  delinquency_ineligible: boolean;
  opted_out: boolean;
  eviction_blocked: boolean;
  archived: boolean;
};

export type CsvImportRowError = {
  row: number;
  field: string | null;
  message: string;
};

export type CsvImport = {
  id: number;
  organization_id: number;
  property_id: number;
  original_file_name: string;
  stored_file_name: string | null;
  status: string;
  total_rows: number;
  imported_rows: number;
  failed_rows: number;
  error_message: string | null;
  errors: CsvImportRowError[] | null;
  uploaded_by_admin_id: number | null;
  created_at: string;
  updated_at: string;
};

export type AdminUser = {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
  memberships: UserMembership[];
  property_accesses: UserPropertyAccess[];
};

export type ResourceListParams = {
  skip?: number;
  limit?: number;
};

export type PropertyListParams = ResourceListParams & {
  organization_id?: number;
};

export type TenantListParams = ResourceListParams & {
  organization_id?: number;
  property_id?: number;
  include_archived?: boolean;
};

export type TenantEligibilityListParams = ResourceListParams & {
  organization_id?: number;
  property_id?: number;
  include_archived?: boolean;
};

export type CallLogListParams = ResourceListParams & {
  organization_id?: number;
  property_id?: number;
  tenant_id?: number;
};

export type CsvImportListParams = ResourceListParams & {
  organization_id?: number;
  property_id?: number;
};

export type DashboardTaskStatus = "pending" | "in_progress" | "done";

export type DashboardTask = {
  id: number;
  organization_id: number | null;
  property_id: number | null;
  title: string;
  note: string | null;
  status: DashboardTaskStatus;
  created_by_admin_id: number | null;
  created_at: string;
  updated_at: string;
};

export type DashboardTaskListParams = {
  organization_id?: number;
  property_id?: number;
};

export type CreateDashboardTaskPayload = {
  organization_id: number | null;
  property_id: number | null;
  title: string;
  note: string | null;
  status: DashboardTaskStatus;
};

export type UpdateDashboardTaskPayload = {
  title?: string;
  note?: string | null;
  status?: DashboardTaskStatus;
};

export type OutboundCallJobDispatchEntry = {
  tenant_id?: number;
  call_id?: string | null;
  error?: string | null;
  reasons?: string[];
  [key: string]: unknown;
};

export type OutboundCallJobResultSummary = {
  eligible_tenant_ids: number[];
  blocked: OutboundCallJobDispatchEntry[];
  dispatched_calls: OutboundCallJobDispatchEntry[];
  dispatch_errors: OutboundCallJobDispatchEntry[];
  dispatch_note?: string | null;
  dispatch_ready?: boolean;
};

export type OutboundCallJob = {
  id: number;
  organization_id: number | null;
  property_id: number | null;
  trigger_mode: string;
  dry_run: boolean;
  status: string | null;
  tenant_ids: number[];
  max_tenants: number | null;
  assistant_id: string | null;
  phone_number_id: string | null;
  total_candidates: number | null;
  eligible_count: number | null;
  blocked_count: number | null;
  filters: Record<string, unknown> | null;
  result_summary: OutboundCallJobResultSummary | null;
  created_by_admin_id: number | null;
  created_at: string;
  updated_at: string;
};

export type OutboundCallJobListParams = ResourceListParams & {
  organization_id?: number;
  property_id?: number;
};

export type CallPolicy = {
  organization_id: number;
  property_id: number;
  min_hours_between_calls: number;
  max_calls_7d: number;
  max_calls_30d: number;
  call_window_start: string;
  call_window_end: string;
  days_late_min: number;
  days_late_max: number;
  is_active: boolean;
  updated_at: string | null;
};

export type CallPolicyQueryParams = {
  organization_id?: number;
  property_id?: number;
};

export type UpdateCallPolicyPayload = {
  organization_id: number;
  property_id: number;
  min_hours_between_calls: number;
  max_calls_7d: number;
  max_calls_30d: number;
  call_window_start: string;
  call_window_end: string;
  days_late_min: number;
  days_late_max: number;
  is_active: boolean;
};

export type CreateOutboundCallJobPayload = {
  organization_id?: number;
  property_id?: number;
  tenant_ids?: number[];
  assistant_id?: string;
  phone_number_id?: string;
  dry_run: boolean;
  trigger_mode: string;
  max_tenants?: number;
};

export type ReportExportParams = {
  organization_id?: number;
  property_id?: number;
  date_from?: string;
  date_to?: string;
};

export type CreateOrganizationPayload = {
  name: string;
  slug: string;
  is_active: boolean;
};

export type UpdateOrganizationPayload = CreateOrganizationPayload;

export type CreatePropertyPayload = {
  organization_id: number;
  name: string;
  timezone: string;
  address_line: string | null;
  city: string | null;
  state: string | null;
  is_active: boolean;
};

export type UpdatePropertyPayload = Omit<CreatePropertyPayload, "organization_id">;

export type CreateTenantPayload = {
  external_id: string | null;
  organization_id: number;
  property_id: number;
  first_name: string;
  last_name: string | null;
  phone_number: string;
  property_name: string | null;
  timezone: string;
  rent_due_date: string | null;
  days_late: number;
  consent_status: boolean;
  consent_timestamp: string | null;
  consent_source: string | null;
  consent_document_version: string | null;
  opt_out_flag: boolean;
  opt_out_timestamp: string | null;
  eviction_status: boolean;
  is_suppressed: boolean;
  notes: string | null;
};

export type UpdateTenantPayload = CreateTenantPayload;

export type CreateAdminUserPayload = {
  email: string;
  full_name: string | null;
  password: string;
  is_active: boolean;
  is_superuser: boolean;
};

export type UpdateAdminUserPayload = {
  full_name: string | null;
  is_active: boolean;
};

export type UpdateAdminUserMembershipPayload = {
  organization_id: number;
  role: "platform_owner" | "org_admin" | "property_manager" | "viewer";
  is_active: boolean;
};

export type UpdateAdminUserPropertyAccessPayload = {
  property_id: number;
};

export type CsvUploadPayload = {
  organization_id: number;
  property_id: number;
  file: File;
};
