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
  createOrganizationRequest,
  updateOrganizationRequest,
} from "../../../api/platform.api";
import { PageHeader } from "../../../components/common/PageHeader";
import { SectionCard } from "../../../components/common/SectionCard";
import { useAuth } from "../../auth/AuthContext";
import type { Organization } from "../../../types/platform";
import { getApiErrorMessage } from "../../../utils/errors";
import { useClientPagination } from "../../../utils/useClientPagination";

type OrganizationFormState = {
  name: string;
  slug: string;
  is_active: boolean;
};

const EMPTY_FORM: OrganizationFormState = {
  name: "",
  slug: "",
  is_active: true,
};

function buildSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function OrganizationsPage() {
  const queryClient = useQueryClient();
  const { organizations, canManageOrganizations } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
  const [formState, setFormState] = useState<OrganizationFormState>(EMPTY_FORM);
  const [submitError, setSubmitError] = useState("");
  const organizationRows = organizations;
  const {
    page,
    setPage,
    totalPages,
    paginatedItems: paginatedOrganizations,
  } = useClientPagination(organizationRows);

  useEffect(() => {
    if (!dialogOpen) {
      return;
    }

    if (editingOrganization) {
      setFormState({
        name: editingOrganization.name,
        slug: editingOrganization.slug,
        is_active: editingOrganization.is_active,
      });
      return;
    }

    setFormState(EMPTY_FORM);
  }, [dialogOpen, editingOrganization]);

  const saveMutation = useMutation({
    mutationFn: async (nextState: OrganizationFormState) => {
      if (editingOrganization) {
        return updateOrganizationRequest(editingOrganization.id, nextState);
      }

      return createOrganizationRequest(nextState);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["organizations"] });
      setDialogOpen(false);
      setEditingOrganization(null);
      setSubmitError("");
    },
    onError: (error) => {
      setSubmitError(getApiErrorMessage(error, "Failed to save organization."));
    },
  });

  function openCreateDialog() {
    setEditingOrganization(null);
    setSubmitError("");
    setDialogOpen(true);
  }

  function openEditDialog(organization: Organization) {
    setEditingOrganization(organization);
    setSubmitError("");
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!formState.name.trim() || !formState.slug.trim()) {
      setSubmitError("Name and slug are required.");
      return;
    }

    await saveMutation.mutateAsync({
      ...formState,
      name: formState.name.trim(),
      slug: formState.slug.trim(),
    });
  }

  return (
    <>
      <PageHeader
        title="Organizations"
        description="Manage company-level scopes. Platform owners can create or update organizations directly from the admin UI."
        action={
          <Button variant="contained" onClick={openCreateDialog} disabled={!canManageOrganizations}>
            New organization
          </Button>
        }
      />

      {!canManageOrganizations ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          You can view organizations in your scope, but only platform owners can create or edit them.
        </Alert>
      ) : null}

      <SectionCard>
        <Stack spacing={2}>
          <Typography variant="h6">Accessible Organizations</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedOrganizations.map((organization) => (
                <TableRow key={organization.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{organization.name}</Typography>
                  </TableCell>
                  <TableCell>{organization.slug}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={organization.is_active ? "Active" : "Inactive"}
                      color={organization.is_active ? "success" : "default"}
                      variant={organization.is_active ? "filled" : "outlined"}
                    />
                  </TableCell>
                  <TableCell>{new Date(organization.updated_at).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={() => openEditDialog(organization)}
                      disabled={!canManageOrganizations}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {organizationRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Box sx={{ py: 3, textAlign: "center" }}>
                      <Typography color="text.secondary">
                        No organizations are currently visible in your scope.
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
        <DialogTitle>
          {editingOrganization ? "Edit organization" : "Create organization"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {submitError ? <Alert severity="error">{submitError}</Alert> : null}

            <TextField
              label="Organization name"
              value={formState.name}
              onChange={(event) => {
                const nextName = event.target.value;
                setFormState((currentState) => ({
                  ...currentState,
                  name: nextName,
                  slug:
                    editingOrganization || currentState.slug
                      ? currentState.slug
                      : buildSlug(nextName),
                }));
              }}
              fullWidth
            />

            <TextField
              label="Slug"
              value={formState.slug}
              onChange={(event) =>
                setFormState((currentState) => ({
                  ...currentState,
                  slug: buildSlug(event.target.value),
                }))
              }
              fullWidth
            />

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
              label="Organization is active"
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
