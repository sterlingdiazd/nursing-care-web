import React, { useState } from "react";
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

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError("Por favor ingresa un correo electrónico válido.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await forgotPassword(email);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al procesar tu solicitud.");
    } finally {
      setIsLoading(false);
    }
  };

  const formContent = (
    <Stack spacing={3.5}>
      {isSuccess ? (
        <Stack spacing={3}>
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            Si el correo está registrado, hemos enviado un código de 6 dígitos para restablecer tu contraseña.
          </Alert>
          <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center" }}>
            Revisa tu bandeja de entrada y spam. El código expira en 15 minutos.
          </Typography>
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={() => navigate("/reset-password", { state: { email } })}
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
        </Stack>
      ) : (
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
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
