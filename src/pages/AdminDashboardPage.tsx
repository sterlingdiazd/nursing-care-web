import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import { getAdminDashboard, type AdminDashboardSnapshot } from "../api/adminDashboard";
import AdminPortalShell from "../components/layout/AdminPortalShell";

interface DashboardWidget {
  label: string;
  value: number;
  helper: string;
  path: string;
  tone: "warning" | "info" | "success";
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function WidgetCard({
  item,
  onClick,
}: {
  item: DashboardWidget;
  onClick: () => void;
}) {
  const accents = {
    warning: {
      bg: "linear-gradient(145deg, rgba(255,248,235,0.98) 0%, rgba(246,231,202,0.98) 100%)",
      color: "#8a5e22",
      line: "rgba(183, 128, 60, 0.22)",
    },
    info: {
      bg: "linear-gradient(145deg, rgba(240,247,250,0.98) 0%, rgba(223,235,242,0.98) 100%)",
      color: "#214e67",
      line: "rgba(59, 108, 141, 0.18)",
    },
    success: {
      bg: "linear-gradient(145deg, rgba(240,249,246,0.98) 0%, rgba(221,240,234,0.98) 100%)",
      color: "#1f5a49",
      line: "rgba(44, 122, 100, 0.18)",
    },
  }[item.tone];

  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        width: "100%",
        display: "block",
        borderRadius: 4,
        textAlign: "left",
      }}
      aria-label={`Abrir ${item.label}`}
    >
      <Paper
        sx={{
          p: 3,
          borderRadius: 4,
          minHeight: 182,
          background: accents.bg,
          border: `1px solid ${accents.line}`,
          transition: "transform 180ms ease, box-shadow 180ms ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 20px 36px rgba(15, 23, 42, 0.12)",
          },
        }}
      >
        <Stack spacing={2.2}>
          <Typography variant="overline" sx={{ color: accents.color, letterSpacing: "0.16em" }}>
            {item.label}
          </Typography>
          <Typography variant="h2" sx={{ fontSize: { xs: "2.2rem", md: "2.8rem" }, color: "#163042" }}>
            {item.value}
          </Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.75 }}>
            {item.helper}
          </Typography>
          <Chip
            label="Abrir modulo"
            sx={{
              width: "fit-content",
              bgcolor: "rgba(255,255,255,0.56)",
              color: accents.color,
              fontWeight: 700,
            }}
          />
        </Stack>
      </Paper>
    </ButtonBase>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<AdminDashboardSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getAdminDashboard();
      setDashboard(response);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible cargar el panel de administracion.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const widgets = useMemo<DashboardWidget[]>(() => {
    if (!dashboard) {
      return [];
    }

    return [
      {
        label: "Perfiles pendientes de enfermeria",
        value: dashboard.pendingNurseProfilesCount,
        helper: "Perfila la cola administrativa para completar registros clinicos antes de liberar acceso operativo.",
        path: "/admin/nurse-profiles?view=pending",
        tone: "warning",
      },
      {
        label: "Solicitudes esperando asignacion",
        value: dashboard.careRequestsWaitingForAssignmentCount,
        helper: "Identifica casos pendientes de enfermera asignada antes de pasar a aprobacion.",
        path: "/admin/care-requests?view=unassigned",
        tone: "warning",
      },
      {
        label: "Solicitudes listas para aprobacion",
        value: dashboard.careRequestsWaitingForApprovalCount,
        helper: "Reune solicitudes ya asignadas que solo necesitan decision administrativa final.",
        path: "/admin/care-requests?view=pending-approval",
        tone: "info",
      },
      {
        label: "Solicitudes rechazadas hoy",
        value: dashboard.careRequestsRejectedTodayCount,
        helper: "Ofrece una lectura rapida del rechazo reciente para seguimiento comercial u operativo.",
        path: "/admin/care-requests?view=rejected-today",
        tone: "info",
      },
      {
        label: "Solicitudes aprobadas sin cierre",
        value: dashboard.approvedCareRequestsStillIncompleteCount,
        helper: "Mide el trabajo ya autorizado que sigue abierto y requiere acompanamiento.",
        path: "/admin/care-requests?view=approved-incomplete",
        tone: "success",
      },
      {
        label: "Solicitudes atrasadas o estancadas",
        value: dashboard.overdueOrStaleRequestsCount,
        helper: "Marca servicios con fecha vencida o solicitudes pendientes que ya superaron 48 horas sin avance.",
        path: "/admin/care-requests?view=overdue",
        tone: "warning",
      },
      {
        label: "Enfermeras activas",
        value: dashboard.activeNursesCount,
        helper: "Resume la capacidad operativa actualmente disponible para asignacion.",
        path: "/admin/nurse-profiles?view=active",
        tone: "success",
      },
      {
        label: "Clientes activos",
        value: dashboard.activeClientsCount,
        helper: "Anticipa la base atendida desde el portal con acceso futuro al modulo dedicado de clientes.",
        path: "/admin/clients",
        tone: "info",
      },
      {
        label: "Notificaciones administrativas sin leer",
        value: dashboard.unreadAdminNotificationsCount,
        helper: "Prepara el acceso al centro de avisos del portal para la siguiente ampliacion.",
        path: "/admin/notifications",
        tone: "info",
      },
    ];
  }, [dashboard]);

  return (
    <AdminPortalShell
      eyebrow="Centro de control"
      title="El portal administrativo ya tiene un punto de entrada propio y visible."
      description="Esta primera entrega organiza la experiencia administrativa como un espacio separado del trabajo operativo de clientes y enfermeria, con un tablero inicial, modulos ancla y rutas protegidas para administracion."
      actions={
        <>
          <Button variant="outlined" onClick={() => navigate("/admin/nurse-profiles?view=pending")}>
            Revisar perfiles pendientes
          </Button>
          <Button variant="contained" onClick={() => navigate("/admin/care-requests?view=unassigned")}>
            Abrir solicitudes criticas
          </Button>
        </>
      }
    >
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        <Paper
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            background:
              "linear-gradient(145deg, rgba(15,49,69,0.98) 0%, rgba(32,79,104,0.96) 58%, rgba(183,128,60,0.9) 100%)",
            color: "#f8fafc",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              right: -30,
              top: -40,
              width: 190,
              height: 190,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
            }}
          />
          <Stack spacing={2.2} sx={{ position: "relative" }}>
            <Typography variant="overline" sx={{ letterSpacing: "0.2em", color: "#cbe3ee" }}>
              Visibilidad inmediata
            </Typography>
            <Typography variant="h3" sx={{ color: "#fffef8", maxWidth: 760 }}>
              Prioriza perfiles, asignaciones y aprobaciones desde un tablero pensado para escritorio.
            </Typography>
            <Typography sx={{ maxWidth: 760, color: "rgba(235,244,247,0.84)", lineHeight: 1.85 }}>
              Las tarjetas del tablero llevan directo al modulo relevante. La definicion inicial de solicitudes atrasadas o estancadas se basa en servicios con fecha anterior a hoy o solicitudes pendientes sin fecha que ya acumulan mas de 48 horas sin avance.
            </Typography>
            {dashboard?.generatedAtUtc && (
              <Chip
                label={`Actualizado ${formatTimestamp(dashboard.generatedAtUtc)}`}
                sx={{
                  width: "fit-content",
                  bgcolor: "rgba(255,255,255,0.12)",
                  color: "#e2f0f5",
                  borderRadius: 2,
                }}
              />
            )}
          </Stack>
        </Paper>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" },
            gap: 2.2,
          }}
        >
          {isLoading
            ? Array.from({ length: 9 }).map((_, index) => (
                <Paper key={index} sx={{ p: 3, borderRadius: 4, minHeight: 182 }}>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="30%" height={64} sx={{ mt: 1 }} />
                  <Skeleton variant="rounded" height={54} sx={{ mt: 2 }} />
                </Paper>
              ))
            : widgets.map((item) => (
                <WidgetCard
                  key={item.label}
                  item={item}
                  onClick={() => navigate(item.path)}
                />
              ))}
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", xl: "1.2fr 0.8fr" },
            gap: 3,
          }}
        >
          <Paper sx={{ p: 3.5, borderRadius: 4 }}>
            <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
              Alertas de alta severidad
            </Typography>
            <Typography variant="h5" sx={{ mt: 1.2 }}>
              Area preparada para incidentes criticos del negocio
            </Typography>

            <Stack spacing={1.5} sx={{ mt: 2.5 }}>
              {isLoading && <Skeleton variant="rounded" height={110} />}

              {!isLoading && dashboard && dashboard.highSeverityAlerts.length === 0 && (
                <Alert severity="info" variant="outlined">
                  Aun no hay alertas criticas automatizadas. El bloque ya quedo reservado para el centro de alertas del portal.
                </Alert>
              )}

              {!isLoading && dashboard?.highSeverityAlerts.map((alert) => (
                <Paper
                  key={alert.id}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: "rgba(183, 79, 77, 0.06)",
                    border: "1px solid rgba(183, 79, 77, 0.16)",
                  }}
                >
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
                    <Box>
                      <Typography variant="h6">{alert.title}</Typography>
                      <Typography color="text.secondary" sx={{ mt: 0.9, lineHeight: 1.7 }}>
                        {alert.description}
                      </Typography>
                    </Box>
                    <Button variant="outlined" color="error" onClick={() => navigate(alert.modulePath)}>
                      Abrir alerta
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Paper>

          <Paper sx={{ p: 3.5, borderRadius: 4, bgcolor: "#f2ebde" }}>
            <Typography variant="overline" sx={{ color: "#8c6430", letterSpacing: "0.16em" }}>
              Rutas clave
            </Typography>
            <Stack spacing={1.35} sx={{ mt: 2.2 }}>
              {[
                {
                  label: "Solicitudes pendientes de asignacion",
                  path: "/admin/care-requests?view=unassigned",
                },
                {
                  label: "Solicitudes listas para aprobacion",
                  path: "/admin/care-requests?view=pending-approval",
                },
                {
                  label: "Perfiles de enfermeria pendientes",
                  path: "/admin/nurse-profiles?view=pending",
                },
                {
                  label: "Bandeja de alertas",
                  path: "/admin/alerts",
                },
              ].map((item) => (
                <Button
                  key={item.label}
                  variant="text"
                  onClick={() => navigate(item.path)}
                  sx={{
                    justifyContent: "space-between",
                    px: 0,
                    color: "#6b4f2c",
                    fontWeight: 700,
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>
          </Paper>
        </Box>
      </Stack>
    </AdminPortalShell>
  );
}
