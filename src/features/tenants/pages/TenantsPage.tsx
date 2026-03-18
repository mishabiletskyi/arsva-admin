import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  FormControl,
  FormControlLabel,
  InputLabel,
  Pagination,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  archiveTenantRequest,
  createTenantRequest,
  getTenantsRequest,
  restoreTenantRequest,
  updateTenantRequest,
} from "../../../api/platform.api";
import { PageHeader } from "../../../components/common/PageHeader";
import { SectionCard } from "../../../components/common/SectionCard";
import { useAuth } from "../../auth/AuthContext";
import type { Tenant } from "../../../types/platform";
import { getApiErrorMessage } from "../../../utils/errors";
import { useClientPagination } from "../../../utils/useClientPagination";

type TenantFormState = {
  organization_id: number | null;
  property_id: number | null;
  external_id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  property_name: string;
  timezone: string;
  rent_due_date: string;
  days_late: string;
  consent_status: boolean;
  consent_timestamp: string;
  consent_source: string;
  consent_document_version: string;
  opt_out_flag: boolean;
  opt_out_timestamp: string;
  eviction_status: boolean;
  is_suppressed: boolean;
  notes: string;
};

const EMPTY_FORM: TenantFormState = {
  organization_id: null,
  property_id: null,
  external_id: "",
  first_name: "",
  last_name: "",
  phone_number: "",
  property_name: "",
  timezone: "America/New_York",
  rent_due_date: "",
  days_late: "3",
  consent_status: false,
  consent_timestamp: "",
  consent_source: "",
  consent_document_version: "",
  opt_out_flag: false,
  opt_out_timestamp: "",
  eviction_status: false,
  is_suppressed: false,
  notes: "",
};

function isE164PhoneNumber(value: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(value.trim());
}

