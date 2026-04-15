import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon, Mail as MailIcon } from "@mui/icons-material";
import AuthScene from "../components/layout/AuthScene";
import { forgotPassword, validateEmail } from "../api/auth";
import { extractApiErrorMessage } from "../api/errorMessage";
import { authTestIds } from "../testing/authTestIds";

const RESEND_COOLDOWN_SECONDS = 60;

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  useEffect(() => {
    if (cooldownRemaining <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCooldownRemaining((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownRemaining]);

  const requestRecoveryCode = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await forgotPassword(email.trim());
      setIsSuccess(true);
      setCooldownRemaining(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(extractApiErrorMessage(err, "Ocurrió un error al procesar tu solicitud."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError("Por favor ingresa un correo electrónico válido.");
      return;
    }
    await requestRecoveryCode();
  };

  const formContent = (
    <Stack spacing={3.5}>
      {isSuccess ? (
        <Stack spacing={3}>
          <Alert severity="success" sx={{ borderRadius: 2 }} data-testid={authTestIds.forgotPassword.successBanner}>
            Si el correo está registrado, hemos enviado un código de 6 dígitos para restablecer tu contraseña.
          </Alert>
          <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center" }}>
            Revisa tu bandeja de entrada y spam. El código expira en 15 minutos.
          </Typography>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            ¿No recibiste el código? Verifica que el correo esté bien escrito, revisa promociones o spam y espera unos minutos
            antes de solicitar uno nuevo. Si después de varios intentos sigues sin recibirlo, contacta al soporte del sistema.
          </Alert>
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={() => navigate("/reset-password", { state: { email } })}
            data-testid={authTestIds.forgotPassword.enterCodeButton}
            sx={{
              py: 1.6,
              borderRadius: 2.5,
              textTransform: "none",
              fontSize: "1.05rem",
              fontWeight: 600,
            }}
          >
            Ingresar código y nueva contraseña
          </Button>
          <Button
            variant="outlined"
            fullWidth
            size="large"
            onClick={() => {
              void requestRecoveryCode();
            }}
            disabled={isLoading || cooldownRemaining > 0}
            data-testid={authTestIds.forgotPassword.resendButton}
            sx={{
              py: 1.4,
              borderRadius: 2.5,
              textTransform: "none",
              fontSize: "1rem",
              fontWeight: 600,
            }}
          >
            {cooldownRemaining > 0
              ? `Reenviar código en ${formatCountdown(cooldownRemaining)}`
              : "Reenviar código"}
          </Button>
          <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center" }}>
            {cooldownRemaining > 0
              ? `Podrás solicitar otro código en ${formatCountdown(cooldownRemaining)}.`
              : "Si no recibiste el correo, ya puedes solicitar un nuevo código con el mismo correo."}
          </Typography>
        </Stack>
      ) : (
        <form onSubmit={handleSubmit} data-testid={authTestIds.forgotPassword.form}>
          <Stack spacing={3}>
            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }} data-testid={authTestIds.forgotPassword.errorBanner}>
                {error}
              </Alert>
            )}

            <TextField
              label="Correo electrónico"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              inputProps={{ "data-testid": authTestIds.forgotPassword.emailInput }}
              InputProps={{
                startAdornment: (
                  <MailIcon color="action" sx={{ mr: 1, fontSize: 20 }} />
                ),
              }}
              placeholder="ejemplo@correo.com"
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isLoading || !email}
              data-testid={authTestIds.forgotPassword.submitButton}
              sx={{
                py: 1.6,
                borderRadius: 2.5,
                textTransform: "none",
                fontSize: "1.05rem",
                fontWeight: 600,
                boxShadow: "0 4px 12px rgba(34, 95, 145, 0.24)",
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Enviar código de recuperación"
              )}
            </Button>
          </Stack>
        </form>
      )}

      <Box sx={{ textAlign: "center" }}>
        <Link
          to="/login"
          data-testid={authTestIds.forgotPassword.backToLoginLink}
          style={{
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            color: "var(--mui-palette-primary-main)",
            fontWeight: 600,
            fontSize: "0.95rem",
          }}
        >
          <ArrowBackIcon sx={{ mr: 1, fontSize: 18 }} />
          Volver a iniciar sesión
        </Link>
      </Box>
    </Stack>
  );

  return (
    <AuthScene
      eyebrow="Recuperación de cuenta"
      title="¿Olvidaste tu contraseña?"
      subtitle="No te preocupes. Ingresa tu correo y te enviaremos un código para que puedas crear una nueva."
      asideTitle="Proceso seguro"
      asideBody="Utilizamos códigos temporales únicos para garantizar que solo tú puedas cambiar tu acceso. Si no recibes el correo en unos minutos, revisa tu carpeta de spam."
      form={formContent}
    />
  );
}
