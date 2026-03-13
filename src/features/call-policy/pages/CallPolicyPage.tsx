import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Collapse,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCallPolicyRequest,
  updateCallPolicyRequest,
} from "../../../api/platform.api";
import { PageHeader } from "../../../components/common/PageHeader";
import { SectionCard } from "../../../components/common/SectionCard";
import { useAuth } from "../../auth/AuthContext";
import { getApiErrorMessage } from "../../../utils/errors";
import type { CallPolicy, UpdateCallPolicyPayload } from "../../../types/platform";

type PolicyFormState = {
  min_hours_between_calls: string;
  max_calls_7d: string;
  max_calls_30d: string;
  call_window_start: string;
  call_window_end: string;
  days_late_min: string;
  days_late_max: string;
  is_active: boolean;
};

const DEFAULT_POLICY: PolicyFormState = {
  min_hours_between_calls: "72",
  max_calls_7d: "2",
  max_calls_30d: "4",
  call_window_start: "08:00",
  call_window_end: "21:00",
  days_late_min: "3",
  days_late_max: "10",
  is_active: true,
};

const POLICY_PRESETS: Array<{
  key: string;
  label: string;
  description: string;
  values: PolicyFormState;
}> = [
  {
    key: "daily",
    label: "Daily",
    description: "One attempt every day, with higher weekly/monthly caps.",
    values: {
      min_hours_between_calls: "24",
      max_calls_7d: "7",
      max_calls_30d: "30",
      call_window_start: "08:00",
      call_window_end: "21:00",
      days_late_min: "1",
      days_late_max: "30",
      is_active: true,
    },
  },
  {
    key: "balanced",
    label: "Balanced",
    description: "Every 3 days, pilot-friendly setting.",
    values: DEFAULT_POLICY,
  },
  {
    key: "weekly",
    label: "Weekly",
    description: "One attempt per week with conservative caps.",
    values: {
      min_hours_between_calls: "168",
      max_calls_7d: "1",
      max_calls_30d: "4",
      call_window_start: "09:00",
      call_window_end: "20:00",
      days_late_min: "3",
      days_late_max: "30",
      is_active: true,
    },
  },
];

function fromPolicy(policy: CallPolicy): PolicyFormState {
  return {
    min_hours_between_calls: String(policy.min_hours_between_calls),
    max_calls_7d: String(policy.max_calls_7d),
    max_calls_30d: String(policy.max_calls_30d),
    call_window_start: policy.call_window_start,
    call_window_end: policy.call_window_end,
    days_late_min: String(policy.days_late_min),
    days_late_max: String(policy.days_late_max),
    is_active: policy.is_active,
  };
}

