import { useState } from "react";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import {
  exportCallLogsCsvRequest,
  exportCsvImportsCsvRequest,
  exportDashboardTasksCsvRequest,
  exportTenantsCsvRequest,
} from "../../../api/platform.api";
import { PageHeader } from "../../../components/common/PageHeader";
import { SectionCard } from "../../../components/common/SectionCard";
import { useAuth } from "../../auth/AuthContext";
import { getApiErrorMessage } from "../../../utils/errors";

type ReportKey = "tenants" | "call-logs" | "csv-imports" | "dashboard-tasks";

function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export function ReportsPage() {
  const { scope } = useAuth();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [downloadError, setDownloadError] = useState("");

  const exportMutation = useMutation({
    mutationFn: async (reportKey: ReportKey) => {
      const params = {
        organization_id: scope.organizationId ?? undefined,
        property_id: scope.propertyId ?? undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      };

      if (reportKey === "tenants") {
        return { key: reportKey, blob: await exportTenantsCsvRequest(params) };
      }

      if (reportKey === "call-logs") {
        return { key: reportKey, blob: await exportCallLogsCsvRequest(params) };
      }

      if (reportKey === "csv-imports") {
        return { key: reportKey, blob: await exportCsvImportsCsvRequest(params) };
      }

      return { key: reportKey, blob: await exportDashboardTasksCsvRequest(params) };
    },
    onSuccess: ({ key, blob }) => {
      setDownloadError("");
      const nowLabel = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `${key}-${nowLabel}.csv`);
    },
    onError: (error) => {
      setDownloadError(getApiErrorMessage(error, "Failed to export CSV report."));
    },
  });

  function runExport(reportKey: ReportKey) {
    void exportMutation.mutateAsync(reportKey);
  }

  return (
    <>
      <PageHeader
        title="Reports"
        description="Export scoped CSV reports for tenants, call logs, imports, and dashboard tasks."
      />

      {downloadError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {downloadError}
        </Alert>
      ) : null}

      <SectionCard>
        <Stack spacing={3}>
          <Typography variant="h6">Export filters</Typography>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField
              label="Date from"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField
              label="Date to"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Scope comes from your account access and active property context. Leave dates empty to export all records in scope.
          </Typography>

          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
            }}
          >
            <Button
              variant="outlined"
              onClick={() => runExport("tenants")}
              disabled={exportMutation.isPending}
            >
              Export tenants.csv
            </Button>
            <Button
              variant="outlined"
              onClick={() => runExport("call-logs")}
              disabled={exportMutation.isPending}
            >
              Export call-logs.csv
            </Button>
            <Button
              variant="outlined"
              onClick={() => runExport("csv-imports")}
              disabled={exportMutation.isPending}
            >
              Export csv-imports.csv
            </Button>
            <Button
              variant="outlined"
              onClick={() => runExport("dashboard-tasks")}
              disabled={exportMutation.isPending}
            >
              Export dashboard-tasks.csv
            </Button>
          </Box>
        </Stack>
      </SectionCard>
    </>
  );
}
