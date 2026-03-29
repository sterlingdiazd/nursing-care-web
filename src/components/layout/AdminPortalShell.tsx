import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { useAuth } from "../../context/AuthContext";
import { formatRoleLabels } from "../../utils/roleLabels";
import { getAdminNotificationSummary } from "../../api/adminNotifications";

export interface AdminPortalNavigationItem {
  label: string;
  path: string;
  description: string;
}

export const adminPortalNavigationItems: AdminPortalNavigationItem[] = [
  {
    label: "Panel principal",
    path: "/admin",
    description: "Vista ejecutiva y prioridades",
  },
  {
    label: "Acciones",
    path: "/admin/action-items",
    description: "Cola prioritaria y seguimiento",
  },
  {
    label: "Solicitudes",
    path: "/admin/care-requests",
    description: "Asignacion, aprobacion y riesgo operativo",
  },
  {
    label: "Enfermeria",
    path: "/admin/nurse-profiles",
    description: "Perfiles pendientes y fuerza activa",
  },
  {
    label: "Clientes",
    path: "/admin/clients",
    description: "Base activa y contexto comercial",
  },
  {
    label: "Usuarios y acceso",
    path: "/admin/users",
    description: "Gobernanza y permisos",
  },
  {
    label: "Catalogo y precios",
    path: "/admin/catalog",
    description: "Parametros de tarifas y listas controladas",
  },
  {
    label: "Notificaciones",
    path: "/admin/notifications",
    description: "Centro de avisos administrativos",
  },
  {
    label: "Auditoria",
    path: "/admin/audit-logs",
    description: "Registro de acciones sensibles",
  },
  {
    label: "Alertas",
    path: "/admin/alerts",
    description: "Eventos criticos de alto impacto",
  },
  {
    label: "Reportes",
    path: "/admin/reports",
    description: "Indicadores operativos y exportacion de datos",
  },
  {
    label: "Configuracion",
    path: "/admin/settings",
    description: "Parametros del portal",
  },
];

function resolveActiveNavigationItem(pathname: string) {
  return (
    [...adminPortalNavigationItems]
      .sort((left, right) => right.path.length - left.path.length)
      .find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))
    ?? adminPortalNavigationItems[0]
  );
}

