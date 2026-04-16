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
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";

export interface AdminPortalNavigationItem {
  label: string;
  path: string;
  description: string;
}

export const getAdminNavigationItems = (t: TFunction): AdminPortalNavigationItem[] => [
  {
    label: t('nav.dashboard.label'),
    path: "/admin",
    description: t('nav.dashboard.desc'),
  },
  {
    label: t('nav.actionItems.label'),
    path: "/admin/action-items",
    description: t('nav.actionItems.desc'),
  },
  {
    label: t('nav.careRequests.label'),
    path: "/admin/care-requests",
    description: t('nav.careRequests.desc'),
  },
  {
    label: t('nav.nurseProfiles.label'),
    path: "/admin/nurse-profiles",
    description: t('nav.nurseProfiles.desc'),
  },
  {
    label: t('nav.clients.label'),
    path: "/admin/clients",
    description: t('nav.clients.desc'),
  },
  {
    label: t('nav.users.label'),
    path: "/admin/users",
    description: t('nav.users.desc'),
  },
  {
    label: t('nav.catalog.label'),
    path: "/admin/catalog",
    description: t('nav.catalog.desc'),
  },
  {
    label: t('nav.notifications.label'),
    path: "/admin/notifications",
    description: t('nav.notifications.desc'),
  },
  {
    label: t('nav.auditLogs.label'),
    path: "/admin/audit-logs",
    description: t('nav.auditLogs.desc'),
  },
  {
    label: t('nav.alerts.label'),
    path: "/admin/alerts",
    description: t('nav.alerts.desc'),
  },
  {
    label: t('nav.payroll.label'),
    path: "/admin/payroll",
    description: t('nav.payroll.desc'),
  },
  {
    label: t('nav.shifts.label'),
    path: "/admin/shifts",
    description: t('nav.shifts.desc'),
  },
  {
    label: t('nav.reports.label'),
    path: "/admin/reports",
    description: t('nav.reports.desc'),
  },
  {
    label: t('nav.settings.label'),
    path: "/admin/settings",
    description: t('nav.settings.desc'),
  },
];

function resolveActiveNavigationItem(pathname: string, items: AdminPortalNavigationItem[]) {
  return (
    [...items]
      .sort((left, right) => right.path.length - left.path.length)
      .find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))
    ?? items[0]
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { email, logout, roles } = useAuth();
  const navItems = getAdminNavigationItems(t);
  const activeItem = resolveActiveNavigationItem(location.pathname, navItems);
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
          "radial-gradient(circle at top left, rgba(180, 212, 221, 0.48), transparent 23%), radial-gradient(circle at right center, rgba(231, 236, 239, 0.72), transparent 20%), linear-gradient(180deg, #f8fbfc 0%, #eef4f5 56%, #eef1ef 100%)",
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
              bgcolor: "rgba(232, 240, 243, 0.84)",
              color: "#36505d",
              overflow: "hidden",
              backdropFilter: "blur(18px)",
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
                background: "rgba(255,255,255,0.5)",
              }}
            />

            <Stack spacing={2.5} sx={{ position: "relative" }}>
              <Box>
                <Typography
                  variant="overline"
                  sx={{ letterSpacing: "0.24em", color: "#6f94a3" }}
                >
                  NursingCare
                </Typography>
                <Typography variant="h4" sx={{ mt: 1.1, color: "#36505d" }}>
                  {t('shell.title')}
                </Typography>
                <Typography sx={{ mt: 1.2, color: "#68808c", lineHeight: 1.75 }}>
                  {t('shell.subtitle')}
                </Typography>
              </Box>

              <Stack spacing={1}>
                {navItems.map((item) => {
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
                        borderRadius: 3,
                        textAlign: "left",
                        color: active ? "#36505d" : "#55707d",
                        bgcolor: active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.42)",
                        border: active
                          ? "1px solid rgba(111, 148, 163, 0.18)"
                          : "1px solid rgba(111, 148, 163, 0.1)",
                        "&:hover": {
                          bgcolor: active ? "#ffffff" : "rgba(255,255,255,0.64)",
                        },
                      }}
                    >
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography sx={{ fontWeight: 700 }}> - {item.label} - </Typography>
                          {showUnreadBadge && (
                            <Chip
                              label={unreadNotifications}
                              size="small"
                              sx={{
                                bgcolor: active ? "#6f94a3" : "rgba(111, 148, 163, 0.14)",
                                color: active ? "#ffffff" : "#557886",
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
                            color: active ? "rgba(54, 80, 93, 0.74)" : "#708692",
                          }}
                        >
                          {item.description}
                        </Typography>
                      </Box>
                    </Button>
                  );
                })}
              </Stack>

              <Divider sx={{ borderColor: "rgba(111, 148, 163, 0.12)" }} />

              <Stack spacing={1}>
                <Chip
                  label={email ?? t('shell.noEmail')}
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
                    borderColor: "rgba(111, 148, 163, 0.32)",
                    bgcolor: "rgba(255,255,255,0.48)",
                  },
                }}
              >
                {t('shell.logout')}
              </Button>
            </Stack>
          </Paper>

          <Stack spacing={3} sx={{ flex: 1, minWidth: 0 }}>
            <Paper
              sx={{
                p: { xs: 2, md: 2.4 },
                borderRadius: 4,
                position: "sticky",
                top: 24,
                zIndex: 5,
                bgcolor: "rgba(251, 253, 254, 0.82)",
                backdropFilter: "blur(18px)",
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
                    {t('shell.activeModule')}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Chip
                      label={activeItem.label}
                      sx={{
                        bgcolor: "rgba(111, 148, 163, 0.12)",
                        color: "#557886",
                        fontWeight: 700,
                      }}
                    />
                    <Typography color="text.secondary">{activeItem.description}</Typography>
                  </Stack>
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {navItems.slice(0, 4).map((item) => {
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
                  "linear-gradient(140deg, rgba(255,255,255,0.96) 0%, rgba(246,250,251,0.98) 100%)",
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
