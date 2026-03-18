import React, { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { getGoogleOAuthStartUrl, validateEmail } from "../api/auth";
import AuthScene from "../components/layout/AuthScene";
import { useAuth } from "../context/AuthContext";
import { AuthResponse } from "../types/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, completeOAuthLogin, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isEmailValid = validateEmail(email.trim());
  const canSubmit = email.trim().length > 0 && password.length > 0 && isEmailValid && !isLoading;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!canSubmit) {
      setError("Enter a valid email address and password to continue.");
      return;
    }

    try {
      await login({ email: email.trim(), password });
      navigate("/home");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to sign in.");
    }
  };

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) {
      return;
    }

    const params = new URLSearchParams(hash);
    const oauthStatus = params.get("oauth");
    if (!oauthStatus) {
      return;
    }

    const clearHash = () => {
      window.history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}`);
    };

    if (oauthStatus === "error") {
      setError(params.get("message") || "Error al iniciar sesión con Google. Por favor intenta de nuevo.");
      clearHash();
      return;
    }

    if (oauthStatus !== "success") {
      clearHash();
      return;
    }

    const token = params.get("token");
    const refreshToken = params.get("refreshToken");
    const emailFromRedirect = params.get("email");
    const roles = (params.get("roles") || "")
      .split(",")
      .map((role) => role.trim())
      .filter(Boolean);

    if (!token || !refreshToken || !emailFromRedirect || roles.length === 0) {
      setError("Google sign-in completed but the session payload was incomplete.");
      clearHash();
      return;
    }

    const response: AuthResponse = {
      token,
      refreshToken,
      expiresAtUtc: params.get("expiresAtUtc"),
      email: emailFromRedirect,
      roles,
    };

    completeOAuthLogin(response);
    clearHash();
    navigate("/home", { replace: true });
  }, [completeOAuthLogin, navigate]);

  const handleGoogleSignIn = () => {
    setError(null);
    window.location.assign(getGoogleOAuthStartUrl());
  };

  return (
    <AuthScene
      eyebrow="Secure Access"
      title="Sign in to the care workspace."
      subtitle="Use your approved NursingCare account to manage requests, review status transitions, and continue where you left off."
      asideTitle="Session behavior"
      asideBody="The web client restores your last active session and refreshes access tokens automatically when the backend allows it."
      form={
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.25}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@facility.org"
              disabled={isLoading}
              error={email.length > 0 && !isEmailValid}
              helperText={
                email.length > 0 && !isEmailValid
                  ? "Use a valid email format."
                  : "Enter the email connected to your NursingCare account."
              }
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading}
              helperText="Passwords are validated against the backend."
            />

            <Button type="submit" variant="contained" size="large" disabled={!canSubmit}>
              {isLoading ? (
                <>
                  <CircularProgress size={18} sx={{ mr: 1, color: "inherit" }} />
                  Signing In
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <Divider>or</Divider>

            <Button
              type="button"
              variant="outlined"
              size="large"
              disabled={isLoading}
              onClick={handleGoogleSignIn}
            >
              Sign in with Google
            </Button>

            <Typography color="text.secondary" sx={{ textAlign: "center" }}>
              New here?{" "}
              <Link component={RouterLink} to="/register" underline="hover" sx={{ fontWeight: 700 }}>
                Create an account
              </Link>
            </Typography>
          </Stack>
        </Box>
      }
    />
  );
}
