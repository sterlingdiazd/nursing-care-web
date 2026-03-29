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

import { getAdminActionItems, type AdminActionItem } from "../api/adminActionItems";
import { getAdminDashboard, type AdminDashboardSnapshot } from "../api/adminDashboard";
import AdminActionItemCard from "../components/admin/AdminActionItemCard";
import AdminPortalShell from "../components/layout/AdminPortalShell";
import { useTranslation } from "react-i18next";

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
            label={item.path ? 'Abrir módulo' : 'Abrir'} // Will translate dynamically soon, using static helper for now or let's pass it from parent.
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<AdminDashboardSnapshot | null>(null);
  const [actionItems, setActionItems] = useState<AdminActionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionQueueError, setActionQueueError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    setActionQueueError(null);

    const [dashboardResult, actionItemsResult] = await Promise.allSettled([
      getAdminDashboard(),
      getAdminActionItems(),
    ]);

    if (dashboardResult.status === "fulfilled") {
      setDashboard(dashboardResult.value);
    } else {
      setDashboard(null);
      setError(
        dashboardResult.reason instanceof Error
          ? dashboardResult.reason.message
          : t('dashboard.loadError'),
      );
    }

    if (actionItemsResult.status === "fulfilled") {
      setActionItems(actionItemsResult.value);
    } else {
      setActionItems([]);
      setActionQueueError(
        actionItemsResult.reason instanceof Error
          ? actionItemsResult.reason.message
          : t('dashboard.queueLoadError'),
      );
    }

    setIsLoading(false);
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
        label: t('dashboard.widgets.pendingNurses.label'),
        value: dashboard.pendingNurseProfilesCount,
        helper: t('dashboard.widgets.pendingNurses.helper'),
        path: "/admin/nurse-profiles?view=pending",
        tone: "warning",
      },
      {
        label: t('dashboard.widgets.waitingAssignment.label'),
        value: dashboard.careRequestsWaitingForAssignmentCount,
        helper: t('dashboard.widgets.waitingAssignment.helper'),
        path: "/admin/care-requests?view=unassigned",
        tone: "warning",
      },
      {
        label: t('dashboard.widgets.readyApproval.label'),
        value: dashboard.careRequestsWaitingForApprovalCount,
        helper: t('dashboard.widgets.readyApproval.helper'),
        path: "/admin/care-requests?view=pending-approval",
        tone: "info",
      },
      {
        label: t('dashboard.widgets.rejectedToday.label'),
        value: dashboard.careRequestsRejectedTodayCount,
        helper: t('dashboard.widgets.rejectedToday.helper'),
        path: "/admin/care-requests?view=rejected-today",
        tone: "info",
      },
      {
        label: t('dashboard.widgets.approvedIncomplete.label'),
        value: dashboard.approvedCareRequestsStillIncompleteCount,
        helper: t('dashboard.widgets.approvedIncomplete.helper'),
        path: "/admin/care-requests?view=approved-incomplete",
        tone: "success",
      },
      {
        label: t('dashboard.widgets.overdueStale.label'),
        value: dashboard.overdueOrStaleRequestsCount,
        helper: t('dashboard.widgets.overdueStale.helper'),
        path: "/admin/care-requests?view=overdue",
        tone: "warning",
      },
      {
        label: t('dashboard.widgets.activeNurses.label'),
        value: dashboard.activeNursesCount,
        helper: t('dashboard.widgets.activeNurses.helper'),
        path: "/admin/nurse-profiles?view=active",
        tone: "success",
      },
      {
        label: t('dashboard.widgets.activeClients.label'),
        value: dashboard.activeClientsCount,
        helper: t('dashboard.widgets.activeClients.helper'),
        path: "/admin/clients",
        tone: "info",
      },
      {
        label: t('dashboard.widgets.unreadNotifications.label'),
        value: dashboard.unreadAdminNotificationsCount,
        helper: t('dashboard.widgets.unreadNotifications.helper'),
        path: "/admin/notifications",
        tone: "info",
      },
    ];
  }, [dashboard, t]);

  return (
    <AdminPortalShell
      eyebrow={t('dashboard.eyebrow')}
      title={t('dashboard.title')}
      description={t('dashboard.desc')}
      actions={
        <>
          <Button variant="outlined" onClick={() => navigate("/admin/action-items")}>
            {t('dashboard.openQueue')}
          </Button>
          <Button variant="contained" onClick={() => navigate("/admin/care-requests?view=unassigned")}>
            {t('dashboard.openCritical')}
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
              {t('dashboard.visibilityTitle')}
            </Typography>
            <Typography variant="h3" sx={{ color: "#fffef8", maxWidth: 760 }}>
              {t('dashboard.visibilityDesc1')}
            </Typography>
            <Typography sx={{ maxWidth: 760, color: "rgba(235,244,247,0.84)", lineHeight: 1.85 }}>
              {t('dashboard.visibilityDesc2')}
            </Typography>
            {dashboard?.generatedAtUtc && (
              <Chip
                label={t('dashboard.updatedAt', { date: formatTimestamp(dashboard.generatedAtUtc) })}
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
            gridTemplateColumns: { xs: "1fr", xl: "1.15fr 0.85fr" },
            gap: 3,
          }}
        >
          <Paper sx={{ p: 3.5, borderRadius: 4 }}>
            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={1.5}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", lg: "center" }}
            >
              <Box>
                <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                  {t('dashboard.actionQueueTitle')}
                </Typography>
                <Typography variant="h5" sx={{ mt: 1.2 }}>
                  {t('dashboard.actionQueueDesc')}
                </Typography>
              </Box>
              <Button variant="outlined" onClick={() => navigate("/admin/action-items")}>
                {t('dashboard.viewFullQueue')}
              </Button>
            </Stack>

            <Stack spacing={1.5} sx={{ mt: 2.5 }}>
              {isLoading && Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} variant="rounded" height={112} />
              ))}

              {!isLoading && actionQueueError && (
                <Alert severity="warning" variant="outlined">
                  {actionQueueError}
                </Alert>
              )}

              {!isLoading && !actionQueueError && actionItems.length === 0 && (
                <Alert severity="info" variant="outlined">
                  {t('dashboard.noActions')}
                </Alert>
              )}

              {!isLoading && !actionQueueError && actionItems.slice(0, 4).map((item) => (
                <AdminActionItemCard
                  key={item.id}
                  item={item}
                  compact
                  onOpen={(path) => navigate(path)}
                />
              ))}
            </Stack>
          </Paper>

          <Stack spacing={3}>
            <Paper sx={{ p: 3.5, borderRadius: 4 }}>
              <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                {t('dashboard.criticalAlertsTitle')}
              </Typography>
              <Typography variant="h5" sx={{ mt: 1.2 }}>
                {t('dashboard.criticalAlertsDesc')}
              </Typography>

              <Stack spacing={1.5} sx={{ mt: 2.5 }}>
                {isLoading && <Skeleton variant="rounded" height={110} />}

                {!isLoading && dashboard && dashboard.highSeverityAlerts.length === 0 && (
                  <Alert severity="info" variant="outlined">
                    {t('dashboard.noAlerts')}
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
                        {t('dashboard.openAlert')}
                      </Button>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Paper>

            <Paper sx={{ p: 3.5, borderRadius: 4, bgcolor: "#f2ebde" }}>
              <Typography variant="overline" sx={{ color: "#8c6430", letterSpacing: "0.16em" }}>
                {t('dashboard.keyRoutes')}
              </Typography>
              <Stack spacing={1.35} sx={{ mt: 2.2 }}>
                {[
                  {
                    label: t('dashboard.routes.queue'),
                    path: "/admin/action-items",
                  },
                  {
                    label: t('dashboard.routes.unassigned'),
                    path: "/admin/care-requests?view=unassigned",
                  },
                  {
                    label: t('dashboard.routes.approval'),
                    path: "/admin/care-requests?view=pending-approval",
                  },
                  {
                    label: t('dashboard.routes.pendingNurses'),
                    path: "/admin/nurse-profiles?view=pending",
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
          </Stack>
        </Box>
      </Stack>
    </AdminPortalShell>
  );
}
