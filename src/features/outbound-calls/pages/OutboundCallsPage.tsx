import { useEffect, useMemo, useState } from "react";
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
  FormControlLabel,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableContainer,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  createOutboundCallJobRequest,
  getOutboundCallJobsRequest,
  getTenantEligibilityRequest,
  getTenantsRequest,
} from "../../../api/platform.api";
import { PageHeader } from "../../../components/common/PageHeader";
import { SectionCard } from "../../../components/common/SectionCard";
import { useAuth } from "../../auth/AuthContext";
import type { OutboundCallJob, Tenant } from "../../../types/platform";
import { getApiErrorMessage } from "../../../utils/errors";

function getJobStatusTone(status: string | null): "default" | "warning" | "success" | "error" {
  if (status === "completed" || status === "dispatched") {
    return "success";
  }

  if (status === "processing" || status === "queued") {
    return "warning";
  }

  if (status === "failed") {
    return "error";
  }

  return "default";
}

export function OutboundCallsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    canEditCurrentScope,
    scope,
    properties,
    setSelectedProperty,
  } = useAuth();
  const [selectedTenantIds, setSelectedTenantIds] = useState<number[]>([]);
  const [assistantId, setAssistantId] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [maxTenants, setMaxTenants] = useState("50");
  const [dryRun, setDryRun] = useState(false);
  const [showAdvancedDispatch, setShowAdvancedDispatch] = useState(false);
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

  const eligibilityQuery = useQuery({
    queryKey: ["outbound", "eligibility", scope.organizationId, scope.propertyId],
    queryFn: () =>
      getTenantEligibilityRequest({
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

  const eligibilityByTenantId = useMemo(
    () =>
      new Map((eligibilityQuery.data ?? []).map((item) => [item.tenant_id, item])),
    [eligibilityQuery.data]
  );

  const eligibleTenantIds = useMemo(
    () =>
      (eligibilityQuery.data ?? [])
        .filter((item) => item.can_call_now)
        .map((item) => item.tenant_id),
    [eligibilityQuery.data]
  );
  const eligibleTenantIdSet = useMemo(
    () => new Set(eligibleTenantIds),
    [eligibleTenantIds]
  );
  const hasEligibilityData = (eligibilityQuery.data?.length ?? 0) > 0;

  useEffect(() => {
    const visibleIds = new Set((tenantsQuery.data ?? []).map((tenant) => tenant.id));
    setSelectedTenantIds((current) => current.filter((id) => visibleIds.has(id)));
  }, [tenantsQuery.data]);

  const dispatchMutation = useMutation({
    mutationFn: async () => {
      if (scope.organizationId === null || scope.propertyId === null) {
        throw new Error("Property is not selected for outbound calls.");
      }

      if (selectedTenantIds.length === 0) {
        throw new Error("Select at least one tenant.");
      }

      const tenantIdsForDispatch = hasEligibilityData
        ? selectedTenantIds.filter((tenantId) => eligibleTenantIdSet.has(tenantId))
        : selectedTenantIds;
      if (tenantIdsForDispatch.length === 0) {
        throw new Error("All selected tenants are currently blocked by call policy.");
      }

      const parsedMax = showAdvancedDispatch
        ? Number(maxTenants)
        : Math.min(Math.max(tenantIdsForDispatch.length, 1), 50);
      if (!Number.isInteger(parsedMax) || parsedMax < 1 || parsedMax > 50) {
        throw new Error("Max tenants must be between 1 and 50.");
      }

      return createOutboundCallJobRequest({
        organization_id: scope.organizationId,
        property_id: scope.propertyId,
        tenant_ids: tenantIdsForDispatch,
        assistant_id: showAdvancedDispatch ? assistantId.trim() || undefined : undefined,
        phone_number_id: showAdvancedDispatch ? phoneNumberId.trim() || undefined : undefined,
        dry_run: showAdvancedDispatch ? dryRun : false,
        trigger_mode: "manual",
        max_tenants: parsedMax,
      });
    },
    onSuccess: async () => {
      setSubmitError("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["outbound", "jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["outbound", "eligibility"] }),
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

  function selectEligible() {
    const visibleTenantIds = new Set((tenantsQuery.data ?? []).map((tenant) => tenant.id));
    setSelectedTenantIds(eligibleTenantIds.filter((id) => visibleTenantIds.has(id)));
  }

  function clearSelection() {
    setSelectedTenantIds([]);
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
                <Button size="small" onClick={selectEligible}>
                  Select eligible
                </Button>
                <Button size="small" color="inherit" onClick={clearSelection}>
                  Clear
                </Button>
              </Stack>
            </Stack>

            <Typography variant="body2" color="text.secondary">
              Selected: {selectedTenantIds.length}. Pilot compliance: days late 3-10, max batch size 50.
            </Typography>

            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 640 }}>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell>Tenant</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Days Late</TableCell>
                    <TableCell>Readiness</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(tenantsQuery.data ?? []).map((tenant: Tenant) => {
                    const eligibility = eligibilityByTenantId.get(tenant.id);
                    const blockedReasons = eligibility?.blocked_reasons ?? [];

                    return (
                      <TableRow key={tenant.id} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isTenantSelected(tenant.id)}
                            onChange={(event) => toggleTenant(tenant.id, event.target.checked)}
                            disabled={
                              tenant.is_archived ||
                              (eligibility !== undefined && !eligibility.can_call_now)
                            }
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
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Chip
                              size="small"
                              label={
                                !eligibility
                                  ? "Unknown"
                                  : eligibility.can_call_now
                                    ? "Ready"
                                    : "Blocked"
                              }
                              color={
                                !eligibility
                                  ? "default"
                                  : eligibility.can_call_now
                                    ? "success"
                                    : "warning"
                              }
                              variant="outlined"
                            />
                            {blockedReasons.length > 0 ? (
                              <Typography variant="caption" color="text.secondary">
                                {blockedReasons.join(", ")}
                              </Typography>
                            ) : null}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!tenantsQuery.isLoading && (tenantsQuery.data?.length ?? 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Box sx={{ py: 3, textAlign: "center" }}>
                          <Typography color="text.secondary">
                            No tenants available for this scope.
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack spacing={1.5}>
              <Alert severity="info" sx={{ py: 0.75 }}>
                Quick mode: use default assistant and phone number, then start real calls for selected eligible tenants.
              </Alert>

              <Box>
                <Button
                  variant="text"
                  color="inherit"
                  onClick={() => setShowAdvancedDispatch((currentValue) => !currentValue)}
                  disabled={dispatchMutation.isPending}
                >
                  {showAdvancedDispatch ? "Hide advanced settings" : "Show advanced settings"}
                </Button>
              </Box>

              <Collapse in={showAdvancedDispatch}>
                <Stack spacing={1.5} sx={{ pt: 1 }}>
                  <Box
                    sx={{
                      display: "grid",
                      gap: 1.5,
                      gridTemplateColumns: {
                        xs: "1fr",
                        xl: "minmax(0, 1fr) minmax(0, 1fr) 190px",
                      },
                      alignItems: "start",
                    }}
                  >
                    <TextField
                      label="Assistant ID (optional)"
                      value={assistantId}
                      onChange={(event) => setAssistantId(event.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Phone Number ID (optional)"
                      value={phoneNumberId}
                      onChange={(event) => setPhoneNumberId(event.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Max tenants"
                      type="number"
                      value={maxTenants}
                      onChange={(event) => setMaxTenants(event.target.value)}
                      inputProps={{ min: 1, max: 50, step: 1 }}
                      fullWidth
                    />
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={dryRun}
                        onChange={(event) => setDryRun(event.target.checked)}
                      />
                    }
                    label="Dry run (test only, no real calls)"
                  />
                </Stack>
              </Collapse>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", sm: "center" }}
                spacing={1}
              >
                <Typography variant="body2" color="text.secondary">
                  Blocked tenants are skipped automatically.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => dispatchMutation.mutate()}
                  disabled={!canEditCurrentScope || !scope.propertyId || dispatchMutation.isPending}
                  sx={{ width: { xs: "100%", sm: "auto" }, minWidth: { sm: 190 } }}
                >
                  {dispatchMutation.isPending
                    ? "Dispatching..."
                    : showAdvancedDispatch && dryRun
                      ? "Run test job"
                      : "Start calling selected tenants"}
                </Button>
              </Stack>
            </Stack>
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
                    <TableCell>Mode</TableCell>
                    <TableCell>Result</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(jobsQuery.data ?? []).map((job) => (
                    <TableRow key={job.id} hover>
                      <TableCell>{new Date(job.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={job.status || "N/A"}
                          color={getJobStatusTone(job.status)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{job.dry_run ? "Dry run" : "Live"}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          Candidates: {job.total_candidates ?? "N/A"}
                        </Typography>
                        <Typography variant="body2">
                          Eligible: {job.eligible_count ?? job.result_summary?.eligible_tenant_ids?.length ?? 0}
                        </Typography>
                        <Typography variant="body2">
                          Blocked: {job.blocked_count ?? job.result_summary?.blocked?.length ?? 0}
                        </Typography>
                        <Typography variant="body2">
                          Dispatched: {job.result_summary?.dispatched_calls?.length ?? 0}
                        </Typography>
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
                  {!jobsQuery.isLoading && (jobsQuery.data?.length ?? 0) === 0 ? (
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
                Mode: {selectedJob.dry_run ? "Dry run" : "Live"} | Trigger: {selectedJob.trigger_mode}
              </Typography>
              <Typography variant="body2">
                Candidates: {selectedJob.total_candidates ?? "N/A"} | Eligible: {selectedJob.eligible_count ?? "N/A"} | Blocked: {selectedJob.blocked_count ?? "N/A"}
              </Typography>
              <Typography variant="body2">
                Dispatched: {selectedJob.result_summary?.dispatched_calls?.length ?? 0}
              </Typography>
              <Typography variant="body2">
                Dispatch note: {selectedJob.result_summary?.dispatch_note ?? "N/A"}
              </Typography>
              <Box>
                <Button
                  variant="text"
                  color="inherit"
                  onClick={() =>
                    setShowTechnicalJobDetails((currentValue) => !currentValue)
                  }
                >
                  {showTechnicalJobDetails
                    ? "Hide technical details"
                    : "Show technical details"}
                </Button>
              </Box>
              <Collapse in={showTechnicalJobDetails}>
                <Stack spacing={2} sx={{ pt: 1 }}>
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
                    {JSON.stringify(selectedJob.result_summary ?? {}, null, 2)}
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
