import React, { useMemo, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Link,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { getGoogleOAuthStartUrl, validateEmail, validatePassword } from "../api/auth";
import AuthScene from "../components/layout/AuthScene";
import { useAuth } from "../context/AuthContext";
import { RegisterRequest, UserProfileType } from "../types/auth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileType, setProfileType] = useState<UserProfileType>(UserProfileType.Client);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const passwordValidation = useMemo(() => validatePassword(password), [password]);
  const isEmailValid = validateEmail(email.trim());
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const canSubmit =
    !isLoading &&
    email.trim().length > 0 &&
    password.length > 0 &&
    confirmPassword.length > 0 &&
    isEmailValid &&
    passwordValidation.isValid &&
    passwordsMatch;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!canSubmit) {
      setError("Completa los campos requeridos y corrige las validaciones antes de enviar.");
      return;
    }

    try {
      const payload: RegisterRequest = {
        email: email.trim(),
        password,
        confirmPassword,
        profileType,
      };

      await register(payload);
      setSuccessMessage(
        profileType === UserProfileType.Nurse
          ? "Registro enviado. Las cuentas de enfermeria permanecen pendientes hasta que administracion active el acceso."
          : "Registro completado. Tu cuenta ya puede iniciar sesion."
      );
      navigate("/login");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible registrarte.");
    }
  };

  const handleGoogleSignIn = () => {
    setError(null);
    setSuccessMessage(null);
    window.location.assign(getGoogleOAuthStartUrl());
  };

  return (
    <AuthScene
      eyebrow="Crear acceso"
      title="Registra tu cuenta de NursingCare."
      subtitle="Elige el rol que corresponde a tu uso del sistema. Las cuentas de cliente se activan de inmediato; las de enfermeria esperan aprobacion administrativa."
      asideTitle="Flujo de aprobacion"
      asideBody="Las cuentas de enfermeria requieren activacion administrativa para revisar el acceso clinico antes de permitir el inicio de sesion."
      form={
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.25}>
            {error && <Alert severity="error">{error}</Alert>}
            {successMessage && <Alert severity="success">{successMessage}</Alert>}

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
                  : "Este correo sera tu usuario para futuros inicios de sesion."
              }
            />

            <TextField
              fullWidth
              label="Contrasena"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading}
              error={password.length > 0 && !passwordValidation.isValid}
              helperText={password.length > 0 ? passwordValidation.message : "Minimo 6 caracteres"}
            />

            <TextField
              fullWidth
              label="Confirmar contrasena"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={isLoading}
              error={confirmPassword.length > 0 && !passwordsMatch}
              helperText={
                confirmPassword.length > 0 && !passwordsMatch
                  ? "Las contrasenas deben coincidir."
                  : "Repite la contrasena exactamente igual."
              }
            />

            <FormControl>
              <FormLabel sx={{ mb: 1, color: "text.primary" }}>Registrarse como</FormLabel>
              <RadioGroup
                value={String(profileType)}
                onChange={(event) =>
                  setProfileType(Number(event.target.value) as UserProfileType)
                }
              >
                <PaperOption
                  value={String(UserProfileType.Client)}
                  control={<Radio />}
                  label="Cliente"
                  description="Acceso inmediato despues del registro."
                />
                <PaperOption
                  value={String(UserProfileType.Nurse)}
                  control={<Radio />}
                  label="Enfermeria"
                  description="Requiere aprobacion administrativa antes de iniciar sesion."
                />
              </RadioGroup>
            </FormControl>

            <Button type="submit" variant="contained" size="large" disabled={!canSubmit}>
              {isLoading ? (
                <>
                  <CircularProgress size={18} sx={{ mr: 1, color: "inherit" }} />
                  Creando cuenta
                </>
              ) : (
                "Crear cuenta"
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

            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
              El acceso con Google crea una cuenta de cliente activa inmediatamente.
            </Typography>

            <Typography color="text.secondary" sx={{ textAlign: "center" }}>
              ¿Ya tienes acceso?{" "}
              <Link component={RouterLink} to="/login" underline="hover" sx={{ fontWeight: 700 }}>
                Inicia sesion aqui
              </Link>
            </Typography>
          </Stack>
        </Box>
      }
    />
  );
}

function PaperOption({
  value,
  control,
  label,
  description,
}: {
  value: string;
  control: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <Box
      sx={{
        mb: 1.25,
        borderRadius: 4,
        border: "1px solid rgba(23, 48, 66, 0.08)",
        bgcolor: "rgba(255,255,255,0.62)",
        px: 1.5,
        py: 1.2,
      }}
    >
      <FormControlLabel
        value={value}
        control={control}
        label={
          <Box>
            <Typography sx={{ fontWeight: 700 }}>{label}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
              {description}
            </Typography>
          </Box>
        }
        sx={{ alignItems: "flex-start", m: 0, width: "100%" }}
      />
    </Box>
  );
}
