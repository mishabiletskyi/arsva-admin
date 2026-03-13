import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  getCallLogByIdRequest,
  getCallLogsRequest,
  getTenantsRequest,
} from "../../../api/platform.api";
import { PageHeader } from "../../../components/common/PageHeader";
import { SectionCard } from "../../../components/common/SectionCard";
import { useAuth } from "../../auth/AuthContext";
import type { CallLog, Tenant } from "../../../types/platform";

function FieldRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="subtitle2">{value}</Typography>
    </Box>
  );
}

function getSmsLabel(callLog: CallLog): string {
  if (callLog.sms_status) {
    return callLog.sms_status;
  }

  return callLog.sms_sent ? "sent" : "not_sent";
}

function getSmsTone(callLog: CallLog): "default" | "success" | "warning" | "error" {
  const status = (callLog.sms_status || "").toLowerCase();

  if (callLog.sms_sent || status === "sent" || status === "delivered") {
    return "success";
  }

  if (status.includes("fail") || status.includes("error") || status === "undelivered") {
    return "error";
  }

  if (status) {
    return "warning";
  }

  return "default";
}

export function CallLogsPage() {
  const navigate = useNavigate();
  const {
    scope,
    properties,
    setSelectedProperty,
  } = useAuth();
  const [selectedCallLogId, setSelectedCallLogId] = useState<number | null>(null);

  const tenantsQuery = useQuery({
    queryKey: ["call-log-tenants", scope.organizationId, scope.propertyId],
    queryFn: () =>
      getTenantsRequest({
        organization_id: scope.organizationId ?? undefined,
        property_id: scope.propertyId ?? undefined,
        limit: 100,
      }),
    enabled: scope.organizationId !== null,
  });

  const callLogsQuery = useQuery({
    queryKey: ["call-logs", scope.organizationId, scope.propertyId],
    queryFn: () =>
      getCallLogsRequest({
        organization_id: scope.organizationId ?? undefined,
        property_id: scope.propertyId ?? undefined,
        limit: 100,
      }),
    enabled: scope.organizationId !== null,
    refetchInterval: 15_000,
  });

  const selectedCallLogQuery = useQuery({
    queryKey: ["call-logs", "detail", selectedCallLogId],
    queryFn: () => getCallLogByIdRequest(selectedCallLogId as number),
    enabled: selectedCallLogId !== null,
  });

  const selectedCallLog: CallLog | null =
    selectedCallLogQuery.data ??
    (callLogsQuery.data ?? []).find((item) => item.id === selectedCallLogId) ??
    null;

  const tenantMap = useMemo(
    () =>
      new Map(
        (tenantsQuery.data ?? []).map((tenant: Tenant) => [
          tenant.id,
          [tenant.first_name, tenant.last_name].filter(Boolean).join(" "),
        ])
      ),
    [tenantsQuery.data]
  );

  return (
    <>
      <PageHeader
        title="Call Logs"
        description="Review call activity for the selected property."
        action={
          <Button variant="outlined" onClick={() => void callLogsQuery.refetch()}>
            Refresh
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
                <InputLabel id="call-logs-property-label">Property</InputLabel>
                <Select
                  labelId="call-logs-property-label"
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
          No property selected. Create/select property first to see call logs.
        </Alert>
      ) : null}

      <Alert severity="info" sx={{ mb: 3 }}>
        Call logs are read-only in the admin panel.
      </Alert>

      <SectionCard>
        <Stack spacing={2}>
          <Typography variant="h6">Call log history</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Created</TableCell>
                <TableCell>Tenant</TableCell>
                <TableCell>Outcome</TableCell>
                <TableCell>Script</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>SMS</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(callLogsQuery.data ?? []).map((callLog) => (
                <TableRow key={callLog.id} hover>
                  <TableCell>{new Date(callLog.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    {tenantMap.get(callLog.tenant_id) ?? `Tenant #${callLog.tenant_id}`}
                  </TableCell>
                  <TableCell>{callLog.call_outcome || "N/A"}</TableCell>
                  <TableCell>{callLog.script_version || "N/A"}</TableCell>
                  <TableCell>
                    {callLog.duration_seconds === null
                      ? "N/A"
                      : `${callLog.duration_seconds}s`}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={callLog.opt_out_detected ? "Opt-out detected" : "Normal"}
                      color={callLog.opt_out_detected ? "warning" : "success"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5} alignItems="flex-start">
                      <Chip
                        size="small"
                        label={getSmsLabel(callLog)}
                        color={getSmsTone(callLog)}
                        variant="outlined"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {callLog.sms_sent_at
                          ? new Date(callLog.sms_sent_at).toLocaleString()
                          : "No timestamp"}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => setSelectedCallLogId(callLog.id)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!callLogsQuery.isLoading && (callLogsQuery.data?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Box sx={{ py: 3, textAlign: "center" }}>
                      <Typography color="text.secondary">
                        No call logs found for the selected scope.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Stack>
      </SectionCard>

      <Dialog
        open={selectedCallLogId !== null}
        onClose={() => setSelectedCallLogId(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Call Log Details</DialogTitle>
        <DialogContent dividers>
          {selectedCallLogQuery.isLoading ? (
            <Typography variant="body2" color="text.secondary">
              Loading details...
            </Typography>
          ) : null}
          {selectedCallLog ? (
            <Stack spacing={3}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={3}
                flexWrap="wrap"
              >
                <FieldRow
                  label="Created"
                  value={new Date(selectedCallLog.created_at).toLocaleString()}
                />
                <FieldRow
                  label="Tenant"
                  value={
                    tenantMap.get(selectedCallLog.tenant_id) ??
                    `Tenant #${selectedCallLog.tenant_id}`
                  }
                />
                <FieldRow
                  label="Outcome"
                  value={selectedCallLog.call_outcome || "N/A"}
                />
                <FieldRow
                  label="Script Version"
                  value={selectedCallLog.script_version || "N/A"}
                />
                <FieldRow
                  label="Duration"
                  value={
                    selectedCallLog.duration_seconds === null
                      ? "N/A"
                      : `${selectedCallLog.duration_seconds}s`
                  }
                />
                <FieldRow
                  label="Expected Payment Date"
                  value={selectedCallLog.expected_payment_date || "N/A"}
                />
                <FieldRow
                  label="SMS Sent"
                  value={selectedCallLog.sms_sent ? "Yes" : "No"}
                />
                <FieldRow
                  label="SMS Status"
                  value={selectedCallLog.sms_status || "N/A"}
                />
                <FieldRow
                  label="SMS Sent At"
                  value={
                    selectedCallLog.sms_sent_at
                      ? new Date(selectedCallLog.sms_sent_at).toLocaleString()
                      : "N/A"
                  }
                />
              </Stack>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "flex-start", sm: "center" }}
              >
                <Typography variant="body2" color="text.secondary">
                  Opt-out:
                </Typography>
                <Chip
                  size="small"
                  label={selectedCallLog.opt_out_detected ? "Detected" : "Not detected"}
                  color={selectedCallLog.opt_out_detected ? "warning" : "success"}
                />
              </Stack>

              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  VAPI Call ID
                </Typography>
                <Typography variant="subtitle2">
                  {selectedCallLog.vapi_call_id || "N/A"}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  SMS Message SID
                </Typography>
                <Typography variant="subtitle2">
                  {selectedCallLog.sms_message_sid || "N/A"}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  SMS Error
                </Typography>
                <Typography variant="subtitle2" color="error.main">
                  {selectedCallLog.sms_error_message || "N/A"}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Recording URL
                </Typography>
                {selectedCallLog.recording_url ? (
                  <Link
                    href={selectedCallLog.recording_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {selectedCallLog.recording_url}
                  </Link>
                ) : (
                  <Typography variant="subtitle2">N/A</Typography>
                )}
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Transcript
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "rgba(15, 23, 42, 0.03)",
                    border: "1px solid rgba(15, 23, 42, 0.08)",
                    borderRadius: 2,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  <Typography variant="body2">
                    {selectedCallLog.transcript || "No transcript provided."}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Raw Payload
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 2,
                    overflowX: "auto",
                    bgcolor: "rgba(15, 23, 42, 0.03)",
                    border: "1px solid rgba(15, 23, 42, 0.08)",
                    borderRadius: 2,
                    fontSize: 12,
                  }}
                >
                  {selectedCallLog.raw_payload || "No raw payload provided."}
                </Box>
              </Box>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedCallLogId(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
