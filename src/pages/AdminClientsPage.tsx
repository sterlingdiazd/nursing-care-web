import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  getAdminClients,
  type AdminClientListItem,
  type AdminClientListParams,
  type AdminClientListStatus,
} from "../api/adminClients";
import { extractApiErrorMessage } from "../api/errorMessage";
import AdminMetricCard from "../components/admin/AdminMetricCard";
import AdminPortalShell from "../components/layout/AdminPortalShell";
import { useAdminTableFilters, type FilterState } from "../hooks/useAdminTableFilters";
import {
  formatAdminClientCareRequestCount,
  formatAdminClientDateTime,
  formatAdminClientStatusLabel,
  getAdminClientStatusStyles,
} from "../utils/adminClients";

type StatusFilter = "all" | AdminClientListStatus;

interface AdminClientFilters extends FilterState {
  status: StatusFilter;
}

export default function AdminClientsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    filters,
    navigateWithFilters,
    clearFilters,
  } = useAdminTableFilters<AdminClientFilters>({
    path: "/admin/clients",
    defaultView: "all",
    defaultSort: "newest",
    availableViews: ["all"],
  });

  const [searchInput, setSearchInput] = useState(filters.searchText);
  const [items, setItems] = useState<AdminClientListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSearchInput(filters.searchText);
  }, [filters.searchText]);

  const requestParams = useMemo<AdminClientListParams>(() => ({
    search: filters.searchText || undefined,
    status: filters.status === "all" ? undefined : filters.status,
  }), [filters]);

  const loadItems = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getAdminClients(requestParams);
      setItems(response);
    } catch (nextError) {
      setError(extractApiErrorMessage(nextError, t("adminClients.errors.loadFailed")));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, [requestParams]);

  const summary = useMemo(() => ({
    total: items.length,
    active: items.filter((item) => item.isActive).length,
    inactive: items.filter((item) => !item.isActive).length,
    withHistory: items.filter((item) => item.ownedCareRequestsCount > 0).length,
  }), [items]);

  return (
    <AdminPortalShell
      eyebrow={t("adminClients.eyebrow")}
      title={t("adminClients.title")}
      description={t("adminClients.description")}
      actions={(
        <>
          <Button variant="contained" onClick={() => navigate("/admin/clients/new")}>
            {t("adminClients.actions.createClient")}
          </Button>
          <Button variant="outlined" onClick={() => void loadItems()} disabled={isLoading}>
            {t("adminClients.actions.refresh")}
          </Button>
        </>
      )}
    >
      <Stack spacing={3} data-testid="admin-clients-page">
        {error && <Alert severity="error">{error}</Alert>}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          <AdminMetricCard
            label={t("adminClients.metrics.total")}
            value={summary.total}
          />
          <AdminMetricCard
            label={t("adminClients.metrics.active")}
            value={summary.active}
            isSelected={filters.status === "active"}
            onClick={() => navigateWithFilters({ status: "active" })}
          />
          <AdminMetricCard
            label={t("adminClients.metrics.inactive")}
            value={summary.inactive}
            isSelected={filters.status === "inactive"}
            onClick={() => navigateWithFilters({ status: "inactive" })}
          />
          <AdminMetricCard
            label={t("adminClients.metrics.history")}
            value={summary.withHistory}
          />
        </Box>

        <Paper sx={{ p: 2.5, borderRadius: 3.5 }}>
          <Stack spacing={2}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "2.4fr 1fr" },
                gap: 2,
              }}
            >
              <TextField
                label={t("adminClients.filters.searchLabel")}
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(e) => e.key === "Enter" && navigateWithFilters({ searchText: searchInput })}
                fullWidth
              />
              <TextField
                select
                label={t("adminClients.filters.statusLabel")}
                value={filters.status}
                onChange={(event) => navigateWithFilters({ status: event.target.value as StatusFilter })}
              >
                <MenuItem value="all">{t("adminClients.filters.allStatuses")}</MenuItem>
                <MenuItem value="active">{t("adminClients.filters.active")}</MenuItem>
                <MenuItem value="inactive">{t("adminClients.filters.inactive")}</MenuItem>
              </TextField>
            </Box>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <Button variant="contained" onClick={() => navigateWithFilters({ searchText: searchInput })}>
                {t("adminClients.filters.searchButton")}
              </Button>
              <Button
                variant="text"
                onClick={() => {
                  setSearchInput("");
                  clearFilters();
                }}
              >
                {t("adminClients.filters.clearButton")}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Stack spacing={2}>
          {isLoading && Array.from({ length: 3 }).map((_, index) => (
            <Paper key={`client-skeleton-${index}`} sx={{ p: 3.5, borderRadius: 3.5 }}>
              <Skeleton variant="text" width="30%" />
              <Skeleton variant="text" width="55%" />
              <Skeleton variant="rounded" height={110} sx={{ mt: 2 }} />
            </Paper>
          ))}

          {!isLoading && items.length === 0 && (
            <Paper sx={{ p: 4, borderRadius: 3.5 }}>
              <Typography variant="h5">{t("adminClients.list.empty.title")}</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {t("adminClients.list.empty.description")}
              </Typography>
            </Paper>
          )}

          {!isLoading && items.map((item) => {
            const statusStyles = getAdminClientStatusStyles(item.isActive);

            return (
              <Paper key={item.userId} sx={{ p: 3.5, borderRadius: 3.5 }}>
                <Stack spacing={2}>
                  <Stack
                    direction={{ xs: "column", lg: "row" }}
                    spacing={1.5}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", lg: "center" }}
                  >
                    <Box>
                      <Typography variant="h5">{item.displayName}</Typography>
                      <Typography color="text.secondary" sx={{ mt: 0.6 }}>
                        {item.email}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip
                        label={formatAdminClientStatusLabel(item.isActive)}
                        sx={{ bgcolor: statusStyles.bg, color: statusStyles.color, fontWeight: 700 }}
                      />
                      <Chip label={formatAdminClientCareRequestCount(item.ownedCareRequestsCount)} variant="outlined" />
                    </Stack>
                  </Stack>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" },
                      gap: 1.8,
                    }}
                  >
                    {[
                      [t("adminClients.list.identification"), item.identificationNumber ?? "-"],
                      [t("adminClients.list.phone"), item.phone ?? "-"],
                      [t("adminClients.list.lastActivity"), formatAdminClientDateTime(item.lastCareRequestAtUtc)],
                      [t("adminClients.list.created"), formatAdminClientDateTime(item.createdAtUtc)],
                    ].map(([label, value]) => (
                      <Box key={label}>
                        <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.12em" }}>
                          {label}
                        </Typography>
                        <Typography sx={{ mt: 0.45 }}>{value}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                    <Button
                      variant="contained"
                      onClick={() => navigate(`/admin/clients/${item.userId}${location.search}`, {
                        state: { from: `/admin/clients${location.search}` },
                      })}
                    >
                      {t("adminClients.list.viewClient")}
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      </Stack>
    </AdminPortalShell>
  );
}