function isTimeValue(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function toPayload(
  scopeOrganizationId: number,
  scopePropertyId: number,
  state: PolicyFormState
): UpdateCallPolicyPayload {
  return {
    organization_id: scopeOrganizationId,
    property_id: scopePropertyId,
    min_hours_between_calls: Number(state.min_hours_between_calls),
    max_calls_7d: Number(state.max_calls_7d),
    max_calls_30d: Number(state.max_calls_30d),
    call_window_start: state.call_window_start,
    call_window_end: state.call_window_end,
    days_late_min: Number(state.days_late_min),
    days_late_max: Number(state.days_late_max),
    is_active: state.is_active,
  };
}

export function CallPolicyPage() {
  const queryClient = useQueryClient();
  const { canEditCurrentScope, scope } = useAuth();
  const [formState, setFormState] = useState<PolicyFormState>(DEFAULT_POLICY);
  const [submitError, setSubmitError] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const policyQuery = useQuery({
    queryKey: ["call-policy", scope.organizationId, scope.propertyId],
    queryFn: () =>
      getCallPolicyRequest({
        organization_id: scope.organizationId ?? undefined,
        property_id: scope.propertyId ?? undefined,
      }),
    enabled: scope.organizationId !== null && scope.propertyId !== null,
    retry: false,
  });

  useEffect(() => {
    if (!policyQuery.data) {
      return;
    }

    setFormState(fromPolicy(policyQuery.data));
    setIsHydrated(true);
  }, [policyQuery.data]);

  const hasPolicy404 = useMemo(() => {
    if (!policyQuery.error || !axios.isAxiosError(policyQuery.error)) {
      return false;
    }

    return policyQuery.error.response?.status === 404;
  }, [policyQuery.error]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (scope.organizationId === null || scope.propertyId === null) {
        throw new Error("Select organization and property.");
      }

      const payload = toPayload(scope.organizationId, scope.propertyId, formState);
      return updateCallPolicyRequest(payload);
    },
    onSuccess: async (policy) => {
      setSubmitError("");
      setFormState(fromPolicy(policy));
      setIsHydrated(true);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["call-policy"] }),
        queryClient.invalidateQueries({ queryKey: ["tenant-eligibility"] }),
        queryClient.invalidateQueries({ queryKey: ["outbound", "eligibility"] }),
        queryClient.invalidateQueries({ queryKey: ["outbound", "jobs"] }),
      ]);
    },
    onError: (error) => {
      setSubmitError(getApiErrorMessage(error, "Failed to save call policy."));
    },
  });

  function applyPreset(presetKey: string) {
    const preset = POLICY_PRESETS.find((item) => item.key === presetKey);

    if (!preset) {
      return;
    }

    setFormState(preset.values);
    setSubmitError("");
  }

  function validate(): string | null {
    const minHours = Number(formState.min_hours_between_calls);
    const max7d = Number(formState.max_calls_7d);
    const max30d = Number(formState.max_calls_30d);
    const daysLateMin = Number(formState.days_late_min);
    const daysLateMax = Number(formState.days_late_max);

    if (!Number.isInteger(minHours) || minHours < 1 || minHours > 720) {
      return "Min hours between calls must be an integer between 1 and 720.";
    }

    if (!Number.isInteger(max7d) || max7d < 0 || max7d > 14) {
      return "Max calls (7d) must be an integer between 0 and 14.";
    }

    if (!Number.isInteger(max30d) || max30d < 0 || max30d > 60) {
      return "Max calls (30d) must be an integer between 0 and 60.";
    }

    if (!isTimeValue(formState.call_window_start) || !isTimeValue(formState.call_window_end)) {
      return "Call window times must use HH:MM format.";
    }

    if (!Number.isInteger(daysLateMin) || !Number.isInteger(daysLateMax)) {
      return "Days late values must be integers.";
    }

    if (daysLateMin < 0 || daysLateMax < 0 || daysLateMin > daysLateMax) {
      return "Days late range is invalid.";
    }

    return null;
  }

  function handleSave() {
    const validationError = validate();

    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    void saveMutation.mutateAsync();
  }

  return (
    <>
      <PageHeader
        title="Call Policy"
        description="Set how often and when the assistant can call."
        action={
          <Button variant="outlined" onClick={() => void policyQuery.refetch()}>
            Refresh
          </Button>
        }
      />

      {!scope.propertyId ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Select a property to configure call policy.
        </Alert>
      ) : null}

      {!canEditCurrentScope ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Your role is read-only in this scope. Policy can be viewed, but not edited.
        </Alert>
      ) : null}

      {policyQuery.isError && !hasPolicy404 ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {getApiErrorMessage(policyQuery.error, "Failed to load call policy.")}
        </Alert>
      ) : null}

      {hasPolicy404 ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Policy is not configured yet for this scope. You can use defaults and save.
        </Alert>
      ) : null}

      {submitError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      ) : null}

      <Alert severity="info" sx={{ mb: 3 }}>
        Use presets for quick setup. Open advanced settings only if you need custom limits.
      </Alert>

      <SectionCard>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Presets
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              {POLICY_PRESETS.map((preset) => (
                <Button
                  key={preset.key}
                  variant="outlined"
                  onClick={() => applyPreset(preset.key)}
                  disabled={!canEditCurrentScope}
                >
                  {preset.label}
                </Button>
              ))}
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {POLICY_PRESETS.map((preset) => `${preset.label}: ${preset.description}`).join(" | ")}
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Min hours between calls"
              type="number"
              value={formState.min_hours_between_calls}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  min_hours_between_calls: event.target.value,
                }))
              }
              inputProps={{ min: 1, max: 720, step: 1 }}
              fullWidth
              disabled={!canEditCurrentScope}
            />
            <TextField
              label="Max calls (7 days)"
              type="number"
              value={formState.max_calls_7d}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  max_calls_7d: event.target.value,
                }))
              }
              inputProps={{ min: 0, max: 14, step: 1 }}
              fullWidth
              disabled={!canEditCurrentScope}
            />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Call window start"
              type="time"
              value={formState.call_window_start}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  call_window_start: event.target.value,
                }))
              }
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              disabled={!canEditCurrentScope}
            />
            <TextField
              label="Call window end"
              type="time"
              value={formState.call_window_end}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  call_window_end: event.target.value,
                }))
              }
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              disabled={!canEditCurrentScope}
            />
          </Stack>

          <Box>
            <Button
              variant="text"
              color="inherit"
              onClick={() => setShowAdvancedSettings((currentValue) => !currentValue)}
              disabled={!canEditCurrentScope}
            >
              {showAdvancedSettings ? "Hide advanced settings" : "Show advanced settings"}
            </Button>
          </Box>

          <Collapse in={showAdvancedSettings}>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Max calls (30 days)"
                type="number"
                value={formState.max_calls_30d}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    max_calls_30d: event.target.value,
                  }))
                }
                inputProps={{ min: 0, max: 60, step: 1 }}
                fullWidth
                disabled={!canEditCurrentScope}
              />

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="Days late min"
                  type="number"
                  value={formState.days_late_min}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      days_late_min: event.target.value,
                    }))
                  }
                  fullWidth
                  inputProps={{ min: 0, max: 120, step: 1 }}
                  disabled={!canEditCurrentScope}
                />
                <TextField
                  label="Days late max"
                  type="number"
                  value={formState.days_late_max}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      days_late_max: event.target.value,
                    }))
                  }
                  fullWidth
                  inputProps={{ min: 0, max: 120, step: 1 }}
                  disabled={!canEditCurrentScope}
                />
              </Stack>

              <FormControlLabel
                control={
                  <Switch
                    checked={formState.is_active}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        is_active: event.target.checked,
                      }))
                    }
                  />
                }
                label="Policy active"
                disabled={!canEditCurrentScope}
              />
            </Stack>
          </Collapse>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {isHydrated ? "Loaded from backend policy." : "Using local defaults until policy is loaded."}
            </Typography>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!canEditCurrentScope || !scope.propertyId || saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving..." : "Save policy"}
            </Button>
          </Stack>
        </Stack>
      </SectionCard>
    </>
  );
}