interface AdminPortalShellProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function AdminPortalShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: AdminPortalShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, logout, roles } = useAuth();
  const activeItem = resolveActiveNavigationItem(location.pathname);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    let disposed = false;

    const loadSummary = async () => {
      try {
        const summary = await getAdminNotificationSummary();
        if (!disposed) {
          setUnreadNotifications(summary.unread);
        }
      } catch {
        if (!disposed) {
          setUnreadNotifications(0);
        }
      }
    };

    void loadSummary();
    const pollTimer = window.setInterval(() => void loadSummary(), 30000);

    return () => {
      disposed = true;
      window.clearInterval(pollTimer);
    };
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(19, 71, 93, 0.24), transparent 24%), radial-gradient(circle at right center, rgba(183, 128, 60, 0.14), transparent 22%), linear-gradient(180deg, #f3efe5 0%, #e9eef1 100%)",
        py: { xs: 3, md: 4 },
      }}
    >
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 4 } }}>
        <Stack direction={{ xs: "column", xl: "row" }} spacing={3} alignItems="flex-start">
          <Paper
            sx={{
              width: { xs: "100%", xl: 310 },
              p: 3,
              borderRadius: 4,
              position: "sticky",
              top: 24,
              bgcolor: "#0f3145",
              color: "#f9fafb",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                right: -70,
                top: -70,
                width: 180,
                height: 180,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.06)",
              }}
            />

            <Stack spacing={2.5} sx={{ position: "relative" }}>
              <Box>
                <Typography
                  variant="overline"
                  sx={{ letterSpacing: "0.24em", color: "rgba(214, 234, 248, 0.72)" }}
                >
                  NursingCare
                </Typography>
                <Typography variant="h4" sx={{ mt: 1.1, color: "#fffdf8" }}>
                  Portal de administracion
                </Typography>
                <Typography sx={{ mt: 1.2, color: "rgba(232, 241, 247, 0.76)", lineHeight: 1.75 }}>
                  Controla prioridades, aprobaciones y carga operativa desde una consola separada del trabajo clinico diario.
                </Typography>
              </Box>

              <Stack spacing={1}>
                {adminPortalNavigationItems.map((item) => {
                  const active = item.path === activeItem.path;

                  const showUnreadBadge = item.path === "/admin/notifications" && unreadNotifications > 0;

                  return (
                    <Button
                      key={item.path}
                      fullWidth
                      onClick={() => navigate(item.path)}
                      sx={{
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                        px: 1.6,
                        py: 1.35,
                        borderRadius: 2.5,
                        textAlign: "left",
                        color: active ? "#112c3f" : "#f8fafc",
                        bgcolor: active ? "#f6ead7" : "rgba(255,255,255,0.05)",
                        border: active
                          ? "1px solid rgba(246, 234, 215, 0.92)"
                          : "1px solid rgba(255,255,255,0.08)",
                        "&:hover": {
                          bgcolor: active ? "#f3dfc0" : "rgba(255,255,255,0.09)",
                        },
                      }}
                    >
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography sx={{ fontWeight: 700 }}>{item.label}</Typography>
                          {showUnreadBadge && (
                            <Chip
                              label={unreadNotifications}
                              size="small"
                              sx={{
                                bgcolor: active ? "#112c3f" : "#f6ead7",
                                color: active ? "#f7ead5" : "#112c3f",
                                fontWeight: 700,
                              }}
                            />
                          )}
                        </Stack>
                        <Typography
                          sx={{
                            mt: 0.35,
                            fontSize: "0.82rem",
                            lineHeight: 1.55,
                            color: active ? "rgba(17, 44, 63, 0.76)" : "rgba(232, 241, 247, 0.72)",
                          }}
                        >
                          {item.description}
                        </Typography>
                      </Box>
                    </Button>
                  );
                })}
              </Stack>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />

              <Stack spacing={1}>
                <Chip
                  label={email ?? "Sin correo cargado"}
                  sx={{
                    justifyContent: "flex-start",
                    bgcolor: "rgba(255,255,255,0.08)",
                    color: "#fffef8",
                    borderRadius: 2,
                    height: 40,
                  }}
                />
                <Chip
                  label={formatRoleLabels(roles)}
                  sx={{
                    justifyContent: "flex-start",
                    bgcolor: "rgba(255,255,255,0.08)",
                    color: "#dbeafe",
                    borderRadius: 2,
                    height: 40,
                  }}
                />
              </Stack>

              <Button
                variant="outlined"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                sx={{
                  color: "#fffef8",
                  borderColor: "rgba(255,255,255,0.24)",
                  "&:hover": {
                    borderColor: "rgba(255,255,255,0.42)",
                    bgcolor: "rgba(255,255,255,0.06)",
                  },
                }}
              >
                Cerrar sesion
              </Button>
            </Stack>
          </Paper>

          <Stack spacing={3} sx={{ flex: 1, minWidth: 0 }}>
            <Paper
              sx={{
                p: { xs: 2, md: 2.4 },
                borderRadius: 3,
                position: "sticky",
                top: 24,
                zIndex: 5,
                bgcolor: "rgba(255, 253, 248, 0.92)",
                backdropFilter: "blur(12px)",
              }}
            >
              <Stack
                direction={{ xs: "column", lg: "row" }}
                spacing={1.5}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", lg: "center" }}
              >
                <Stack spacing={0.9}>
                  <Typography
                    variant="overline"
                    sx={{ color: "secondary.main", letterSpacing: "0.18em" }}
                  >
                    Modulo activo
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Chip
                      label={activeItem.label}
                      sx={{
                        bgcolor: "rgba(183, 128, 60, 0.12)",
                        color: "#7f5724",
                        fontWeight: 700,
                      }}
                    />
                    <Typography color="text.secondary">{activeItem.description}</Typography>
                  </Stack>
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {adminPortalNavigationItems.slice(0, 4).map((item) => {
                    const active = item.path === activeItem.path;

                    return (
                      <Button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        variant={active ? "contained" : "text"}
                        color={active ? "primary" : "inherit"}
                        sx={{
                          minWidth: 0,
                          px: 1.4,
                          color: active ? undefined : "text.secondary",
                        }}
                      >
                        {item.label}
                      </Button>
                    );
                  })}
                </Stack>
              </Stack>
            </Paper>

            <Paper
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 4,
                background:
                  "linear-gradient(140deg, rgba(255,255,255,0.95) 0%, rgba(251,247,240,0.98) 100%)",
              }}
            >
              <Stack
                direction={{ xs: "column", xl: "row" }}
                spacing={3}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", xl: "flex-end" }}
              >
                <Box sx={{ maxWidth: 820 }}>
                  <Typography
                    variant="overline"
                    sx={{ color: "secondary.main", letterSpacing: "0.2em" }}
                  >
                    {eyebrow}
                  </Typography>
                  <Typography variant="h2" sx={{ mt: 1.1, fontSize: { xs: "2.2rem", md: "3.3rem" } }}>
                    {title}
                  </Typography>
                  <Typography sx={{ mt: 1.6, color: "text.secondary", lineHeight: 1.85, maxWidth: 760 }}>
                    {description}
                  </Typography>
                </Box>

                {actions && (
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} flexWrap="wrap">
                    {actions}
                  </Stack>
                )}
              </Stack>
            </Paper>

            {children}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
