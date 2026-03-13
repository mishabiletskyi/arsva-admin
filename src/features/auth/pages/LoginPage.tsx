import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, registerManager, isAuthenticated } = useAuth();
  const managerSignupEnabled =
    String(import.meta.env.VITE_MANAGER_SIGNUP_ENABLED ?? "true").toLowerCase() === "true";
  const defaultSignupCode = String(import.meta.env.VITE_MANAGER_SIGNUP_CODE ?? "");

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [organizationSlug, setOrganizationSlug] = useState("");
  const [signupCode, setSignupCode] = useState(defaultSignupCode);
  const [errorText, setErrorText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorText("");
    setIsSubmitting(true);

    try {
      if (isRegisterMode) {
        await registerManager({
          email,
          password,
          full_name: fullName.trim() || undefined,
          organization_slug: organizationSlug.trim() || undefined,
          signup_code: signupCode.trim() || undefined,
        });
      } else {
        await login({ email, password });
      }
      navigate("/");
    } catch {
      setErrorText(
        isRegisterMode
          ? "Could not create manager account. Check data and try again."
          : "Invalid email or password"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        px: 2,
        background:
          "radial-gradient(circle at top left, rgba(20,184,166,0.18), transparent 36%), radial-gradient(circle at bottom right, rgba(37,99,235,0.12), transparent 32%), linear-gradient(180deg, #F4FBFA, #F8FAFC)",
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 460,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          borderRadius: 3,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96))",
          backdropFilter: "blur(12px)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" sx={{ mb: 1 }}>
            {isRegisterMode ? "Create manager account" : "Sign in"}
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {isRegisterMode
              ? "Create manager access and continue to ARSVA Admin"
              : "Welcome back to ARSVA Admin"}
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {errorText ? <Alert severity="error">{errorText}</Alert> : null}

              <TextField
                label="Email"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <TextField
                label="Password"
                type="password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {isRegisterMode ? (
                <>
                  <TextField
                    label="Full name (optional)"
                    fullWidth
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                  <TextField
                    label="Organization slug (optional)"
                    fullWidth
                    value={organizationSlug}
                    onChange={(e) => setOrganizationSlug(e.target.value)}
                  />
                  <TextField
                    label="Signup code (optional)"
                    fullWidth
                    value={signupCode}
                    onChange={(e) => setSignupCode(e.target.value)}
                  />
                </>
              ) : null}

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? isRegisterMode
                    ? "Creating account..."
                    : "Signing in..."
                  : isRegisterMode
                    ? "Create account"
                    : "Sign in"}
              </Button>

              {managerSignupEnabled ? (
                <Button
                  type="button"
                  variant="text"
                  color="inherit"
                  onClick={() => {
                    setIsRegisterMode((currentValue) => !currentValue);
                    setErrorText("");
                  }}
                >
                  {isRegisterMode ? "Have account? Sign in" : "No account? Register manager"}
                </Button>
              ) : null}
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
