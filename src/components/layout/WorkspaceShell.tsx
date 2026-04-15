import type { ReactNode } from "react";
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

interface WorkspaceShellProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}

const baseNavigationItems = [
  { label: "Resumen", path: "/home" },
  { label: "Cola", path: "/care-requests" },
];

function getActivePath(pathname: string) {
  if (pathname.startsWith("/care-requests")) {
    return "/care-requests";
  }

  if (pathname.startsWith("/care-request")) {
    return "/care-request";
  }

  if (pathname.startsWith("/admin/nurse-profiles")) {
    return "/admin/nurse-profiles";
  }

  return "/home";
}

export default function WorkspaceShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: WorkspaceShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, logout, roles } = useAuth();
  const navigationItems = [
    ...baseNavigationItems,
    ...(roles.includes("CLIENT") || roles.includes("ADMIN")
      ? [{ label: "Nueva solicitud", path: "/care-request" }]
      : []),
    ...(roles.includes("ADMIN")
      ? [
          { label: "Perfiles de enfermeria", path: "/admin/nurse-profiles" },
          { label: "Administracion", path: "/admin" },
        ]
      : []),
  ];
  const activePath = getActivePath(location.pathname);
  const activeItem =
    navigationItems.find((item) => item.path === activePath) ?? navigationItems[0];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(180, 211, 220, 0.42), transparent 24%), radial-gradient(circle at 86% 14%, rgba(228, 235, 239, 0.72), transparent 18%), linear-gradient(180deg, #f8fbfc 0%, #eef4f5 58%, #eef1ef 100%)",
        py: { xs: 3, md: 4 },
      }}
    >
      <Container maxWidth="xl">
        <Stack direction={{ xs: "column", lg: "row" }} spacing={3} alignItems="flex-start">
          <Paper
            sx={{
              width: { xs: "100%", lg: 280 },
              p: 2.5,
              borderRadius: 4,
              position: "sticky",
              top: 24,
              bgcolor: "rgba(232, 240, 243, 0.82)",
              color: "#36505d",
              overflow: "hidden",
              backdropFilter: "blur(18px)",
            }}
          >
            <Stack spacing={2.5}>
              <Box>
                <Typography
                  variant="overline"
                  sx={{ letterSpacing: "0.22em", color: "#6f94a3" }}
                >
                  NursingCare
                </Typography>
                <Typography variant="h5" sx={{ mt: 1, fontWeight: 700, color: "#36505d" }}>
                  Consola operativa
                </Typography>
                <Typography sx={{ mt: 1, color: "#68808c", lineHeight: 1.7 }}>
                  Gestiona captura, revision clinica y cierre desde un solo espacio de trabajo.
                </Typography>
              </Box>

              <Stack spacing={1}>
                {navigationItems.map((item) => {
                  const active = activePath === item.path;

                  return (
                    <Button
                      key={item.path}
                      fullWidth
                      onClick={() => navigate(item.path)}
                      sx={{
                        justifyContent: "flex-start",
                        px: 1.6,
                        py: 1.2,
                        borderRadius: 999,
                        color: active ? "#36505d" : "#58727f",
                        bgcolor: active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.42)",
                        border: active
                          ? "1px solid rgba(111, 148, 163, 0.18)"
                          : "1px solid rgba(111, 148, 163, 0.1)",
                        "&:hover": {
                          bgcolor: active ? "#ffffff" : "rgba(255,255,255,0.64)",
                        },
                      }}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </Stack>

              <Divider sx={{ borderColor: "rgba(111, 148, 163, 0.12)" }} />

              <Stack spacing={1}>
                <Chip
                  label={email ?? "Sin correo cargado"}
                  sx={{
                    justifyContent: "flex-start",
                    bgcolor: "rgba(255,255,255,0.62)",
                    color: "#45616f",
                    borderRadius: 999,
                    height: 40,
                  }}
                />
                <Chip
                  label={formatRoleLabels(roles)}
                  sx={{
                    justifyContent: "flex-start",
                    bgcolor: "rgba(255,255,255,0.62)",
                    color: "#6f94a3",
                    borderRadius: 999,
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
                  color: "#58727f",
                  borderColor: "rgba(111, 148, 163, 0.2)",
                  "&:hover": {
                    borderColor: "rgba(111, 148, 163, 0.34)",
                    bgcolor: "rgba(255,255,255,0.5)",
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
                p: 1.5,
                borderRadius: 4,
                position: "sticky",
                top: 24,
                zIndex: 5,
                bgcolor: "rgba(251, 253, 254, 0.82)",
                backdropFilter: "blur(18px)",
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.5}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
              >
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Typography
                    variant="overline"
                    sx={{ color: "secondary.main", letterSpacing: "0.16em" }}
                  >
                    Seccion actual
                  </Typography>
                    <Chip
                      label={activeItem.label}
                      sx={{
                      bgcolor: "rgba(111, 148, 163, 0.12)",
                      color: "#557886",
                      fontWeight: 700,
                    }}
                  />
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {navigationItems.map((item) => {
                    const active = activePath === item.path;

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
                  "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(246,250,251,0.98) 100%)",
              }}
            >
              <Stack
                direction={{ xs: "column", xl: "row" }}
                spacing={3}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", xl: "flex-end" }}
              >
                <Box sx={{ maxWidth: 760 }}>
                  <Typography
                    variant="overline"
                    sx={{ color: "secondary.main", letterSpacing: "0.18em" }}
                  >
                    {eyebrow}
                  </Typography>
                  <Typography variant="h2" sx={{ mt: 1.2, maxWidth: 780 }}>
                    {title}
                  </Typography>
                  <Typography
                    sx={{ mt: 1.5, color: "text.secondary", lineHeight: 1.8, maxWidth: 720 }}
                  >
                    {description}
                  </Typography>
                </Box>

                {actions && (
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
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
