import React, { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";

import { getGoogleOAuthStartUrl, validateEmail } from "../api/auth";
import AuthScene from "../components/layout/AuthScene";
import { useAuth } from "../context/AuthContext";
import { AuthResponse } from "../types/auth";
import { authTestIds } from "../testing/authTestIds";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, completeOAuthLogin, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEmailValid = validateEmail(email.trim());
  const canSubmit = email.trim().length > 0 && password.length > 0 && isEmailValid && !isLoading;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!canSubmit) {
      setError("Ingresa un correo valido y tu contrasena para continuar.");
      return;
    }

    try {
      await login({ email: email.trim(), password });
      navigate("/home");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible iniciar sesion.");
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

    if (!token || !refreshToken || !emailFromRedirect) {
      setError("El inicio de sesion con Google finalizo, pero la sesion recibida estaba incompleta.");
      clearHash();
      return;
    }

    const response: AuthResponse = {
      token,
      refreshToken,
      expiresAtUtc: params.get("expiresAtUtc"),
      userId: params.get("userId") ?? "",
      email: emailFromRedirect,
      roles,
      requiresProfileCompletion: params.get("requiresProfileCompletion") === "true",
      requiresAdminReview: params.get("requiresAdminReview") === "true",
    };

    completeOAuthLogin(response);
    clearHash();
    navigate(response.requiresProfileCompletion ? "/register" : "/home", { replace: true });
  }, [completeOAuthLogin, navigate]);

  const handleGoogleSignIn = () => {
    setError(null);
    window.location.assign(getGoogleOAuthStartUrl());
  };

  return (
    <AuthScene
      eyebrow="Acceso seguro"
      title="Inicia sesion en el espacio de NursingCare."
      subtitle="Usa tu cuenta aprobada para gestionar solicitudes, revisar transiciones y continuar donde lo dejaste."
      asideTitle="Comportamiento de la sesion"
      asideBody="El cliente web restaura la ultima sesion activa y renueva el token automaticamente cuando el backend lo permite."
      form={
        <Box component="form" onSubmit={handleSubmit} data-testid={authTestIds.login.form}>
          <Stack spacing={2.25}>
            {error && <Alert severity="error" data-testid={authTestIds.login.errorBanner}>{error}</Alert>}

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nombre@centro.org"
              disabled={isLoading}
              error={email.length > 0 && !isEmailValid}
              inputProps={{ "data-testid": authTestIds.login.emailInput }}
              helperText={
                email.length > 0 && !isEmailValid
                  ? "Use a valid email format."
                  : "Ingresa el correo asociado a tu cuenta de NursingCare."
              }
            />

            <TextField
              label="Contrasena"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
              inputProps={{ "data-testid": authTestIds.login.passwordInput }}
              InputProps={{
                startAdornment: (
                  <LockIcon color="action" sx={{ mr: 1, fontSize: 20 }} />
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: -1 }}>
              <Link
                component={RouterLink}
                to="/forgot-password"
                data-testid={authTestIds.login.forgotPasswordLink}
                style={{
                  textDecoration: "none",
                  color: "var(--mui-palette-primary-main)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </Box>

            <Button type="submit" variant="contained" size="large" disabled={!canSubmit} data-testid={authTestIds.login.submitButton}>
              {isLoading ? (
                <>
                  <CircularProgress size={18} sx={{ mr: 1, color: "inherit" }} />
                  Iniciando sesion
                </>
              ) : (
                "Iniciar sesion"
              )}
            </Button>

            <Divider>o</Divider>

            <Button
              type="button"
              variant="outlined"
              size="large"
              disabled={isLoading}
              onClick={handleGoogleSignIn}
              data-testid={authTestIds.login.googleButton}
            >
              Continuar con Google
            </Button>

            <Typography color="text.secondary" sx={{ textAlign: "center" }}>
              ¿Aun no tienes cuenta?{" "}
              <Link component={RouterLink} to="/register" underline="hover" sx={{ fontWeight: 700 }} data-testid={authTestIds.login.registerLink}>
                Crear cuenta
              </Link>
            </Typography>
          </Stack>
        </Box>
      }
    />
  );
}
