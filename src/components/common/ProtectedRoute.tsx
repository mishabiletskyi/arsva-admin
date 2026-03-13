import { CircularProgress, Box } from "@mui/material";
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../../features/auth/AuthContext";

type Props = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: Props) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}