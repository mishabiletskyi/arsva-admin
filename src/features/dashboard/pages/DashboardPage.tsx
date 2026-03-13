import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../../../components/common/PageHeader";
import { SectionCard } from "../../../components/common/SectionCard";
import { useAuth } from "../../auth/AuthContext";
import {
  createDashboardTaskRequest,
  deleteDashboardTaskRequest,
  getCallLogsRequest,
  getCsvImportsRequest,
  getDashboardTasksRequest,
  getTenantsRequest,
  updateDashboardTaskRequest,
} from "../../../api/platform.api";
import type { DashboardTaskStatus } from "../../../types/platform";
import { getApiErrorMessage } from "../../../utils/errors";

type Tone = "teal" | "blue" | "amber" | "slate";
type BoardStatus = DashboardTaskStatus;

type BoardTask = {
  id: number;
  title: string;
  note: string;
  status: BoardStatus;
};

function StatCard({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  const gradients = {
    teal: "linear-gradient(135deg, rgba(15,118,110,0.16), rgba(20,184,166,0.04))",
    blue: "linear-gradient(135deg, rgba(37,99,235,0.14), rgba(59,130,246,0.04))",
    amber: "linear-gradient(135deg, rgba(217,119,6,0.14), rgba(245,158,11,0.04))",
    slate: "linear-gradient(135deg, rgba(51,65,85,0.12), rgba(148,163,184,0.04))",
  };

  return (
    <Box
      sx={{
        minWidth: 0,
        p: 2.5,
        borderRadius: 3,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        background: gradients[tone],
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ wordBreak: "break-word", lineHeight: 1.15 }}>
        {value}
      </Typography>
    </Box>
  );
}

function nextStatus(status: BoardStatus): BoardStatus {
  if (status === "pending") {
    return "in_progress";
  }

  if (status === "in_progress") {
    return "done";
  }

  return "done";
}

function previousStatus(status: BoardStatus): BoardStatus {
  if (status === "done") {
    return "in_progress";
  }

  if (status === "in_progress") {
    return "pending";
  }

  return "pending";
}

function columnTitle(status: BoardStatus): string {
  if (status === "pending") {
    return "Pending";
  }

  if (status === "in_progress") {
    return "In Progress";
  }

  return "Done";
}

export function DashboardPage() {
  const queryClient = useQueryClient();
  const { canEditCurrentScope, currentProperty, isScopeLoading, scope, user } = useAuth();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskNote, setNewTaskNote] = useState("");
  const [boardError, setBoardError] = useState("");

  const tenantsQuery = useQuery({
    queryKey: ["dashboard", "tenants", scope.organizationId, scope.propertyId],
    queryFn: () =>
      getTenantsRequest({
        organization_id: scope.organizationId ?? undefined,
        property_id: scope.propertyId ?? undefined,
        limit: 100,
      }),
    enabled: scope.organizationId !== null,
  });

  const callLogsQuery = useQuery({
    queryKey: ["dashboard", "call-logs", scope.organizationId, scope.propertyId],
    queryFn: () =>
      getCallLogsRequest({
        organization_id: scope.organizationId ?? undefined,
        property_id: scope.propertyId ?? undefined,
        limit: 100,
      }),
    enabled: scope.organizationId !== null,
    refetchInterval: 15_000,
  });

  const importsQuery = useQuery({
    queryKey: ["dashboard", "csv-imports", scope.organizationId, scope.propertyId],
    queryFn: () =>
      getCsvImportsRequest({
        organization_id: scope.organizationId ?? undefined,
        property_id: scope.propertyId ?? undefined,
        limit: 100,
      }),
    enabled: scope.organizationId !== null,
  });

  const dashboardTasksQuery = useQuery({
    queryKey: ["dashboard-tasks", scope.organizationId, scope.propertyId],
    queryFn: () =>
      getDashboardTasksRequest({
        organization_id: scope.organizationId ?? undefined,
        property_id: scope.propertyId ?? undefined,
      }),
    enabled: scope.organizationId !== null,
    retry: 1,
  });

  const boardTasks = useMemo<BoardTask[]>(
    () =>
      (dashboardTasksQuery.data ?? []).map((task) => ({
        id: task.id,
        title: task.title,
        note: task.note || "No details added yet.",
        status: task.status,
      })),
    [dashboardTasksQuery.data]
  );

  const createTaskMutation = useMutation({
    mutationFn: (payload: { title: string; note: string }) =>
      createDashboardTaskRequest({
        organization_id: scope.organizationId ?? null,
        property_id: scope.propertyId ?? null,
        title: payload.title,
        note: payload.note || null,
        status: "pending",
      }),
    onSuccess: async () => {
      setBoardError("");
      await queryClient.invalidateQueries({ queryKey: ["dashboard-tasks"] });
    },
    onError: (error) => {
      setBoardError(getApiErrorMessage(error, "Failed to create task."));
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: (payload: { taskId: number; status: BoardStatus }) =>
      updateDashboardTaskRequest(payload.taskId, {
        status: payload.status,
      }),
    onSuccess: async () => {
      setBoardError("");
      await queryClient.invalidateQueries({ queryKey: ["dashboard-tasks"] });
    },
    onError: (error) => {
      setBoardError(getApiErrorMessage(error, "Failed to update task."));
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: number) => deleteDashboardTaskRequest(taskId),
    onSuccess: async () => {
      setBoardError("");
      await queryClient.invalidateQueries({ queryKey: ["dashboard-tasks"] });
    },
    onError: (error) => {
      setBoardError(getApiErrorMessage(error, "Failed to delete task."));
    },
  });

  const tenantCount = tenantsQuery.data?.length ?? 0;
  const callLogCount = callLogsQuery.data?.length ?? 0;
  const importCount = importsQuery.data?.length ?? 0;
  const completedTasks = boardTasks.filter((task) => task.status === "done").length;
  const progress =
    boardTasks.length === 0 ? 0 : Math.round((completedTasks / boardTasks.length) * 100);

  const boardColumns = useMemo(
    () =>
      (["pending", "in_progress", "done"] as BoardStatus[]).map((status) => ({
        status,
        title: columnTitle(status),
        tasks: boardTasks.filter((task) => task.status === status),
      })),
    [boardTasks]
  );

  function handleMoveTask(taskId: number, direction: "back" | "forward") {
    if (!canEditCurrentScope) {
      return;
    }

    const currentTask = boardTasks.find((task) => task.id === taskId);

    if (!currentTask) {
      return;
    }

    void updateTaskMutation.mutateAsync({
      taskId,
      status:
        direction === "back"
          ? previousStatus(currentTask.status)
          : nextStatus(currentTask.status),
    });
  }

  function handleDeleteTask(taskId: number) {
    if (!canEditCurrentScope) {
      return;
    }

    void deleteTaskMutation.mutateAsync(taskId);
  }

  function handleAddTask() {
    if (!canEditCurrentScope) {
      return;
    }

    const trimmedTitle = newTaskTitle.trim();
    const trimmedNote = newTaskNote.trim();

    if (!trimmedTitle) {
      return;
    }

    void createTaskMutation.mutateAsync({
      title: trimmedTitle,
      note: trimmedNote,
    });

    setNewTaskTitle("");
    setNewTaskNote("");
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Overview for ${user?.full_name || user?.email || "current user"}.`}
      />

      {!scope.organizationId && !isScopeLoading ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No organization is available in the current user scope yet.
        </Alert>
      ) : null}

      {dashboardTasksQuery.isError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {getApiErrorMessage(dashboardTasksQuery.error, "Failed to load dashboard tasks.")}
        </Alert>
      ) : null}

      {boardError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {boardError}
        </Alert>
      ) : null}

      {!canEditCurrentScope ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Your role is read-only in this scope. Dashboard tasks are view-only.
        </Alert>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            xl: "repeat(4, minmax(0, 1fr))",
          },
          mb: 3,
        }}
      >
        <StatCard label="Visible Tenants" value={String(tenantCount)} tone="teal" />
        <StatCard label="Visible Call Logs" value={String(callLogCount)} tone="blue" />
        <StatCard label="Visible CSV Imports" value={String(importCount)} tone="amber" />
        <StatCard
          label="Selected Property"
          value={currentProperty?.name ?? "Not selected"}
          tone="slate"
        />
      </Box>

      <SectionCard>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Task Board
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Statuses are synced with backend: pending, in progress, done.
            </Typography>
          </Box>

          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {progress}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 999,
                bgcolor: "rgba(15,23,42,0.08)",
              }}
            />
          </Box>

          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: {
                xs: "1fr",
                lg: "minmax(0, 1fr) minmax(0, 1fr) auto",
              },
              alignItems: "start",
            }}
          >
            <TextField
              label="Task title"
              value={newTaskTitle}
              onChange={(event) => setNewTaskTitle(event.target.value)}
              fullWidth
              disabled={!canEditCurrentScope}
            />
            <TextField
              label="Details"
              value={newTaskNote}
              onChange={(event) => setNewTaskNote(event.target.value)}
              fullWidth
              disabled={!canEditCurrentScope}
            />
            <Button
              variant="contained"
              onClick={handleAddTask}
              disabled={!canEditCurrentScope || createTaskMutation.isPending}
              sx={{ width: { xs: "100%", lg: "auto" }, minWidth: { lg: 130 } }}
            >
              Add task
            </Button>
          </Box>

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" },
            }}
          >
            {boardColumns.map((column) => (
              <Box
                key={column.status}
                sx={{
                  minHeight: 360,
                  p: 2,
                  borderRadius: 3,
                  border: "1px solid rgba(15, 23, 42, 0.08)",
                  bgcolor: "rgba(15, 23, 42, 0.02)",
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 2 }}
                >
                  <Typography variant="h6">{column.title}</Typography>
                  <Chip size="small" label={String(column.tasks.length)} />
                </Stack>

                <Stack spacing={1.5}>
                  {column.tasks.length === 0 ? (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: "1px dashed rgba(15, 23, 42, 0.12)",
                        bgcolor: "rgba(255,255,255,0.45)",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        No tasks in this column.
                      </Typography>
                    </Box>
                  ) : (
                    column.tasks.map((task) => (
                      <Box
                        key={task.id}
                        sx={{
                          p: 1.75,
                          borderRadius: 2,
                          border: "1px solid rgba(15, 23, 42, 0.08)",
                          bgcolor: "background.paper",
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                          {task.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {task.note}
                        </Typography>

                        <Stack
                          direction="row"
                          spacing={0.5}
                          justifyContent="flex-end"
                          sx={{ mt: 1.5 }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => handleMoveTask(task.id, "back")}
                            disabled={
                              !canEditCurrentScope ||
                              task.status === "pending" ||
                              updateTaskMutation.isPending
                            }
                          >
                            <ArrowBackRoundedIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleMoveTask(task.id, "forward")}
                            disabled={
                              !canEditCurrentScope ||
                              task.status === "done" ||
                              updateTaskMutation.isPending
                            }
                          >
                            <ArrowForwardRoundedIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteTask(task.id)}
                            disabled={!canEditCurrentScope || deleteTaskMutation.isPending}
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Box>
                    ))
                  )}
                </Stack>
              </Box>
            ))}
          </Box>
        </Stack>
      </SectionCard>
    </>
  );
}
