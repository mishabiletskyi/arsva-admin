import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
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
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdminUserRequest,
  getAdminUserMembershipsRequest,
  getAdminUserPropertyAccessesRequest,
  getAdminUsersRequest,
  getPropertiesRequest,
  updateAdminUserMembershipsRequest,
  updateAdminUserPropertyAccessesRequest,
  updateAdminUserRequest,
} from "../../../api/platform.api";
import { PageHeader } from "../../../components/common/PageHeader";
import { SectionCard } from "../../../components/common/SectionCard";
import { useAuth } from "../../auth/AuthContext";
import type { AppRole } from "../../../types/access";
import type { AdminUser } from "../../../types/platform";
import { getApiErrorMessage } from "../../../utils/errors";
import { useClientPagination } from "../../../utils/useClientPagination";

type MembershipRow = {
  organization_id: number | null;
  role: AppRole;
  is_active: boolean;
};

type AdminUserFormState = {
  email: string;
  full_name: string;
  password: string;
  is_active: boolean;
  is_superuser: boolean;
  memberships: MembershipRow[];
  property_access_ids: number[];
};

const EMPTY_FORM: AdminUserFormState = {
  email: "",
  full_name: "",
  password: "",
  is_active: true,
  is_superuser: false,
  memberships: [],
  property_access_ids: [],
};

const ROLE_OPTIONS: AppRole[] = [
  "platform_owner",
  "org_admin",
  "property_manager",
  "viewer",
];

