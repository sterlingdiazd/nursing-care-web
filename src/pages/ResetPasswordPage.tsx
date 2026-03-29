import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Password as PasswordIcon,
} from "@mui/icons-material";
import AuthScene from "../components/layout/AuthScene";
import { resetPassword, validateEmail, validatePassword } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { applyAuthResponse } = useAuth();
  
  const [email, setEmail] = useState(state?.email || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setError("Por favor ingresa un correo electrónico válido.");
      return;
    }
    
    if (!code || code.length < 6) {
      setError("Por favor ingresa el código de 6 dígitos.");
      return;
    }

    const passValidation = validatePassword(newPassword);
    if (!passValidation.isValid) {
      setError(passValidation.message);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await resetPassword(email, code, newPassword);
      applyAuthResponse(response);
      setSuccess(true);

      // Determine the correct destination based on returned roles
      const isAdmin = response.roles.includes("ADMIN");
      const destination = isAdmin ? "/admin" : "/home";

      // Brief delay so the user sees the success message, then redirect
      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 2000);

    } catch (err: any) {
      setError(err.message || "Ocurrió un error al restablecer tu contraseña.");
    } finally {
      setIsLoading(false);
    }
  };

  const formContent = (
    <Stack spacing={3.5}>
      {success ? (
        <Stack spacing={3} alignItems="center">
          <Alert severity="success" sx={{ borderRadius: 2, width: '100%' }}>
            Tu contraseña ha sido restablecida exitosamente. Iniciando sesión...
          </Alert>
          <CircularProgress size={24} sx={{ mt: 2 }} />
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
              disabled={isLoading || !!state?.email}
              placeholder="ejemplo@correo.com"
            />

            <TextField
              label="Código de verificación"
              variant="outlined"
              fullWidth
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <PasswordIcon color="action" sx={{ mr: 1, fontSize: 20 }} />
                ),
              }}
              placeholder="123456"
              helperText="El código de 6 dígitos que recibiste por correo."
            />

            <TextField
              label="Nueva contraseña"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              fullWidth
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
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
              placeholder="Min. 6 caracteres"
            />

            <TextField
              label="Confirmar nueva contraseña"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <LockIcon color="action" sx={{ mr: 1, fontSize: 20 }} />
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isLoading || !code || !newPassword}
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
                "Restablecer Contraseña"
              )}
            </Button>
          </Stack>
        </form>
      )}

      <Box sx={{ textAlign: "center" }}>
        <Link
          to="/forgot-password"
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
          Volver a solicitar código
        </Link>
      </Box>
    </Stack>
  );

  return (
    <AuthScene
      eyebrow="Crear nueva clave"
      title="Restablecer tu acceso"
      subtitle="Ingresa el código que recibiste y define tu nueva contraseña segura."
      asideTitle="Sugerencias de seguridad"
      asideBody="Utiliza una combinación de letras, números y símbolos. Una contraseña robusta es la mejor manera de proteger tu información personal y financiera."
      form={formContent}
    />
  );
}
