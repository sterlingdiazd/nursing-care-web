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

interface WorkspaceShellProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}

const navigationItems = [
  { label: "Overview", path: "/home" },
  { label: "Request Board", path: "/care-requests" },
  { label: "New Request", path: "/care-request" },
];

function getActivePath(pathname: string) {
  if (pathname.startsWith("/care-requests")) {
    return "/care-requests";
  }

  if (pathname.startsWith("/care-request")) {
    return "/care-request";
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
  const activePath = getActivePath(location.pathname);
  const activeItem =
    navigationItems.find((item) => item.path === activePath) ?? navigationItems[0];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(33, 88, 124, 0.14), transparent 26%), linear-gradient(180deg, #f7f5ef 0%, #eef2f4 100%)",
        py: { xs: 3, md: 4 },
      }}
    >
      <Container maxWidth="xl">
        <Stack direction={{ xs: "column", lg: "row" }} spacing={3} alignItems="flex-start">
          <Paper
            sx={{
              width: { xs: "100%", lg: 280 },
              p: 2.5,
              borderRadius: 3,
              position: "sticky",
              top: 24,
              bgcolor: "#123047",
              color: "#f8fafc",
              overflow: "hidden",
            }}
          >
            <Stack spacing={2.5}>
              <Box>
                <Typography
                  variant="overline"
                  sx={{ letterSpacing: "0.22em", color: "rgba(214, 234, 248, 0.72)" }}
                >
                  NursingCare
                </Typography>
                <Typography variant="h5" sx={{ mt: 1, fontWeight: 700, color: "#fffef8" }}>
                  Operations Console
                </Typography>
                <Typography sx={{ mt: 1, color: "rgba(232, 241, 247, 0.76)", lineHeight: 1.7 }}>
                  Manage intake, clinical review, and completion from one focused workspace.
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
                        borderRadius: 2,
                        color: active ? "#102a43" : "#eff6ff",
                        bgcolor: active ? "#f6ead7" : "rgba(255,255,255,0.04)",
                        border: active
                          ? "1px solid rgba(246, 234, 215, 0.8)"
                          : "1px solid rgba(255,255,255,0.08)",
                        "&:hover": {
                          bgcolor: active ? "#f3dfc0" : "rgba(255,255,255,0.08)",
                        },
                      }}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </Stack>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />

              <Stack spacing={1}>
                <Chip
                  label={email ?? "No email loaded"}
                  sx={{
                    justifyContent: "flex-start",
                    bgcolor: "rgba(255,255,255,0.08)",
                    color: "#fffef8",
                    borderRadius: 2,
                    height: 40,
                  }}
                />
                <Chip
                  label={roles.join(", ") || "User"}
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
                    borderColor: "rgba(255,255,255,0.46)",
                    bgcolor: "rgba(255,255,255,0.06)",
                  },
                }}
              >
                Sign Out
              </Button>
            </Stack>
          </Paper>

          <Stack spacing={3} sx={{ flex: 1, minWidth: 0 }}>
            <Paper
              sx={{
                p: 1.5,
                borderRadius: 2.5,
                position: "sticky",
                top: 24,
                zIndex: 5,
                bgcolor: "rgba(255, 253, 248, 0.92)",
                backdropFilter: "blur(12px)",
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
                    Current Section
                  </Typography>
                  <Chip
                    label={activeItem.label}
                    sx={{
                      bgcolor: "rgba(183, 128, 60, 0.12)",
                      color: "#7f5724",
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
                borderRadius: 3,
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(252,249,244,0.98) 100%)",
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
