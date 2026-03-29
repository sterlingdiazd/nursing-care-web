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
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.25}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nombre@centro.org"
              disabled={isLoading}
              error={email.length > 0 && !isEmailValid}
              helperText={
                email.length > 0 && !isEmailValid
                  ? "Use a valid email format."
                  : "Ingresa el correo asociado a tu cuenta de NursingCare."
              }
            />

            <TextField
              fullWidth
              label="Contrasena"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading}
              helperText="La contrasena se valida contra el backend."
            />

            <Button type="submit" variant="contained" size="large" disabled={!canSubmit}>
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
            >
              Continuar con Google
            </Button>

            <Typography color="text.secondary" sx={{ textAlign: "center" }}>
              ¿Aun no tienes cuenta?{" "}
              <Link component={RouterLink} to="/register" underline="hover" sx={{ fontWeight: 700 }}>
                Crear cuenta
              </Link>
            </Typography>
          </Stack>
        </Box>
      }
    />
  );
}