export function TenantsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const {
    currentOrganization,
    currentProperty,
    canEditCurrentScope,
    scope,
    properties,
    setSelectedProperty,
  } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formState, setFormState] = useState<TenantFormState>(EMPTY_FORM);
  const [submitError, setSubmitError] = useState("");
  const [actionError, setActionError] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  const tenantsQuery = useQuery({
    queryKey: ["tenants", scope.organizationId, scope.propertyId, includeArchived],
    queryFn: () =>
      getTenantsRequest({
        organization_id: scope.organizationId ?? undefined,
        property_id: scope.propertyId ?? undefined,
        include_archived: includeArchived,
        limit: 100,
      }),
    enabled: scope.organizationId !== null,
  });

  useEffect(() => {
    if (!dialogOpen) {
      return;
    }

    if (editingTenant) {
      setFormState({
        organization_id: editingTenant.organization_id,
        property_id: editingTenant.property_id,
        external_id: editingTenant.external_id ?? "",
        first_name: editingTenant.first_name,
        last_name: editingTenant.last_name ?? "",
        phone_number: editingTenant.phone_number,
        property_name: editingTenant.property_name ?? "",
        timezone: editingTenant.timezone,
        rent_due_date: editingTenant.rent_due_date ?? "",
        days_late: String(editingTenant.days_late),
        consent_status: editingTenant.consent_status,
        consent_timestamp: editingTenant.consent_timestamp ?? "",
        consent_source: editingTenant.consent_source ?? "",
        consent_document_version: editingTenant.consent_document_version ?? "",
        opt_out_flag: editingTenant.opt_out_flag,
        opt_out_timestamp: editingTenant.opt_out_timestamp ?? "",
        eviction_status: editingTenant.eviction_status,
        is_suppressed: editingTenant.is_suppressed,
        notes: editingTenant.notes ?? "",
      });
      return;
    }

    setFormState({
      ...EMPTY_FORM,
      organization_id: scope.organizationId,
      property_id: scope.propertyId,
      property_name: currentProperty?.name ?? "",
      timezone: currentProperty?.timezone ?? "America/New_York",
    });
  }, [
    currentProperty,
    dialogOpen,
    editingTenant,
    scope.organizationId,
    scope.propertyId,
  ]);

  const saveMutation = useMutation({
    mutationFn: async (nextState: TenantFormState) => {
      if (nextState.organization_id === null || nextState.property_id === null) {
        throw new Error("Property is not selected for this tenant.");
      }

      const payload = {
        organization_id: nextState.organization_id,
        property_id: nextState.property_id,
        external_id: nextState.external_id.trim() || null,
        first_name: nextState.first_name.trim(),
        last_name: nextState.last_name.trim() || null,
        phone_number: nextState.phone_number.trim(),
        property_name: nextState.property_name.trim() || null,
        timezone: nextState.timezone.trim(),
        rent_due_date: nextState.rent_due_date || null,
        days_late: Number(nextState.days_late),
        consent_status: nextState.consent_status,
        consent_timestamp: nextState.consent_timestamp || null,
        consent_source: nextState.consent_source.trim() || null,
        consent_document_version: nextState.consent_document_version.trim() || null,
        opt_out_flag: nextState.opt_out_flag,
        opt_out_timestamp: nextState.opt_out_timestamp || null,
        eviction_status: nextState.eviction_status,
        is_suppressed: nextState.is_suppressed,
        notes: nextState.notes.trim() || null,
      };

      if (editingTenant) {
        return updateTenantRequest(editingTenant.id, payload);
      }

      return createTenantRequest(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tenants"] });
      setDialogOpen(false);
      setEditingTenant(null);
      setSubmitError("");
    },
    onError: (error) => {
      setSubmitError(getApiErrorMessage(error, "Failed to save tenant."));
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (tenantId: number) => archiveTenantRequest(tenantId),
    onSuccess: async () => {
      setActionError("");
      await queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
    onError: (error) => {
      setActionError(getApiErrorMessage(error, "Failed to archive tenant."));
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (tenantId: number) => restoreTenantRequest(tenantId),
    onSuccess: async () => {
      setActionError("");
      await queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
    onError: (error) => {
      setActionError(getApiErrorMessage(error, "Failed to restore tenant."));
    },
  });

  const tenantRows = Array.isArray(tenantsQuery.data) ? tenantsQuery.data : [];
  const {
    page,
    setPage,
    totalPages,
    paginatedItems: paginatedTenants,
  } = useClientPagination(tenantRows);

  function openCreateDialog() {
    setEditingTenant(null);
    setSubmitError("");
    setShowAdvancedFields(false);
    setDialogOpen(true);
  }

  function openEditDialog(tenant: Tenant) {
    setEditingTenant(tenant);
    setSubmitError("");
    setShowAdvancedFields(false);
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!formState.first_name.trim() || !formState.phone_number.trim()) {
      setSubmitError("First name and phone number are required.");
      return;
    }

    if (!isE164PhoneNumber(formState.phone_number)) {
      setSubmitError("Phone number must be in E.164 format (for example +380XXXXXXXXX).");
      return;
    }

    const daysLate = Number(formState.days_late);
    if (!Number.isInteger(daysLate) || daysLate < 0) {
      setSubmitError("Days late must be a whole number starting from 0.");
      return;
    }

    await saveMutation.mutateAsync(formState);
  }

  return (
    <>
      <PageHeader
        title="Tenants"
        description="Manage tenant records for the selected property."
        action={
          <Button
            variant="contained"
            onClick={openCreateDialog}
            disabled={!canEditCurrentScope || !scope.propertyId}
          >
            New tenant
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
                <InputLabel id="tenants-property-label">Property</InputLabel>
                <Select
                  labelId="tenants-property-label"
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
          No property selected. Create property first, then return to tenants.
        </Alert>
      ) : null}

      {!canEditCurrentScope ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Your current role is read-only in this scope. List data is available, but tenant writes are disabled.
        </Alert>
      ) : null}

      <Alert severity="info" sx={{ mb: 3 }}>
        Tenant removal is archive-based. Restore brings an archived tenant back. Call rules are managed on the Call Policy page.
      </Alert>

      {actionError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {actionError}
        </Alert>
      ) : null}

      <SectionCard>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Typography variant="h6">Tenants in scope</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={includeArchived}
                  onChange={(event) => setIncludeArchived(event.target.checked)}
                />
              }
              label="Include archived"
            />
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Days Late</TableCell>
                <TableCell>Record</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedTenants.map((tenant) => (
                <TableRow key={tenant.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {[tenant.first_name, tenant.last_name].filter(Boolean).join(" ")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {tenant.property_name || "No property label"}
                    </Typography>
                  </TableCell>
                  <TableCell>{tenant.phone_number}</TableCell>
                  <TableCell>{tenant.days_late}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={tenant.is_archived ? "Archived" : "Active"}
                      color={tenant.is_archived ? "default" : "success"}
                      variant={tenant.is_archived ? "outlined" : "filled"}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
                      <Button
                        size="small"
                        onClick={() => openEditDialog(tenant)}
                        disabled={!canEditCurrentScope || tenant.is_archived}
                      >
                        Edit
                      </Button>
                      {tenant.is_archived ? (
                        <Button
                          size="small"
                          onClick={() => restoreMutation.mutate(tenant.id)}
                          disabled={!canEditCurrentScope || restoreMutation.isPending}
                        >
                          Restore
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          color="inherit"
                          onClick={() => archiveMutation.mutate(tenant.id)}
                          disabled={!canEditCurrentScope || archiveMutation.isPending}
                        >
                          Archive
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {!tenantsQuery.isLoading && tenantRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Box sx={{ py: 3, textAlign: "center" }}>
                      <Typography color="text.secondary">
                        No tenants found for the selected scope.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
          {totalPages > 1 ? (
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_event, nextPage) => setPage(nextPage)}
                color="primary"
                shape="rounded"
              />
            </Box>
          ) : null}
        </Stack>
      </SectionCard>

      <Dialog
        open={dialogOpen}
        onClose={() => !saveMutation.isPending && setDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>{editingTenant ? "Edit tenant" : "Create tenant"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {submitError ? <Alert severity="error">{submitError}</Alert> : null}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Organization"
                value={currentOrganization?.name ?? "Not assigned"}
                fullWidth
                disabled
              />

              <TextField
                label="Property"
                value={currentProperty?.name ?? "Not selected"}
                fullWidth
                disabled
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="First name"
                value={formState.first_name}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    first_name: event.target.value,
                  }))
                }
                fullWidth
              />
              <TextField
                label="Last name"
                value={formState.last_name}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    last_name: event.target.value,
                  }))
                }
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Phone number"
                value={formState.phone_number}
                type="tel"
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    phone_number: event.target.value,
                  }))
                }
                error={formState.phone_number.length > 0 && !isE164PhoneNumber(formState.phone_number)}
                helperText="Use E.164 format, e.g. +380..., +1..."
                fullWidth
              />
              <TextField
                label="Days late"
                type="number"
                value={formState.days_late}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    days_late: event.target.value,
                  }))
                }
                fullWidth
                inputProps={{ min: 0, step: 1 }}
                helperText="Used by call policy."
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Rent due date"
                type="date"
                value={formState.rent_due_date}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    rent_due_date: event.target.value,
                  }))
                }
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Notes"
                value={formState.notes}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    notes: event.target.value,
                  }))
                }
                fullWidth
                multiline
                minRows={1}
              />
            </Stack>

            <FormControlLabel
              control={
                <Switch
                  checked={formState.consent_status}
                  onChange={(event) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      consent_status: event.target.checked,
                    }))
                  }
                />
              }
              label="Consent received"
            />

            <Box>
              <Button
                variant="text"
                color="inherit"
                onClick={() => setShowAdvancedFields((currentValue) => !currentValue)}
                disabled={saveMutation.isPending}
              >
                {showAdvancedFields ? "Hide advanced fields" : "Show advanced fields"}
              </Button>
            </Box>

            <Collapse in={showAdvancedFields}>
              <Stack spacing={2} sx={{ pt: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Advanced fields (optional)
                </Typography>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="External ID"
                    value={formState.external_id}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        external_id: event.target.value,
                      }))
                    }
                    fullWidth
                  />
                  <TextField
                    label="Property label"
                    value={formState.property_name}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        property_name: event.target.value,
                      }))
                    }
                    fullWidth
                  />
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="Timezone"
                    value={formState.timezone}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        timezone: event.target.value,
                      }))
                    }
                    fullWidth
                  />
                  <TextField
                    label="Consent timestamp"
                    type="datetime-local"
                    value={formState.consent_timestamp}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        consent_timestamp: event.target.value,
                      }))
                    }
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="Opt-out timestamp"
                    type="datetime-local"
                    value={formState.opt_out_timestamp}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        opt_out_timestamp: event.target.value,
                      }))
                    }
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <TextField
                    label="Consent source"
                    value={formState.consent_source}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        consent_source: event.target.value,
                      }))
                    }
                    fullWidth
                  />
                </Stack>

                <TextField
                  label="Consent document version"
                  value={formState.consent_document_version}
                  onChange={(event) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      consent_document_version: event.target.value,
                    }))
                  }
                  fullWidth
                />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} flexWrap="wrap">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formState.opt_out_flag}
                        onChange={(event) =>
                          setFormState((currentState) => ({
                            ...currentState,
                            opt_out_flag: event.target.checked,
                          }))
                        }
                      />
                    }
                    label="Opt-out"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formState.eviction_status}
                        onChange={(event) =>
                          setFormState((currentState) => ({
                            ...currentState,
                            eviction_status: event.target.checked,
                          }))
                        }
                      />
                    }
                    label="Eviction"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formState.is_suppressed}
                        onChange={(event) =>
                          setFormState((currentState) => ({
                            ...currentState,
                            is_suppressed: event.target.checked,
                          }))
                        }
                      />
                    }
                    label="Suppressed"
                  />
                </Stack>
              </Stack>
            </Collapse>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saveMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!canEditCurrentScope || saveMutation.isPending}
          >
            {saveMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
