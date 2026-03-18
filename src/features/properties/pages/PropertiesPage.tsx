import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Pagination,
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createPropertyRequest,
  updatePropertyRequest,
} from "../../../api/platform.api";
import { PageHeader } from "../../../components/common/PageHeader";
import { SectionCard } from "../../../components/common/SectionCard";
import { useAuth } from "../../auth/AuthContext";
import type { Property } from "../../../types/platform";
import { getApiErrorMessage } from "../../../utils/errors";
import { useClientPagination } from "../../../utils/useClientPagination";

type PropertyFormState = {
  organization_id: number | null;
  name: string;
  timezone: string;
  address_line: string;
  city: string;
  state: string;
  is_active: boolean;
};

const EMPTY_FORM: PropertyFormState = {
  organization_id: null,
  name: "",
  timezone: "America/New_York",
  address_line: "",
  city: "",
  state: "",
  is_active: true,
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "N/A";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "N/A";
  }

  return parsed.toLocaleString();
}

function formatLocation(property: Property): string {
  const parts = [property.address_line, property.city, property.state]
    .map((item) => item?.trim() ?? "")
    .filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "N/A";
}

export function PropertiesPage() {
  const queryClient = useQueryClient();
  const {
    organizations,
    properties,
    scope,
    canEditCurrentScope,
    refreshMe,
    setSelectedProperty,
  } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [formState, setFormState] = useState<PropertyFormState>(EMPTY_FORM);
  const [submitError, setSubmitError] = useState("");
  const propertyRows = properties;
  const {
    page,
    setPage,
    totalPages,
    paginatedItems: paginatedProperties,
  } = useClientPagination(propertyRows);

  useEffect(() => {
    if (!dialogOpen) {
      return;
    }

    if (editingProperty) {
      setFormState({
        organization_id: editingProperty.organization_id,
        name: editingProperty.name,
        timezone: editingProperty.timezone,
        address_line: editingProperty.address_line ?? "",
        city: editingProperty.city ?? "",
        state: editingProperty.state ?? "",
        is_active: editingProperty.is_active,
      });
      return;
    }

    setFormState({
      ...EMPTY_FORM,
      organization_id: scope.organizationId ?? organizations[0]?.id ?? null,
    });
  }, [dialogOpen, editingProperty, organizations, scope.organizationId]);

  const saveMutation = useMutation({
    mutationFn: async (nextState: PropertyFormState) => {
      if (nextState.organization_id === null) {
        throw new Error("Select an organization first.");
      }

      if (editingProperty) {
        return updatePropertyRequest(editingProperty.id, {
          name: nextState.name.trim(),
          timezone: nextState.timezone.trim(),
          address_line: nextState.address_line.trim() || null,
          city: nextState.city.trim() || null,
          state: nextState.state.trim() || null,
          is_active: nextState.is_active,
        });
      }

      return createPropertyRequest({
        organization_id: nextState.organization_id,
        name: nextState.name.trim(),
        timezone: nextState.timezone.trim(),
        address_line: nextState.address_line.trim() || null,
        city: nextState.city.trim() || null,
        state: nextState.state.trim() || null,
        is_active: nextState.is_active,
      });
    },
    onSuccess: async (savedProperty) => {
      await Promise.all([
        refreshMe(),
        queryClient.invalidateQueries({ queryKey: ["properties"] }),
        queryClient.invalidateQueries({ queryKey: ["organizations"] }),
      ]);

      if (!editingProperty && scope.propertyId === null) {
        setSelectedProperty(savedProperty.id);
      }

      setDialogOpen(false);
      setEditingProperty(null);
      setSubmitError("");
    },
    onError: (error) => {
      setSubmitError(getApiErrorMessage(error, "Failed to save property."));
    },
  });

  function openCreateDialog() {
    setEditingProperty(null);
    setSubmitError("");
    setDialogOpen(true);
  }

  function openEditDialog(property: Property) {
    setEditingProperty(property);
    setSubmitError("");
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!formState.name.trim() || !formState.timezone.trim()) {
      setSubmitError("Name and timezone are required.");
      return;
    }

    await saveMutation.mutateAsync(formState);
  }

  return (
    <>
      <PageHeader
        title="Properties"
        description="Create and maintain property records inside the selected organization. The list updates with the active org scope."
        action={
          <Button
            variant="contained"
            onClick={openCreateDialog}
            disabled={!canEditCurrentScope || !scope.organizationId}
          >
            New property
          </Button>
        }
      />

      {!canEditCurrentScope ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Your current role can view properties but cannot create or edit them.
        </Alert>
      ) : null}

      <SectionCard>
        <Stack spacing={2}>
          <Typography variant="h6">Properties in the current organization</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Timezone</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedProperties.map((property) => (
                <TableRow key={property.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{property.name}</Typography>
                  </TableCell>
                  <TableCell>{property.timezone}</TableCell>
                  <TableCell>
                    {formatLocation(property)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={property.is_active ? "Active" : "Inactive"}
                      color={property.is_active ? "success" : "default"}
                      variant={property.is_active ? "filled" : "outlined"}
                    />
                  </TableCell>
                  <TableCell>{formatDateTime(property.updated_at)}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={() => openEditDialog(property)}
                      disabled={!canEditCurrentScope}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {propertyRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Box sx={{ py: 3, textAlign: "center" }}>
                      <Typography color="text.secondary">
                        No properties found for the selected organization.
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
        maxWidth="sm"
      >
        <DialogTitle>{editingProperty ? "Edit property" : "Create property"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {submitError ? <Alert severity="error">{submitError}</Alert> : null}

            <TextField
              select
              label="Organization"
              value={formState.organization_id ?? ""}
              onChange={(event) =>
                setFormState((currentState) => ({
                  ...currentState,
                  organization_id: Number(event.target.value),
                }))
              }
              fullWidth
              disabled={Boolean(editingProperty)}
              SelectProps={{ native: true }}
            >
              <option value="" disabled>
                Select an organization
              </option>
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </TextField>

            <TextField
              label="Property name"
              value={formState.name}
              onChange={(event) =>
                setFormState((currentState) => ({
                  ...currentState,
                  name: event.target.value,
                }))
              }
              fullWidth
            />

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
              label="Address line"
              value={formState.address_line}
              onChange={(event) =>
                setFormState((currentState) => ({
                  ...currentState,
                  address_line: event.target.value,
                }))
              }
              fullWidth
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="City"
                value={formState.city}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    city: event.target.value,
                  }))
                }
                fullWidth
              />

              <TextField
                label="State"
                value={formState.state}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    state: event.target.value,
                  }))
                }
                fullWidth
              />
            </Stack>

            <FormControlLabel
              control={
                <Switch
                  checked={formState.is_active}
                  onChange={(event) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      is_active: event.target.checked,
                    }))
                  }
                />
              }
              label="Property is active"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saveMutation.isPending}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
