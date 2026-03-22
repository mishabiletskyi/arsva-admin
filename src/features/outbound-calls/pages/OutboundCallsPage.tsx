import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableContainer,
  TableRow,
  TableSortLabel,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  createOutboundCallJobRequest,
  getOutboundCallJobsRequest,
  getTenantsRequest,
} from "../../../api/platform.api";
import { PageHeader } from "../../../components/common/PageHeader";
import { SectionCard } from "../../../components/common/SectionCard";
import { useAuth } from "../../auth/AuthContext";
import type { OutboundCallJob, Tenant } from "../../../types/platform";
import { getApiErrorMessage } from "../../../utils/errors";
import { useClientPagination } from "../../../utils/useClientPagination";

function asNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is number => typeof item === "number");
}

function getJobResultSummary(job: OutboundCallJob): Record<string, unknown> {
  if (!job.result_summary || typeof job.result_summary !== "object") {
    return {};
  }

  return job.result_summary as Record<string, unknown>;
}

function getNormalizedJobStatus(job: OutboundCallJob): "queued" | "processing" | "completed" | "failed" {
  const status = (job.status || "").toLowerCase();
  const startedCallsCount = getStartedCallsCount(job);
  const dispatchErrorCount = getDispatchErrorCount(job);
  const dispatchNote = String(getJobResultSummary(job).dispatch_note ?? "").trim();

  if (status === "failed") {
    return "failed";
  }

  if (
    status === "completed" ||
    status === "dispatched" ||
    status === "previewed" ||
    startedCallsCount > 0 ||
    dispatchErrorCount > 0 ||
    dispatchNote.length > 0
  ) {
    return "completed";
  }

  if (status === "processing") {
    return "processing";
  }

  return "queued";
}

function getJobStatusTone(job: OutboundCallJob): "default" | "warning" | "success" | "error" {
  const normalizedStatus = getNormalizedJobStatus(job);

  if (normalizedStatus === "completed") {
    return "success";
  }

  if (normalizedStatus === "processing" || normalizedStatus === "queued") {
    return "warning";
  }

  if (normalizedStatus === "failed") {
    return "error";
  }

  return "default";
}

function getSelectedTenantsCount(job: OutboundCallJob): number {
  const tenantIds = asNumberArray(job.tenant_ids);

  if (tenantIds.length > 0) {
    return tenantIds.length;
  }

  return job.total_candidates ?? 0;
}

function getStartedCallsCount(job: OutboundCallJob): number {
  const dispatchedCalls = getJobResultSummary(job).dispatched_calls;

  return Array.isArray(dispatchedCalls) ? dispatchedCalls.length : 0;
}

function getDispatchErrorCount(job: OutboundCallJob): number {
  const dispatchErrors = getJobResultSummary(job).dispatch_errors;

  return Array.isArray(dispatchErrors) ? dispatchErrors.length : 0;
}

function getTenantFullName(tenant: Tenant): string {
  return [tenant.first_name, tenant.last_name].filter(Boolean).join(" ").trim();
}

const TENANTS_PER_PAGE = 7;

