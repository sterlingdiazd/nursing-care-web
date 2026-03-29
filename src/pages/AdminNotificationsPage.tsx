import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { extractApiErrorMessage } from "../api/errorMessage";
import AdminMetricCard from "../components/admin/AdminMetricCard";
import AdminPortalShell from "../components/layout/AdminPortalShell";
import {
  archiveAdminNotification,
  dismissAdminNotification,
  listAdminNotifications,
  markAdminNotificationAsRead,
  markAdminNotificationAsUnread,
  type AdminNotificationItem,
} from "../api/adminNotifications";

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("es-DO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function AdminNotificationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<AdminNotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const severityLabel = (value: string) => {
    if (value === "High") return t("adminNotifications.list.severity.high");
    if (value === "Medium") return t("adminNotifications.list.severity.medium");
    return t("adminNotifications.list.severity.low");
  };

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listAdminNotifications({ includeArchived, unreadOnly });
      setItems(response);
    } catch (nextError) {
      setError(extractApiErrorMessage(nextError, t("adminNotifications.errors.loadFailed")));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [includeArchived, unreadOnly]);

  const summary = useMemo(() => ({
    total: items.length,
    unread: items.filter((item) => !item.readAtUtc).length,
    high: items.filter((item) => item.severity === "High" && !item.readAtUtc).length,
  }), [items]);

  const handleAction = async (work: () => Promise<void>) => {
    try {
      await work();
      await load();
    } catch (nextError) {
      setError(extractApiErrorMessage(nextError, t("adminNotifications.errors.updateFailed")));
    }
  };

  return (
    <AdminPortalShell
      eyebrow={t("adminNotifications.eyebrow")}
      title={t("adminNotifications.title")}
      description={t("adminNotifications.description")}
      actions={(
        <>
          <Button variant="outlined" onClick={() => navigate("/admin")}>
            {t("adminNotifications.actions.back")}
          </Button>
          <Button variant="contained" onClick={() => void load()} disabled={isLoading}>
            {t("adminNotifications.actions.refresh")}
          </Button>
        </>
      )}
    >
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
          <AdminMetricCard
            label={t("adminNotifications.metrics.total")}
            value={summary.total}
          />
          <AdminMetricCard
            label={t("adminNotifications.metrics.unread")}
            value={summary.unread}
            isSelected={unreadOnly}
            onClick={() => setUnreadOnly((current) => !current)}
          />
          <AdminMetricCard
            label={t("adminNotifications.metrics.unreadHigh")}
            value={summary.high}
          />
        </Box>

        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
            <Button
              variant={unreadOnly ? "contained" : "outlined"}
              onClick={() => setUnreadOnly((current) => !current)}
            >
              {unreadOnly ? t("adminNotifications.actions.unreadOnly") : t("adminNotifications.actions.filterUnread")}
            </Button>
            <Button
              variant={includeArchived ? "contained" : "outlined"}
              onClick={() => setIncludeArchived((current) => !current)}
            >
              {includeArchived ? t("adminNotifications.actions.includingArchived") : t("adminNotifications.actions.showArchived")}
            </Button>
          </Stack>
        </Paper>

        {!isLoading && items.length === 0 && (
          <Alert severity="info" variant="outlined">
            {t("adminNotifications.list.empty")}
          </Alert>
        )}

        <Stack spacing={2}>
          {items.map((item) => (
            <Paper key={item.id} sx={{ p: 2.5, borderRadius: 3 }}>
              <Stack spacing={1.2}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between">
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip
                      label={t("adminNotifications.list.severity.label", { label: severityLabel(item.severity) })}
                      color={item.severity === "High" ? "error" : item.severity === "Medium" ? "warning" : "info"}
                    />
                    <Chip
                      label={item.readAtUtc ? t("adminNotifications.list.readStatus.read") : t("adminNotifications.list.readStatus.unread")}
                      variant={item.readAtUtc ? "outlined" : "filled"}
                    />
                    <Chip label={item.category} variant="outlined" />
                  </Stack>
                  <Typography color="text.secondary">{formatTimestamp(item.createdAtUtc)}</Typography>
                </Stack>

                <Typography variant="h6">{item.title}</Typography>
                <Typography color="text.secondary">{item.body}</Typography>
                {item.source && (
                  <Typography color="text.secondary">
                    {t("adminNotifications.list.source", { source: item.source })}
                  </Typography>
                )}

                <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                  {item.deepLinkPath && (
                    <Button variant="contained" onClick={() => navigate(item.deepLinkPath!)}>
                      {t("adminNotifications.list.openRelated")}
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    onClick={() =>
                      void handleAction(() =>
                        item.readAtUtc
                          ? markAdminNotificationAsUnread(item.id)
                          : markAdminNotificationAsRead(item.id)
                      )
                    }
                  >
                    {item.readAtUtc ? t("adminNotifications.list.markUnread") : t("adminNotifications.list.markRead")}
                  </Button>
                  <Button
                    variant="text"
                    onClick={() => void handleAction(() => dismissAdminNotification(item.id))}
                  >
                    {t("adminNotifications.list.dismiss")}
                  </Button>
                  <Button
                    variant="text"
                    color="inherit"
                    onClick={() => void handleAction(() => archiveAdminNotification(item.id))}
                  >
                    {t("adminNotifications.list.archive")}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Stack>
    </AdminPortalShell>
  );
}
