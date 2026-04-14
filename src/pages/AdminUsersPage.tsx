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
  getAdminUsers,
  type AdminUserAccountStatus,
  type AdminUserListItem,
  type AdminUserListParams,
  type AdminUserProfileType,
  type AdminUserRoleName,
} from "../api/adminUsers";
import { extractApiErrorMessage } from "../api/errorMessage";
import AdminMetricCard from "../components/admin/AdminMetricCard";
import AdminPortalShell from "../components/layout/AdminPortalShell";
import { useAdminTableFilters, type FilterState } from "../hooks/useAdminTableFilters";
import {
  adminUserProfileTypeOptions,
  adminUserRoleOptions,
  adminUserStatusOptions,
  formatAdminUserDateTime,
  formatAdminUserProfileTypeLabel,
  formatAdminUserStatusLabel,
  getAdminUserStatusStyles,
} from "../utils/adminUsers";
import { formatRoleLabels } from "../utils/roleLabels";

type RoleFilter = "all" | AdminUserRoleName;
type ProfileTypeFilter = "all" | AdminUserProfileType;
type StatusFilter = "all" | AdminUserAccountStatus;

interface AdminUserFilters extends FilterState {
  role: RoleFilter;
  profileType: ProfileTypeFilter;
  status: StatusFilter;
}

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    filters,
    navigateWithFilters,
    clearFilters,
  } = useAdminTableFilters<AdminUserFilters>({
    path: "/admin/users",
    defaultView: "all",
    defaultSort: "newest",
    availableViews: ["all"],
  });

  const [searchInput, setSearchInput] = useState(filters.searchText);
  const [items, setItems] = useState<AdminUserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSearchInput(filters.searchText);
  }, [filters.searchText]);

  const requestParams = useMemo<AdminUserListParams>(() => ({
    search: filters.searchText || undefined,
    role: filters.role === "all" ? undefined : filters.role,
    profileType: filters.profileType === "all" ? undefined : filters.profileType,
    status: filters.status === "all" ? undefined : filters.status,
  }), [filters]);

  const loadItems = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getAdminUsers(requestParams);
      setItems(response);
    } catch (nextError) {
      setError(extractApiErrorMessage(nextError, t("adminUsers.errors.loadFailed")));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, [requestParams]);

  const summary = useMemo(() => ({
    total: items.length,
    active: items.filter((item) => item.accountStatus === "Active").length,
    review: items.filter((item) => item.accountStatus === "AdminReview").length,
    manual: items.filter((item) => item.accountStatus === "ManualIntervention").length,
  }), [items]);

  return (
    <AdminPortalShell
      eyebrow={t("adminUsers.eyebrow")}
      title={t("adminUsers.title")}
      description={t("adminUsers.description")}
      actions={
        <>
          <Button variant="contained" onClick={() => navigate("/admin/users/create-admin")}>
            {t("adminUsers.actions.createAdmin")}
          </Button>
          <Button variant="outlined" onClick={() => void loadItems()} disabled={isLoading}>
            {t("adminUsers.actions.refresh")}
          </Button>
        </>
      }
    >
      <Stack spacing={3} data-testid="admin-users-page">
        {error && <Alert severity="error">{error}</Alert>}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          <AdminMetricCard
            label={t("adminUsers.metrics.total")}
            value={summary.total}
          />
          <AdminMetricCard
            label={t("adminUsers.metrics.active")}
            value={summary.active}
          />
          <AdminMetricCard
            label={t("adminUsers.metrics.review")}
            value={summary.review}
            isSelected={filters.status === "AdminReview"}
            onClick={() => navigateWithFilters({ status: "AdminReview" })}
          />
          <AdminMetricCard
            label={t("adminUsers.metrics.manual")}
            value={summary.manual}
            isSelected={filters.status === "ManualIntervention"}
            onClick={() => navigateWithFilters({ status: "ManualIntervention" })}
          />
        </Box>

        <Paper sx={{ p: 2.5, borderRadius: 3.5 }}>
          <Stack spacing={2}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "2.2fr repeat(3, minmax(0, 1fr))" },
                gap: 2,
              }}
            >
              <TextField
                label={t("adminUsers.filters.searchLabel")}
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(e) => e.key === "Enter" && navigateWithFilters({ searchText: searchInput })}
                fullWidth
              />
              <TextField
                select
                label={t("adminUsers.filters.roleLabel")}
                value={filters.role}
                onChange={(event) => navigateWithFilters({ role: event.target.value as RoleFilter })}
              >
                <MenuItem value="all">{t("adminUsers.filters.allRoles")}</MenuItem>
                {adminUserRoleOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label={t("adminUsers.filters.profileTypeLabel")}
                value={filters.profileType}
                onChange={(event) => navigateWithFilters({ profileType: event.target.value as ProfileTypeFilter })}
              >
                <MenuItem value="all">{t("adminUsers.filters.allProfiles")}</MenuItem>
                {adminUserProfileTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label={t("adminUsers.filters.statusLabel")}
                value={filters.status}
                onChange={(event) => navigateWithFilters({ status: event.target.value as StatusFilter })}
              >
                <MenuItem value="all">{t("adminUsers.filters.allStatuses")}</MenuItem>
                {adminUserStatusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <Button
                variant="contained"
                onClick={() => navigateWithFilters({ searchText: searchInput })}
              >
                {t("adminUsers.filters.searchButton")}
              </Button>
              <Button
                variant="text"
                onClick={() => {
                  setSearchInput("");
                  clearFilters();
                }}
              >
                {t("adminUsers.filters.clearButton")}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Stack spacing={2}>
          {isLoading && Array.from({ length: 3 }).map((_, index) => (
            <Paper key={index} sx={{ p: 3, borderRadius: 3.5 }}>
              <Skeleton variant="text" width="42%" />
              <Skeleton variant="text" width="68%" />
              <Skeleton variant="rounded" height={90} sx={{ mt: 1.4 }} />
            </Paper>
          ))}

          {!isLoading && items.length === 0 && (
            <Alert severity="info" variant="outlined">
              {t("adminUsers.list.empty")}
            </Alert>
          )}

          {!isLoading && items.map((item) => {
            const statusStyles = getAdminUserStatusStyles(item.accountStatus);

            return (
              <Paper key={item.id} sx={{ p: 3, borderRadius: 3.5 }}>
                <Stack spacing={2.2}>
                  <Stack
                    direction={{ xs: "column", lg: "row" }}
                    justifyContent="space-between"
                    spacing={2}
                    alignItems={{ xs: "flex-start", lg: "center" }}
                  >
                    <Box>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Typography variant="h5">{item.displayName}</Typography>
                        <Chip
                          label={formatAdminUserStatusLabel(item.accountStatus)}
                          sx={{
                            bgcolor: statusStyles.bg,
                            color: statusStyles.color,
                            fontWeight: 700,
                          }}
                        />
                        <Chip
                          label={formatAdminUserProfileTypeLabel(item.profileType)}
                          sx={{
                            bgcolor: "rgba(59, 108, 141, 0.12)",
                            color: "#214e67",
                            fontWeight: 700,
                          }}
                        />
                      </Stack>
                      <Typography color="text.secondary" sx={{ mt: 0.6 }}>
                        {item.email}
                      </Typography>
                    </Box>

                    <Button
                      variant="contained"
                      onClick={() => navigate(`/admin/users/${item.id}${location.search}`)}
                    >
                      {t("adminUsers.list.viewAccount")}
                    </Button>
                  </Stack>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" },
                      gap: 1.6,
                    }}
                  >
                    {[
                      [t("adminUsers.list.identification"), item.identificationNumber ?? "-"],
                      [t("adminUsers.list.phone"), item.phone ?? "-"],
                      [t("adminUsers.list.roles"), formatRoleLabels(item.roleNames)],
                      [t("adminUsers.list.created"), formatAdminUserDateTime(item.createdAtUtc)],
                    ].map(([label, value]) => (
                      <Box key={label}>
                        <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.12em" }}>
                          {label}
                        </Typography>
                        <Typography sx={{ mt: 0.45 }}>{value}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {item.requiresProfileCompletion && (
                      <Chip label={t("adminUsers.list.status.incomplete")} variant="outlined" />
                    )}
                    {item.requiresAdminReview && (
                      <Chip label={t("adminUsers.list.status.reviewRequired")} variant="outlined" />
                    )}
                    {item.requiresManualIntervention && (
                      <Chip
                        label={t("adminUsers.list.status.manualRequired")}
                        sx={{
                          bgcolor: "rgba(183, 79, 77, 0.12)",
                          color: "#8b3635",
                          fontWeight: 700,
                        }}
                      />
                    )}
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