export function OutboundCallsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canEditCurrentScope, scope, properties, setSelectedProperty } = useAuth();
  const [selectedTenantIds, setSelectedTenantIds] = useState<number[]>([]);
  const [tenantSortField, setTenantSortField] = useState<"tenant" | "days_late">("tenant");
  const [tenantSortDirection, setTenantSortDirection] = useState<"asc" | "desc">("asc");
  const [tenantPage, setTenantPage] = useState(1);
  const [showTechnicalJobDetails, setShowTechnicalJobDetails] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [selectedJob, setSelectedJob] = useState<OutboundCallJob | null>(null);

  const tenantsQuery = useQuery({
    queryKey: ["outbound", "tenants", scope.organizationId, scope.propertyId],
    queryFn: () =>
      getTenantsRequest({
        organization_id: scope.organizationId ?? undefined,
        property_id: scope.propertyId ?? undefined,
        include_archived: false,
        limit: 200,
      }),
    enabled: scope.organizationId !== null && scope.propertyId !== null,
  });

  const jobsQuery = useQuery({
    queryKey: ["outbound", "jobs", scope.organizationId, scope.propertyId],
    queryFn: () =>
      getOutboundCallJobsRequest({
        organization_id: scope.organizationId ?? undefined,
        property_id: scope.propertyId ?? undefined,
        limit: 100,
      }),
    enabled: scope.organizationId !== null,
    refetchInterval: 15_000,
  });

  const tenantRows = (Array.isArray(tenantsQuery.data) ? tenantsQuery.data : []).filter(
    (tenant) => !tenant.is_archived && !tenant.is_suppressed && tenant.days_late > 0
  );
  const jobRows = Array.isArray(jobsQuery.data) ? jobsQuery.data : [];
  const sortedTenantRows = [...tenantRows].sort((leftTenant, rightTenant) => {
    const directionMultiplier = tenantSortDirection === "asc" ? 1 : -1;

    if (tenantSortField === "days_late") {
      return (leftTenant.days_late - rightTenant.days_late) * directionMultiplier;
    }

    return (
      getTenantFullName(leftTenant).localeCompare(getTenantFullName(rightTenant), undefined, {
        sensitivity: "base",
      }) * directionMultiplier
    );
  });
  const totalTenantPages = Math.max(1, Math.ceil(sortedTenantRows.length / TENANTS_PER_PAGE));
  const paginatedTenantRows = sortedTenantRows.slice(
    (tenantPage - 1) * TENANTS_PER_PAGE,
    tenantPage * TENANTS_PER_PAGE
  );
  const {
    page: jobsPage,
    setPage: setJobsPage,
    totalPages: totalJobPages,
    paginatedItems: paginatedJobRows,
  } = useClientPagination(jobRows);

  useEffect(() => {
    const visibleIds = new Set(tenantRows.map((tenant) => tenant.id));
    setSelectedTenantIds((current) => {
      const next = current.filter((id) => visibleIds.has(id));

      if (next.length === current.length && next.every((id, index) => id === current[index])) {
        return current;
      }

      return next;
    });
  }, [tenantsQuery.data]);

  useEffect(() => {
    if (tenantPage > totalTenantPages) {
      setTenantPage(totalTenantPages);
    }
  }, [tenantPage, totalTenantPages]);

  const dispatchMutation = useMutation({
    mutationFn: async () => {
      if (scope.organizationId === null || scope.propertyId === null) {
        throw new Error("Property is not selected for outbound calls.");
      }

      if (selectedTenantIds.length === 0) {
        throw new Error("Select at least one tenant.");
      }

      return createOutboundCallJobRequest({
        organization_id: scope.organizationId,
        property_id: scope.propertyId,
        tenant_ids: selectedTenantIds,
        dry_run: false,
        trigger_mode: "manual",
        max_tenants: Math.min(Math.max(selectedTenantIds.length, 1), 50),
      });
    },
    onSuccess: async () => {
      setSubmitError("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["outbound", "jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["call-logs"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard", "call-logs"] }),
      ]);
    },
    onError: (error) => {
      setSubmitError(getApiErrorMessage(error, "Failed to dispatch outbound calls."));
    },
  });

  function isTenantSelected(tenantId: number): boolean {
    return selectedTenantIds.includes(tenantId);
  }

  function toggleTenant(tenantId: number, checked: boolean) {
    setSelectedTenantIds((current) => {
      if (checked) {
        return current.includes(tenantId) ? current : [...current, tenantId];
      }

      return current.filter((id) => id !== tenantId);
    });
  }

  function selectAll() {
    setSelectedTenantIds(tenantRows.map((tenant) => tenant.id));
  }

  function clearSelection() {
    setSelectedTenantIds([]);
  }

  function handleTenantSort(field: "tenant" | "days_late") {
    setTenantSortField((currentField) => {
      if (currentField === field) {
        setTenantSortDirection((currentDirection) =>
          currentDirection === "asc" ? "desc" : "asc"
        );
        return currentField;
      }

      setTenantSortDirection("asc");
      return field;
    });
    setTenantPage(1);
  }

  return (
    <>
      <PageHeader
        title="Outbound Calls"
        description="Pick tenants and start calls for the selected property."
        action={
          <Button variant="outlined" onClick={() => void jobsQuery.refetch()}>
            Refresh jobs
          </Button>
        }
      />

      {properties.length > 1 ? (
        <Box sx={{ mb: 3 }}>
          <SectionCard>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <Typography variant="subtitle1" sx={{ minWidth: 140 }}>
                Active property
              </Typography>
              <FormControl size="small" fullWidth>
                <InputLabel id="outbound-property-label">Property</InputLabel>
                <Select
                  labelId="outbound-property-label"
                  label="Property"
                  value={scope.propertyId ?? ""}
                  onChange={(event) =>
                    setSelectedProperty(
                      event.target.value ? Number(event.target.value) : null
                    )
                  }
                >
                  {properties.map((property) => (
                    <MenuItem key={property.id} value={property.id}>
                      {property.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </SectionCard>
        </Box>
      ) : null}

      {!scope.propertyId ? (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate("/properties")}>
              Open properties
            </Button>
          }
        >
          No property selected. Create/select property first to run outbound calls.
        </Alert>
      ) : null}

      {!canEditCurrentScope ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Your role is read-only in this scope. You can review jobs but cannot dispatch.
        </Alert>
      ) : null}

      {submitError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      ) : null}

      <Alert severity="info" sx={{ mb: 3 }}>
        Only tenants with days late above 0 and no suppression appear here. When a tenant pays, mark them paid in Tenants and they drop out of this list.
      </Alert>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", xl: "1.2fr 1fr" },
        }}
      >
        <SectionCard>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={1}
            >
              <Typography variant="h6">Tenant selection</Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={selectAll}>
                  Select all
                </Button>
                <Button size="small" color="inherit" onClick={clearSelection}>
                  Clear
                </Button>
              </Stack>
            </Stack>

            <Typography variant="body2" color="text.secondary">
              Selected: {selectedTenantIds.length} of {tenantRows.length}. Page {tenantPage} shows up to {TENANTS_PER_PAGE} tenants.
            </Typography>

            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 640 }}>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell sortDirection={tenantSortField === "tenant" ? tenantSortDirection : false}>
                      <TableSortLabel
                        active={tenantSortField === "tenant"}
                        direction={tenantSortField === "tenant" ? tenantSortDirection : "asc"}
                        onClick={() => handleTenantSort("tenant")}
                      >
                        Tenant
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell sortDirection={tenantSortField === "days_late" ? tenantSortDirection : false}>
                      <TableSortLabel
                        active={tenantSortField === "days_late"}
                        direction={tenantSortField === "days_late" ? tenantSortDirection : "asc"}
                        onClick={() => handleTenantSort("days_late")}
                      >
                        Days Late
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedTenantRows.map((tenant: Tenant) => (
                    <TableRow key={tenant.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isTenantSelected(tenant.id)}
                          onChange={(event) => toggleTenant(tenant.id, event.target.checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {[tenant.first_name, tenant.last_name].filter(Boolean).join(" ")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          #{tenant.id}
                        </Typography>
                      </TableCell>
                      <TableCell>{tenant.phone_number}</TableCell>
                      <TableCell>{tenant.days_late}</TableCell>
                    </TableRow>
                  ))}
                  {!tenantsQuery.isLoading && sortedTenantRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Box sx={{ py: 3, textAlign: "center" }}>
                          <Typography color="text.secondary">
                            No overdue tenants available for this scope.
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>

            {totalTenantPages > 1 ? (
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Pagination
                  count={totalTenantPages}
                  page={tenantPage}
                  onChange={(_event, nextPage) => setTenantPage(nextPage)}
                  color="primary"
                  shape="rounded"
                />
              </Box>
            ) : null}

            <Button
              variant="contained"
              onClick={() => dispatchMutation.mutate()}
              disabled={!canEditCurrentScope || !scope.propertyId || dispatchMutation.isPending}
              sx={{ width: { xs: "100%", sm: "auto" }, minWidth: { sm: 190 } }}
            >
              {dispatchMutation.isPending ? "Starting..." : "Start calls"}
            </Button>
          </Stack>
        </SectionCard>

        <SectionCard>
          <Stack spacing={2}>
            <Typography variant="h6">Outbound job history</Typography>
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 660 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Created</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Selected</TableCell>
                    <TableCell>Started</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedJobRows.map((job) => (
                    <TableRow key={job.id} hover>
                      <TableCell>{new Date(job.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={getNormalizedJobStatus(job)}
                          color={getJobStatusTone(job)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{getSelectedTenantsCount(job)}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{getStartedCallsCount(job)}</Typography>
                        {getDispatchErrorCount(job) > 0 ? (
                          <Typography variant="caption" color="error.main">
                            Errors: {getDispatchErrorCount(job)}
                          </Typography>
                        ) : null}
                        {job.dry_run ? (
                          <Typography variant="caption" color="text.secondary">
                            Test run
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          onClick={() => {
                            setSelectedJob(job);
                            setShowTechnicalJobDetails(false);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!jobsQuery.isLoading && jobRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Box sx={{ py: 3, textAlign: "center" }}>
                          <Typography color="text.secondary">No outbound jobs yet.</Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>
            {totalJobPages > 1 ? (
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Pagination
                  count={totalJobPages}
                  page={jobsPage}
                  onChange={(_event, nextPage) => setJobsPage(nextPage)}
                  color="primary"
                  shape="rounded"
                />
              </Box>
            ) : null}
          </Stack>
        </SectionCard>
      </Box>

      <Dialog
        open={Boolean(selectedJob)}
        onClose={() => {
          setSelectedJob(null);
          setShowTechnicalJobDetails(false);
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Outbound Job Details</DialogTitle>
        <DialogContent dividers>
          {selectedJob ? (
            <Stack spacing={2}>
              <Typography variant="body2">
                Job #{selectedJob.id} created {new Date(selectedJob.created_at).toLocaleString()}
              </Typography>
              <Typography variant="body2">
                Status: {getNormalizedJobStatus(selectedJob)} | Mode: {selectedJob.dry_run ? "Test" : "Live"}
              </Typography>
              <Typography variant="body2">
                Selected tenants: {getSelectedTenantsCount(selectedJob)}
              </Typography>
              <Typography variant="body2">
                Calls started: {getStartedCallsCount(selectedJob)}
              </Typography>
              <Typography variant="body2">
                Errors: {getDispatchErrorCount(selectedJob)}
              </Typography>
              <Typography variant="body2">
                Note: {String(getJobResultSummary(selectedJob).dispatch_note ?? "N/A")}
              </Typography>
              <Box>
                <Button
                  variant="text"
                  color="inherit"
                  onClick={() =>
                    setShowTechnicalJobDetails((currentValue) => !currentValue)
                  }
                >
                  {showTechnicalJobDetails ? "Hide raw data" : "Show raw data"}
                </Button>
              </Box>
              <Collapse in={showTechnicalJobDetails}>
                <Stack spacing={2} sx={{ pt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Raw backend status: {selectedJob.status || "N/A"}
                  </Typography>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Filters
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        m: 0,
                        p: 2,
                        borderRadius: 2,
                        border: "1px solid rgba(15, 23, 42, 0.08)",
                        bgcolor: "rgba(15,23,42,0.03)",
                        overflowX: "auto",
                        fontSize: 12,
                      }}
                    >
                      {JSON.stringify(selectedJob.filters ?? {}, null, 2)}
                    </Box>
                  </Box>
                  <Box
                    component="pre"
                    sx={{
                      m: 0,
                      p: 2,
                      borderRadius: 2,
                      border: "1px solid rgba(15, 23, 42, 0.08)",
                      bgcolor: "rgba(15,23,42,0.03)",
                      overflowX: "auto",
                      fontSize: 12,
                    }}
                  >
                    {JSON.stringify(getJobResultSummary(selectedJob), null, 2)}
                  </Box>
                </Stack>
              </Collapse>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setSelectedJob(null);
              setShowTechnicalJobDetails(false);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
