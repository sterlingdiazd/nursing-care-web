import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  getActiveNurseProfiles,
  getInactiveNurseProfiles,
  getPendingNurseProfiles,
  type NurseProfileSummary,
  type PendingNurseProfile,
} from "../api/adminNurseProfiles";
import { extractApiErrorMessage } from "../api/errorMessage";
import AdminMetricCard from "../components/admin/AdminMetricCard";
import AdminPortalShell from "../components/layout/AdminPortalShell";
import { useAdminTableFilters, type FilterState } from "../hooks/useAdminTableFilters";
import {
  formatNurseDisplayName,
  formatNurseWorkloadSummary,
  getNurseReadinessLabel,
  getNurseStatusLabel,
  getNurseStatusStyles,
} from "../utils/adminNurseProfiles";

type NurseProfilesView = "pending" | "active" | "inactive";

interface NurseFilters extends FilterState {
  view: NurseProfilesView;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function matchesSearch(value: string, search: string) {
  return value.toLocaleLowerCase("es-DO").includes(search.toLocaleLowerCase("es-DO"));
}

export default function AdminNurseProfilesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    filters,
    navigateWithFilters,
  } = useAdminTableFilters<NurseFilters>({
    path: "/admin/nurse-profiles",
    defaultView: "pending",
    availableViews: ["pending", "active", "inactive"],
  });

  const [pendingProfiles, setPendingProfiles] = useState<PendingNurseProfile[]>([]);
  const [activeProfiles, setActiveProfiles] = useState<NurseProfileSummary[]>([]);
  const [inactiveProfiles, setInactiveProfiles] = useState<NurseProfileSummary[]>([]);
  const [search, setSearch] = useState(filters.searchText);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfiles = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [pending, active, inactive] = await Promise.all([
        getPendingNurseProfiles(),
        getActiveNurseProfiles(),
        getInactiveNurseProfiles(),
      ]);

      setPendingProfiles(pending);
      setActiveProfiles(active);
      setInactiveProfiles(inactive);
    } catch (nextError) {
      setError(extractApiErrorMessage(nextError, t("adminNurseProfiles.errors.loadFailed")));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProfiles();
  }, []);

  useEffect(() => {
    setSearch(filters.searchText);
  }, [filters.searchText]);

  const filteredPendingProfiles = useMemo(
    () =>
      pendingProfiles.filter((profile) =>
        matchesSearch(
          [profile.name, profile.lastName, profile.email, profile.specialty].filter(Boolean).join(" "),
          search,
        )),
    [pendingProfiles, search],
  );

  const filteredActiveProfiles = useMemo(
    () =>
      activeProfiles.filter((profile) =>
        matchesSearch(
          [profile.name, profile.lastName, profile.email, profile.specialty, profile.category].filter(Boolean).join(" "),
          search,
        )),
    [activeProfiles, search],
  );

  const filteredInactiveProfiles = useMemo(
    () =>
      inactiveProfiles.filter((profile) =>
        matchesSearch(
          [profile.name, profile.lastName, profile.email, profile.specialty, profile.category].filter(Boolean).join(" "),
          search,
        )),
    [inactiveProfiles, search],
  );

  const currentItems = filters.view === "pending"
    ? filteredPendingProfiles
    : filters.view === "active"
      ? filteredActiveProfiles
      : filteredInactiveProfiles;

  return (
    <AdminPortalShell
      eyebrow={t("adminNurseProfiles.eyebrow")}
      title={t("adminNurseProfiles.title")}
      description={t("adminNurseProfiles.description")}
      actions={(
        <>
          <Button variant="contained" onClick={() => navigate("/admin/nurse-profiles/new")}>
            {t("adminNurseProfiles.actions.createNurse")}
          </Button>
          <Button variant="outlined" onClick={() => void loadProfiles()} disabled={isLoading}>
            {t("adminNurseProfiles.actions.refresh")}
          </Button>
        </>
      )}
    >
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          <AdminMetricCard
            label={t("adminNurseProfiles.metrics.pending")}
            value={pendingProfiles.length}
            description={t("adminNurseProfiles.metrics.pendingDesc")}
            isSelected={filters.view === "pending"}
            onClick={() => navigateWithFilters({ view: "pending" })}
          />
          <AdminMetricCard
            label={t("adminNurseProfiles.metrics.active")}
            value={activeProfiles.length}
            description={t("adminNurseProfiles.metrics.activeDesc")}
            isSelected={filters.view === "active"}
            onClick={() => navigateWithFilters({ view: "active" })}
          />
          <AdminMetricCard
            label={t("adminNurseProfiles.metrics.inactive")}
            value={inactiveProfiles.length}
            description={t("adminNurseProfiles.metrics.inactiveDesc")}
            isSelected={filters.view === "inactive"}
            onClick={() => navigateWithFilters({ view: "inactive" })}
          />
        </Box>

        <Paper sx={{ p: 2.8, borderRadius: 3.4 }}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={1.5}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", lg: "center" }}
          >
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                variant={filters.view === "pending" ? "contained" : "text"}
                onClick={() => navigateWithFilters({ view: "pending" })}
              >
                {t("adminNurseProfiles.filters.viewPending")}
              </Button>
              <Button
                variant={filters.view === "active" ? "contained" : "text"}
                onClick={() => navigateWithFilters({ view: "active" })}
              >
                {t("adminNurseProfiles.filters.viewActive")}
              </Button>
              <Button
                variant={filters.view === "inactive" ? "contained" : "text"}
                onClick={() => navigateWithFilters({ view: "inactive" })}
              >
                {t("adminNurseProfiles.filters.viewInactive")}
              </Button>
            </Stack>

            <TextField
              label={t("adminNurseProfiles.filters.searchLabel")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(e) => e.key === "Enter" && navigateWithFilters({ searchText: search })}
              placeholder={t("adminNurseProfiles.filters.searchPlaceholder")}
              sx={{ minWidth: { lg: 320 } }}
            />
          </Stack>
        </Paper>

        <Stack spacing={2}>
          {currentItems.length === 0 ? (
            <Paper sx={{ p: 3.2, borderRadius: 3.4 }}>
              <Typography variant="h6">
                {isLoading ? t("adminNurseProfiles.list.empty.loading") : t("adminNurseProfiles.list.empty.title")}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.8 }}>
                {t("adminNurseProfiles.list.empty.description")}
              </Typography>
            </Paper>
          ) : filters.view === "pending" ? (
            (currentItems as PendingNurseProfile[]).map((profile) => (
              <Paper key={profile.userId} sx={{ p: 2.8, borderRadius: 3.2 }}>
                <Stack spacing={1.5}>
                  <Stack
                    direction={{ xs: "column", lg: "row" }}
                    spacing={1.25}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", lg: "center" }}
                  >
                    <Stack spacing={0.6}>
                      <Typography variant="h5">{formatNurseDisplayName(profile)}</Typography>
                      <Typography color="text.secondary">{profile.email}</Typography>
                    </Stack>

                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip
                        label={t("adminNurseProfiles.list.pendingReview")}
                        sx={{ bgcolor: "rgba(193, 138, 66, 0.14)", color: "#8a5e22", fontWeight: 700 }}
                      />
                      <Chip label={profile.specialty ?? t("adminNurseProfiles.list.noSpecialty")} variant="outlined" />
                    </Stack>
                  </Stack>

                  <Typography color="text.secondary">
                    {t("adminNurseProfiles.list.registeredOn", { date: formatDate(profile.createdAtUtc) })}
                  </Typography>

                  <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
                    <Button
                      variant="contained"
                      onClick={() => navigate(`/admin/nurse-profiles/${profile.userId}/review`, { state: { from: location.pathname + location.search } })}
                    >
                      {t("adminNurseProfiles.list.completeReview")}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => navigate(`/admin/nurse-profiles/${profile.userId}`, { state: { from: location.pathname + location.search } })}
                    >
                      {t("adminNurseProfiles.list.viewDetail")}
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            ))
          ) : (
            (currentItems as NurseProfileSummary[]).map((profile) => {
              const statusStyles = getNurseStatusStyles(profile);

              return (
                <Paper key={profile.userId} sx={{ p: 2.8, borderRadius: 3.2 }}>
                  <Stack spacing={1.5}>
                    <Stack
                      direction={{ xs: "column", lg: "row" }}
                      spacing={1.25}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", lg: "center" }}
                    >
                      <Stack spacing={0.6}>
                        <Typography variant="h5">{formatNurseDisplayName(profile)}</Typography>
                        <Typography color="text.secondary">{profile.email}</Typography>
                      </Stack>

                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip label={getNurseStatusLabel(profile)} sx={{ bgcolor: statusStyles.bg, color: statusStyles.color, fontWeight: 700 }} />
                        <Chip label={getNurseReadinessLabel(profile)} variant="outlined" />
                      </Stack>
                    </Stack>

                    <Typography color="text.secondary">
                      {[profile.specialty, profile.category].filter(Boolean).join(" · ") || t("adminNurseProfiles.list.noCatalog")}
                    </Typography>

                    <Typography color="text.secondary">
                      {formatNurseWorkloadSummary(profile.workload)}
                    </Typography>

                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
                      <Button
                        variant="contained"
                        onClick={() => navigate(`/admin/nurse-profiles/${profile.userId}`, { state: { from: location.pathname + location.search } })}
                      >
                        {t("adminNurseProfiles.list.viewDetail")}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => navigate(`/admin/nurse-profiles/${profile.userId}/edit`, { state: { from: location.pathname + location.search } })}
                      >
                        {t("adminNurseProfiles.list.editProfile")}
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              );
            })
          )}
        </Stack>
      </Stack>
    </AdminPortalShell>
  );
}
