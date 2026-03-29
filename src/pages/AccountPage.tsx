import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Typography,
} from "@mui/material";
import {
  Google as GoogleIcon,
  Logout as LogoutIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";

import { useAuth } from "../context/AuthContext";
import { logClientEvent } from "../logging/clientLogger";
import { formatRoleLabels } from "../utils/roleLabels";
import { API_BASE_URL } from "../config/env";

export default function AccountPage() {
  const { email, isAuthenticated, logout, roles, token } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleGoogleLogin = () => {
    logClientEvent("web.ui", "Google OAuth started from account page");
    // Google OAuth is handled through the login page
    navigate("/login");
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    logClientEvent("web.ui", "Account page logout initiated");
    try {
      await logout();
      navigate("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const handleRegister = () => {
    navigate("/register");
  };

  return (
    <Box
      sx={{
        maxWidth: 600,
        mx: "auto",
        py: 4,
        px: 2,
      }}
    >
      <Typography
        variant="overline"
        sx={{
          color: "primary.main",
          fontWeight: 700,
          letterSpacing: 1.3,
          display: "block",
          mb: 1,
        }}
      >
        Cuenta
      </Typography>
      <Typography
        variant="h4"
        sx={{
          fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif',
          fontWeight: 700,
          color: "text.primary",
          mb: 1,
        }}
      >
        Gestiona acceso, sesion y cambio de cuenta.
      </Typography>
      <Typography
        variant="body1"
        sx={{
          color: "text.secondary",
          mb: 4,
        }}
      >
        Este espacio se concentra solo en identidad y autenticacion. El diagnostico y las herramientas se movieron a secciones dedicadas.
      </Typography>

      {/* Session Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography
            variant="overline"
            sx={{
              color: "primary.main",
              fontWeight: 700,
              letterSpacing: 1.3,
              display: "block",
              mb: 1,
            }}
          >
            Sesion
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "text.primary",
              mb: 2,
            }}
          >
            {isAuthenticated
              ? "Tu sesion esta activa."
              : "No hay una sesion activa."}
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary", mb: 1 }}>
            {email ?? "No hay correo cargado."}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              Roles:
            </Typography>
            <Chip
              label={formatRoleLabels(roles)}
              size="small"
              sx={{
                backgroundColor: "primary.light",
                color: "white",
                fontWeight: 600,
              }}
            />
          </Box>
          <Typography variant="body1" sx={{ color: "text.secondary", mb: 1 }}>
            Token: {token ? `${token.slice(0, 18)}...` : "Sin token cargado"}
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            API: {API_BASE_URL}
          </Typography>
        </CardContent>
      </Card>

      {/* Access Card */}
      <Card>
        <CardContent>
          <Typography
            variant="overline"
            sx={{
              color: "primary.main",
              fontWeight: 700,
              letterSpacing: 1.3,
              display: "block",
              mb: 1,
            }}
          >
            Acceso
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "text.primary",
              mb: 2,
            }}
          >
            {isAuthenticated
              ? "Cambia o cierra la cuenta actual."
              : "Elige como entrar."}
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary", mb: 3 }}>
            Google sigue siendo el acceso principal. Tambien puedes abrir las pantallas completas de login.
          </Typography>

          <Button
            variant="contained"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            fullWidth
            sx={{
              mb: 2,
              py: 1.5,
              fontWeight: 700,
            }}
          >
            {isAuthenticated ? "Cambiar cuenta con Google" : "Continuar con Google"}
          </Button>

          {!isAuthenticated && (
            <>
              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  o
                </Typography>
              </Divider>
              <Button
                variant="outlined"
                startIcon={<LoginIcon />}
                onClick={handleLogin}
                fullWidth
                sx={{
                  mb: 2,
                  py: 1.5,
                  fontWeight: 700,
                }}
              >
                Iniciar sesion
              </Button>
              <Button
                variant="outlined"
                startIcon={<PersonAddIcon />}
                onClick={handleRegister}
                fullWidth
                sx={{
                  py: 1.5,
                  fontWeight: 700,
                }}
              >
                Registrar
              </Button>
            </>
          )}

          {isAuthenticated && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              disabled={isLoggingOut}
              fullWidth
              sx={{
                mt: 2,
                py: 1.5,
                fontWeight: 700,
              }}
            >
              {isLoggingOut ? "Cerrando sesion..." : "Cerrar sesion"}
            </Button>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
