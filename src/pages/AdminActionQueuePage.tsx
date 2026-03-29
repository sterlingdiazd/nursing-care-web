import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import {
  getAdminActionItems,
  type AdminActionItem,
  type AdminActionItemSeverity,
  type AdminActionItemState,
} from "../api/adminActionItems";
import { extractApiErrorMessage } from "../api/errorMessage";
import AdminActionItemCard from "../components/admin/AdminActionItemCard";
import AdminMetricCard from "../components/admin/AdminMetricCard";
import AdminPortalShell from "../components/layout/AdminPortalShell";

type SeverityFilter = "all" | AdminActionItemSeverity;
type StateFilter = "all" | AdminActionItemState;

export default function AdminActionQueuePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<AdminActionItem[]>([]);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const severityOptions = useMemo((): Array<{ value: SeverityFilter; label: string }> => [
    { value: "all", label: t("adminActionQueue.filters.severity.all") },
    { value: "High", label: t("adminActionQueue.filters.severity.high") },
    { value: "Medium", label: t("adminActionQueue.filters.severity.medium") },
    { value: "Low", label: t("adminActionQueue.filters.severity.low") },
  ], [t]);

  const stateOptions = useMemo((): Array<{ value: StateFilter; label: string }> => [
    { value: "all", label: t("adminActionQueue.filters.state.all") },
    { value: "Unread", label: t("adminActionQueue.filters.state.unread") },
    { value: "Pending", label: t("adminActionQueue.filters.state.pending") },
  ], [t]);

  const loadItems = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getAdminActionItems();
      setItems(response);
    } catch (nextError) {
      setError(extractApiErrorMessage(nextError, t("adminActionQueue.errors.loadFailed")));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesSeverity = severityFilter === "all" || item.severity === severityFilter;
        const matchesState = stateFilter === "all" || item.state === stateFilter;
        return matchesSeverity && matchesState;
      }),
    [items, severityFilter, stateFilter],
  );

  const summary = useMemo(
    () => ({
      total: items.length,
      unread: items.filter((item) => item.state === "Unread").length,
      pending: items.filter((item) => item.state === "Pending").length,
      high: items.filter((item) => item.severity === "High").length,
    }),
    [items],
  );

  return (
    <AdminPortalShell
      eyebrow={t("adminActionQueue.eyebrow")}
      title={t("adminActionQueue.title")}
      description={t("adminActionQueue.description")}
      actions={
        <>
          <Button variant="outlined" onClick={() => navigate("/admin")}>
            {t("adminActionQueue.actions.back")}
          </Button>
          <Button variant="contained" onClick={() => void loadItems()} disabled={isLoading}>
            {t("adminActionQueue.actions.refresh")}
          </Button>
        </>
      }
    >
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          <AdminMetricCard
            label={t("adminActionQueue.metrics.total")}
            value={summary.total}
          />
          <AdminMetricCard
            label={t("adminActionQueue.metrics.unread")}
            value={summary.unread}
            isSelected={stateFilter === "Unread"}
            onClick={() => setStateFilter(stateFilter === "Unread" ? "all" : "Unread")}
          />
          <AdminMetricCard
            label={t("adminActionQueue.metrics.pending")}
            value={summary.pending}
            isSelected={stateFilter === "Pending"}
            onClick={() => setStateFilter(stateFilter === "Pending" ? "all" : "Pending")}
          />
          <AdminMetricCard
            label={t("adminActionQueue.metrics.high")}
            value={summary.high}
            isSelected={severityFilter === "High"}
            onClick={() => setSeverityFilter(severityFilter === "High" ? "all" : "High")}
          />
        </Box>

        <Paper sx={{ p: 2.5, borderRadius: 3.5 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                {t("adminActionQueue.filters.severityLabel")}
              </Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} sx={{ mt: 1.2 }} flexWrap="wrap">
                {severityOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={severityFilter === option.value ? "contained" : "text"}
                    onClick={() => setSeverityFilter(option.value)}
                    aria-label={`${t("adminActionQueue.filters.severityLabel")} ${option.label.toLowerCase()}`}
                  >
                    {option.label}
                  </Button>
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                {t("adminActionQueue.filters.stateLabel")}
              </Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} sx={{ mt: 1.2 }} flexWrap="wrap">
                {stateOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={stateFilter === option.value ? "contained" : "text"}
                    onClick={() => setStateFilter(option.value)}
                    aria-label={`${t("adminActionQueue.filters.stateLabel")} ${option.label.toLowerCase()}`}
                  >
                    {option.label}
                  </Button>
                ))}
              </Stack>
            </Box>
          </Stack>
        </Paper>

        <Stack spacing={2}>
          {isLoading && Array.from({ length: 4 }).map((_, index) => (
            <Paper key={index} sx={{ p: 3, borderRadius: 3.5 }}>
              <Skeleton variant="text" width="35%" />
              <Skeleton variant="text" width="80%" height={42} />
              <Skeleton variant="rounded" height={74} sx={{ mt: 1.2 }} />
            </Paper>
          ))}

          {!isLoading && filteredItems.length === 0 && (
            <Alert severity="info" variant="outlined">
              {t("adminActionQueue.list.empty")}
            </Alert>
          )}

          {!isLoading && filteredItems.map((item) => (
            <AdminActionItemCard
              key={item.id}
              item={item}
              onOpen={(path) => navigate(path)}
            />
          ))}
        </Stack>
      </Stack>
    </AdminPortalShell>
  );
}