function formatRoleLabel(role: AppRole): string {
  return role
    .split("_")
    .map((segment) => segment[0].toUpperCase() + segment.slice(1))
    .join(" ");
}

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { canManageAdminUsers, organizations } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formState, setFormState] = useState<AdminUserFormState>(EMPTY_FORM);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccessLoading, setIsAccessLoading] = useState(false);

  const adminUsersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: getAdminUsersRequest,
    enabled: canManageAdminUsers,
  });

  const allPropertiesQuery = useQuery({
    queryKey: ["admin-users", "properties"],
    queryFn: () => getPropertiesRequest({ limit: 250 }),
    enabled: canManageAdminUsers,
  });

  const propertiesByOrganization = useMemo(
    () =>
      new Map(
        organizations.map((organization) => [
          organization.id,
          allPropertiesQuery.data?.filter(
            (property) => property.organization_id === organization.id
          ) ?? [],
        ])
      ),
    [allPropertiesQuery.data, organizations]
  );
  const adminUserRows = Array.isArray(adminUsersQuery.data) ? adminUsersQuery.data : [];
  const {
    page,
    setPage,
    totalPages,
    paginatedItems: paginatedAdminUsers,
  } = useClientPagination(adminUserRows);

  function openCreateDialog() {
    setEditingUser(null);
    setFormState(EMPTY_FORM);
    setSubmitError("");
    setDialogOpen(true);
  }

  async function openEditDialog(adminUser: AdminUser) {
    setEditingUser(adminUser);
    setSubmitError("");
    setDialogOpen(true);
    setIsAccessLoading(true);

    try {
      const [memberships, propertyAccesses] = await Promise.all([
        getAdminUserMembershipsRequest(adminUser.id),
        getAdminUserPropertyAccessesRequest(adminUser.id),
      ]);

      setFormState({
        email: adminUser.email,
        full_name: adminUser.full_name ?? "",
        password: "",
        is_active: adminUser.is_active,
        is_superuser: adminUser.is_superuser,
        memberships: memberships.map((membership) => ({
          organization_id: membership.organization_id,
          role: membership.role,
          is_active: membership.is_active,
        })),
        property_access_ids: propertyAccesses.map((access) => access.property_id),
      });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Failed to load admin user access."));
    } finally {
      setIsAccessLoading(false);
    }
  }

  function addMembershipRow() {
    setFormState((currentState) => ({
      ...currentState,
      memberships: [
        ...currentState.memberships,
        {
          organization_id: organizations[0]?.id ?? null,
          role: "viewer",
          is_active: true,
        },
      ],
    }));
  }

  async function handleSubmit() {
    setSubmitError("");
    setIsSubmitting(true);

    try {
      let adminUserId = editingUser?.id ?? null;

      if (editingUser) {
        await updateAdminUserRequest(editingUser.id, {
          full_name: formState.full_name.trim() || null,
          is_active: formState.is_active,
        });
      } else {
        if (!formState.email.trim() || !formState.password.trim()) {
          throw new Error("Email and password are required for new admin users.");
        }

        const createdUser = await createAdminUserRequest({
          email: formState.email.trim(),
          full_name: formState.full_name.trim() || null,
          password: formState.password,
          is_active: formState.is_active,
          is_superuser: formState.is_superuser,
        });

        adminUserId = createdUser.id;
      }

      if (adminUserId === null) {
        throw new Error("Missing admin user id.");
      }

      await updateAdminUserMembershipsRequest(
        adminUserId,
        formState.memberships
          .filter((membership) => membership.organization_id !== null)
          .map((membership) => ({
            organization_id: membership.organization_id as number,
            role: membership.role,
            is_active: membership.is_active,
          }))
      );

      await updateAdminUserPropertyAccessesRequest(
        adminUserId,
        formState.property_access_ids.map((propertyId) => ({
          property_id: propertyId,
        }))
      );

      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDialogOpen(false);
      setEditingUser(null);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Failed to save admin user."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!canManageAdminUsers) {
    return (
      <>
        <PageHeader
          title="Admin Users"
          description="This module is restricted to platform owners."
        />
        <Alert severity="warning">
          Your current account cannot access admin user management.
        </Alert>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Admin Users"
        description="Manage platform administrators, their memberships, and property-level access without leaving the app."
        action={
          <Button variant="contained" onClick={openCreateDialog}>
            New admin user
          </Button>
        }
      />

      <SectionCard>
        <Stack spacing={2}>
          <Typography variant="h6">Admin users</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Memberships</TableCell>
                <TableCell>Properties</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedAdminUsers.map((adminUser) => (
                <TableRow key={adminUser.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{adminUser.email}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {adminUser.full_name || "No display name"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Chip
                        size="small"
                        label={adminUser.is_active ? "Active" : "Inactive"}
                        color={adminUser.is_active ? "success" : "default"}
                        variant={adminUser.is_active ? "filled" : "outlined"}
                      />
                      {adminUser.is_superuser ? (
                        <Chip size="small" label="Superuser" color="primary" />
                      ) : null}
                    </Stack>
                  </TableCell>
                  <TableCell>{adminUser.memberships?.length ?? 0}</TableCell>
                  <TableCell>{adminUser.property_accesses?.length ?? 0}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => void openEditDialog(adminUser)}>
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!adminUsersQuery.isLoading && adminUserRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Box sx={{ py: 3, textAlign: "center" }}>
                      <Typography color="text.secondary">
                        No admin users found.
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
        onClose={() => !isSubmitting && setDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {editingUser ? "Manage admin user" : "Create admin user"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {submitError ? <Alert severity="error">{submitError}</Alert> : null}

            {isAccessLoading ? (
              <Box sx={{ py: 6, display: "grid", placeItems: "center" }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="Email"
                    value={formState.email}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        email: event.target.value,
                      }))
                    }
                    fullWidth
                    disabled={Boolean(editingUser)}
                  />
                  <TextField
                    label="Full name"
                    value={formState.full_name}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        full_name: event.target.value,
                      }))
                    }
                    fullWidth
                  />
                </Stack>

                {!editingUser ? (
                  <TextField
                    label="Password"
                    type="password"
                    value={formState.password}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        password: event.target.value,
                      }))
                    }
                    fullWidth
                  />
                ) : null}

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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
                    label="Active"
                  />
                  {!editingUser ? (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formState.is_superuser}
                          onChange={(event) =>
                            setFormState((currentState) => ({
                              ...currentState,
                              is_superuser: event.target.checked,
                            }))
                          }
                        />
                      }
                      label="Superuser"
                    />
                  ) : null}
                </Stack>

                <SectionCard>
                  <Stack spacing={2}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={2}
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      justifyContent="space-between"
                    >
                      <Typography variant="h6">Memberships</Typography>
                      <Button variant="outlined" onClick={addMembershipRow}>
                        Add membership
                      </Button>
                    </Stack>

                    {formState.memberships.map((membership, index) => (
                      <Stack
                        key={`${membership.organization_id ?? "new"}-${index}`}
                        direction={{ xs: "column", lg: "row" }}
                        spacing={1.5}
                        alignItems={{ xs: "stretch", lg: "center" }}
                      >
                        <TextField
                          select
                          label="Organization"
                          value={membership.organization_id ?? ""}
                          onChange={(event) =>
                            setFormState((currentState) => {
                              const memberships = [...currentState.memberships];
                              memberships[index] = {
                                ...memberships[index],
                                organization_id: Number(event.target.value),
                              };
                              return { ...currentState, memberships };
                            })
                          }
                          fullWidth
                          SelectProps={{ native: true }}
                        >
                          <option value="" disabled>
                            Select organization
                          </option>
                          {organizations.map((organization) => (
                            <option key={organization.id} value={organization.id}>
                              {organization.name}
                            </option>
                          ))}
                        </TextField>

                        <TextField
                          select
                          label="Role"
                          value={membership.role}
                          onChange={(event) =>
                            setFormState((currentState) => {
                              const memberships = [...currentState.memberships];
                              memberships[index] = {
                                ...memberships[index],
                                role: event.target.value as AppRole,
                              };
                              return { ...currentState, memberships };
                            })
                          }
                          fullWidth
                          SelectProps={{ native: true }}
                        >
                          {ROLE_OPTIONS.map((roleOption) => (
                            <option key={roleOption} value={roleOption}>
                              {formatRoleLabel(roleOption)}
                            </option>
                          ))}
                        </TextField>

                        <FormControlLabel
                          control={
                            <Switch
                              checked={membership.is_active}
                              onChange={(event) =>
                                setFormState((currentState) => {
                                  const memberships = [...currentState.memberships];
                                  memberships[index] = {
                                    ...memberships[index],
                                    is_active: event.target.checked,
                                  };
                                  return { ...currentState, memberships };
                                })
                              }
                            />
                          }
                          label="Active"
                        />

                        <IconButton
                          onClick={() =>
                            setFormState((currentState) => ({
                              ...currentState,
                              memberships: currentState.memberships.filter(
                                (_membership, membershipIndex) =>
                                  membershipIndex !== index
                              ),
                            }))
                          }
                        >
                          <DeleteOutlineRoundedIcon />
                        </IconButton>
                      </Stack>
                    ))}

                    {formState.memberships.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No memberships configured yet.
                      </Typography>
                    ) : null}
                  </Stack>
                </SectionCard>

                <SectionCard>
                  <Stack spacing={2}>
                    <Typography variant="h6">Property Access</Typography>
                    {organizations.map((organization) => {
                      const propertyOptions = propertiesByOrganization.get(organization.id) ?? [];

                      if (propertyOptions.length === 0) {
                        return null;
                      }

                      return (
                        <Box key={organization.id}>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            {organization.name}
                          </Typography>
                          <Stack spacing={1}>
                            {propertyOptions.map((property) => (
                              <FormControlLabel
                                key={property.id}
                                control={
                                  <Checkbox
                                    checked={formState.property_access_ids.includes(property.id)}
                                    onChange={(event) =>
                                      setFormState((currentState) => ({
                                        ...currentState,
                                        property_access_ids: event.target.checked
                                          ? [...currentState.property_access_ids, property.id]
                                          : currentState.property_access_ids.filter(
                                              (propertyId) => propertyId !== property.id
                                            ),
                                      }))
                                    }
                                  />
                                }
                                label={`${property.name} (${property.timezone})`}
                              />
                            ))}
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                </SectionCard>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || isAccessLoading}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
