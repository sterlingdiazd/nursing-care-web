import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";

import WorkspaceShell from "../components/layout/WorkspaceShell";
import { useAuth } from "../context/AuthContext";
import { logClientEvent } from "../logging/clientLogger";
import { UserProfileType } from "../types/auth";
import { formatRoleLabels } from "../utils/roleLabels";

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, email, roles, profileType, requiresAdminReview } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const canOpenBoard = !requiresAdminReview || profileType !== UserProfileType.NURSE;
  const canCreateRequest = true;
  const isAdmin = roles.includes("ADMIN");
  const profileLabel =
    profileType === UserProfileType.NURSE ? "Perfil de enfermeria" : "Perfil de cliente";

  const openBoard = () => {
    logClientEvent("web.ui", "Home quick action opened care request board", {
      roles,
      profileType,
    });
    navigate("/care-requests");
  };

  return (
    <WorkspaceShell
      eyebrow="Resumen operativo"
      title="Un espacio claro para coordinar solicitudes y seguimiento."
      description="La experiencia web se organiza como una consola operativa con resumen, cola en vivo, captura de solicitudes y revision detallada segun el rol."
      actions={
        <>
          {isAdmin && (
            <Button variant="text" onClick={() => navigate("/admin/nurse-profiles")}>
              Completar perfiles
            </Button>
          )}
          <Button variant="outlined" onClick={() => navigate("/care-request")} disabled={!canCreateRequest}>
            Abrir formulario
          </Button>
          <Button variant="contained" onClick={openBoard} disabled={!canOpenBoard}>
            Abrir cola de solicitudes
          </Button>
        </>
      }
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "1.3fr 0.9fr" },
          gap: 3,
        }}
      >
        <Stack spacing={3}>
          {requiresAdminReview && profileType === UserProfileType.NURSE && (
            <Alert severity="info" variant="outlined">
              Tu cuenta de enfermeria ya puede iniciar sesion, pero el acceso operativo sigue bloqueado hasta que administracion complete tu perfil.
            </Alert>
          )}
          <Paper
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 4,
              background:
                "linear-gradient(145deg, rgba(236,244,246,0.98) 0%, rgba(223,235,239,0.98) 58%, rgba(234,241,238,0.96) 100%)",
              color: "#36505d",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                right: -40,
                top: -30,
                width: 180,
                height: 180,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.52)",
              }}
            />
            <Stack spacing={2.5} sx={{ position: "relative" }}>
              <Typography variant="overline" sx={{ letterSpacing: "0.2em", color: "#6f94a3" }}>
                Vista diaria
              </Typography>
              <Typography variant="h3" sx={{ color: "#36505d", maxWidth: 640 }}>
                {canCreateRequest
                  ? "Mueve las solicitudes desde la captura hasta la accion sin perder el hilo operativo."
                  : "Revisa el flujo actual de solicitudes con una vista profesional y consciente del rol."}
              </Typography>
              <Typography sx={{ maxWidth: 620, color: "#64808c", lineHeight: 1.8 }}>
                Usa la cola para revisar estados y luego abre solicitudes individuales para ver
                transiciones, marcas de tiempo y contexto operativo. El formulario sigue
                disponible cuando necesites registrar trabajo nuevo.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                <Chip
                  label={profileLabel}
                  sx={{ bgcolor: "rgba(255,255,255,0.72)", color: "#36505d", borderRadius: 999 }}
                />
                <Chip
                  label={formatRoleLabels(roles)}
                  sx={{ bgcolor: "rgba(255,255,255,0.72)", color: "#62818e", borderRadius: 999 }}
                />
                <Chip
                  label={email ?? "Sin correo cargado"}
                  sx={{ bgcolor: "rgba(255,255,255,0.72)", color: "#62818e", borderRadius: 999 }}
                />
              </Stack>
            </Stack>
          </Paper>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
              gap: 2,
            }}
          >
            {[
              {
                title: "Navegacion estructurada",
                body: "Resumen, cola y formulario viven ahora dentro de una misma interfaz consistente.",
              },
              {
                title: "Flujo guiado por roles",
                body: "Los clientes crean solicitudes, administracion asigna y aprueba, y la enfermeria asignada completa el servicio.",
              },
              {
                title: "Sesion resiliente",
                body: "Las sesiones guardadas se restauran automaticamente y los refresh tokens sostienen revisiones largas.",
              },
            ].map((item) => (
              <Paper
                key={item.title}
                sx={{ p: 3, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.9)" }}
              >
                <Typography variant="h6" sx={{ mb: 1.2 }}>
                  {item.title}
                </Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.75 }}>
                  {item.body}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Stack>

        <Stack spacing={3}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
              Estado
            </Typography>
            <Typography variant="h5" sx={{ mt: 1.1, mb: 2 }}>
              Salud actual del espacio
            </Typography>
            <Stack spacing={1.25}>
              {requiresAdminReview && profileType === UserProfileType.NURSE && (
                <Alert severity="warning" variant="outlined">
                  Mientras administracion no complete tu perfil de enfermeria, el panel solo muestra estado de cuenta y no habilita acciones clinicas.
                </Alert>
              )}
              <Alert severity="success" variant="outlined">
                La autenticacion se restaura desde almacenamiento local
              </Alert>
              <Alert severity="success" variant="outlined">
                Las solicitudes protegidas envian el Bearer token automaticamente
              </Alert>
              <Alert severity="info" variant="outlined">
                La cola y el detalle reflejan directamente las transiciones del ciclo de vida
              </Alert>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3, bgcolor: "#f1f5f2" }}>
            <Typography variant="overline" sx={{ color: "#789588", letterSpacing: "0.16em" }}>
              Flujo recomendado
            </Typography>
            <Stack spacing={1.4} sx={{ mt: 2 }}>
              {[
                "Abre la cola para revisar las solicitudes en vivo.",
                "Usa el formulario desde perfiles de cliente o administracion cuando necesites registrar trabajo nuevo.",
                "Abre el detalle de una solicitud para asignarla, aprobarla, rechazarla o completarla segun el rol.",
              ].map((step) => (
                <Box key={step} sx={{ display: "flex", gap: 1.25 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: "#8db1a0",
                      mt: 0.9,
                      flexShrink: 0,
                    }}
                  />
                  <Typography sx={{ color: "#6d8378", lineHeight: 1.7 }}>{step}</Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </WorkspaceShell>
  );
}
