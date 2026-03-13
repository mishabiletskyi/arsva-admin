import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCsvImportsRequest,
  uploadCsvImportRequest,
} from "../../../api/platform.api";
import { PageHeader } from "../../../components/common/PageHeader";
import { SectionCard } from "../../../components/common/SectionCard";
import { useAuth } from "../../auth/AuthContext";
import { getApiErrorMessage } from "../../../utils/errors";
import type { CsvImport, CsvImportRowError } from "../../../types/platform";

function getStatusColor(status: string): "default" | "success" | "warning" | "error" {
  switch (status) {
    case "completed":
      return "success";
    case "completed_with_errors":
    case "processing":
      return "warning";
    case "failed":
      return "error";
    default:
      return "default";
  }
}

function getStatusDescription(status: string): string {
  switch (status) {
    case "completed":
      return "All rows were imported successfully.";
    case "completed_with_errors":
      return "Some rows were imported and some were skipped.";
    case "processing":
      return "The import is still being processed.";
    case "failed":
      return "The import could not be completed.";
    default:
      return "Unknown import status.";
  }
}

function getImportErrors(csvImport: CsvImport): CsvImportRowError[] {
  if (!Array.isArray(csvImport.errors)) {
    return [];
  }

  return csvImport.errors.filter(
    (item): item is CsvImportRowError =>
      typeof item?.row === "number" && typeof item?.message === "string"
  );
}

export function ImportsPage() {
  const queryClient = useQueryClient();
  const {
    scope,
    canEditCurrentScope,
  } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");

  const importsQuery = useQuery({
    queryKey: ["csv-imports", scope.organizationId, scope.propertyId],
    queryFn: () =>
      getCsvImportsRequest({
        organization_id: scope.organizationId ?? undefined,
        property_id: scope.propertyId ?? undefined,
        limit: 100,
      }),
    enabled: scope.organizationId !== null,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || scope.organizationId === null || scope.propertyId === null) {
        throw new Error("Select an organization, property, and CSV file.");
      }

      return uploadCsvImportRequest({
        organization_id: scope.organizationId,
        property_id: scope.propertyId,
        file: selectedFile,
      });
    },
    onSuccess: async () => {
      setSelectedFile(null);
      setUploadError("");
      await queryClient.invalidateQueries({ queryKey: ["csv-imports"] });
    },
    onError: (error) => {
      setUploadError(getApiErrorMessage(error, "CSV upload failed."));
    },
  });

  return (
    <>
      <PageHeader
        title="CSV Imports"
        description="Upload tenant CSV files directly into the selected property and review the scoped import history."
        action={
          <Button variant="outlined" onClick={() => void importsQuery.refetch()}>
            Refresh history
          </Button>
        }
      />

      {!scope.propertyId ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Select a property before uploading a CSV file.
        </Alert>
      ) : null}

      {!canEditCurrentScope ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Your current role is read-only in this scope. Upload is disabled, but import history is still visible.
        </Alert>
      ) : null}

      <Alert severity="info" sx={{ mb: 3 }}>
        Use this page for bulk tenant uploads. If an import finishes with errors, the valid rows are kept and the skipped rows are listed below.
      </Alert>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", xl: "340px minmax(0, 1fr)" },
        }}
      >
        <SectionCard>
          <Stack spacing={2}>
            <Typography variant="h6">Upload CSV</Typography>
            {uploadError ? <Alert severity="error">{uploadError}</Alert> : null}
            <Button variant="outlined" component="label" disabled={!canEditCurrentScope || !scope.propertyId}>
              {selectedFile ? selectedFile.name : "Choose CSV file"}
              <input
                hidden
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setSelectedFile(file);
                }}
              />
            </Button>
            <Typography variant="body2" color="text.secondary">
              Minimum supported columns: <strong>first_name</strong> and <strong>phone_number</strong>.
            </Typography>
            {scope.propertyId ? (
              <Typography variant="body2" color="text.secondary">
                Upload target: the currently selected property in the top scope selector.
              </Typography>
            ) : null}
            <Button
              variant="contained"
              onClick={() => uploadMutation.mutate()}
              disabled={!selectedFile || !canEditCurrentScope || !scope.propertyId || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload CSV"}
            </Button>
          </Stack>
        </SectionCard>

        <SectionCard>
          <Stack spacing={2}>
            <Typography variant="h6">Import history</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>File</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Rows</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(importsQuery.data ?? []).map((csvImport) => (
                  <TableRow key={csvImport.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{csvImport.original_file_name}</Typography>
                      {csvImport.error_message ? (
                        <Typography variant="body2" color="error.main">
                          {csvImport.error_message}
                        </Typography>
                      ) : null}
                      {getImportErrors(csvImport).length > 0 ? (
                        <Stack spacing={0.5} sx={{ mt: 1 }}>
                          {getImportErrors(csvImport).map((errorItem, index) => (
                            <Typography
                              key={`${csvImport.id}-${errorItem.row}-${errorItem.field ?? "general"}-${index}`}
                              variant="body2"
                              color="error.main"
                            >
                              Row {errorItem.row}
                              {errorItem.field ? ` (${errorItem.field})` : ""}: {errorItem.message}
                            </Typography>
                          ))}
                        </Stack>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={csvImport.status}
                        color={getStatusColor(csvImport.status)}
                        variant="outlined"
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                        {getStatusDescription(csvImport.status)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">Total: {csvImport.total_rows}</Typography>
                      <Typography variant="body2">Imported: {csvImport.imported_rows}</Typography>
                      <Typography variant="body2">Failed: {csvImport.failed_rows}</Typography>
                    </TableCell>
                    <TableCell>{new Date(csvImport.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {!importsQuery.isLoading && (importsQuery.data?.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Box sx={{ py: 3, textAlign: "center" }}>
                        <Typography color="text.secondary">
                          No imports found for the selected scope.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </Stack>
        </SectionCard>
      </Box>
    </>
  );
}
