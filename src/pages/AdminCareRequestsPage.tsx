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
  exportAdminCareRequestsCsv,
  getAdminCareRequests,
  type AdminCareRequestListItem,
  type AdminCareRequestListParams,
  type AdminCareRequestSort,
  type AdminCareRequestView,
} from "../api/adminCareRequests";
import { extractApiErrorMessage } from "../api/errorMessage";
import AdminMetricCard from "../components/admin/AdminMetricCard";
import AdminPortalShell from "../components/layout/AdminPortalShell";
import { useAdminTableFilters, type FilterState } from "../hooks/useAdminTableFilters";
import { useCareRequestCatalogOptions } from "../hooks/useCareRequestCatalogOptions";
import { buildCatalogDisplayMaps } from "../utils/pricingFromCatalogOptions";
import {
  adminCareRequestViewOptions,
  formatAdminCareRequestCurrency,
  formatAdminCareRequestDateTime,
  formatAdminCareRequestTypeLabel,
  formatAdminCareRequestUnitTypeLabel,
  getAdminCareRequestStatusLabel,
  getAdminCareRequestStatusStyles,
} from "../utils/adminCareRequests";

interface AdminCareRequestFilters extends FilterState {
  view: AdminCareRequestView;
  sort: AdminCareRequestSort;
  scheduledFrom: string;
  scheduledTo: string;
}

const availableViews: AdminCareRequestView[] = [
  "all", "pending", "approved", "rejected", "completed",
  "unassigned", "pending-approval", "rejected-today",
  "approved-incomplete", "overdue",
];

const availableSorts: AdminCareRequestSort[] = ["newest", "oldest", "scheduled", "status", "value"];

export default function AdminCareRequestsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    filters,
    navigateWithFilters,
    createQueryString,
    clearFilters,
  } = useAdminTableFilters<AdminCareRequestFilters>({
    path: "/admin/care-requests",
    defaultView: "all",
    defaultSort: "newest",
    availableViews,
    availableSorts,
  });

  const { data: catalogOptions } = useCareRequestCatalogOptions();
  const catalogDisplayMaps = useMemo(
    () => (catalogOptions ? buildCatalogDisplayMaps(catalogOptions) : null),
    [catalogOptions],
  );

  const [items, setItems] = useState<AdminCareRequestListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(filters.searchText);

  const sortOptions = useMemo(() => [
    { value: "newest", label: t("adminCareRequests.filters.sortOptions.newest") },
    { value: "oldest", label: t("adminCareRequests.filters.sortOptions.oldest") },
    { value: "scheduled", label: t("adminCareRequests.filters.sortOptions.scheduled") },
    { value: "status", label: t("adminCareRequests.filters.sortOptions.status") },
    { value: "value", label: t("adminCareRequests.filters.sortOptions.value") },
  ], [t]);

  useEffect(() => {
    setSearchInput(filters.searchText);
  }, [filters.searchText]);

  const requestParams = useMemo<AdminCareRequestListParams>(
    () => ({
      view: filters.view,
      sort: filters.sort,
      search: filters.searchText || undefined,
      scheduledFrom: filters.scheduledFrom || undefined,
      scheduledTo: filters.scheduledTo || undefined,
    }),
    [filters],
  );

  const loadItems = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getAdminCareRequests(requestParams);
      setItems(response);
    } catch (nextError) {
      setError(extractApiErrorMessage(nextError, t("adminCareRequests.errors.loadFailed")));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, [requestParams]);

  const summary = useMemo(
    () => ({
      total: items.length,
      pending: items.filter((item) => item.status === "Pending").length,
      unassigned: items.filter((item) => item.status === "Pending" && !item.assignedNurseUserId).length,
      overdue: items.filter((item) => item.isOverdueOrStale).length,
      totalValue: items.reduce((accumulator, item) => accumulator + item.total, 0),
    }),
    [items],
  );

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      const { blob, fileName } = await exportAdminCareRequestsCsv(requestParams);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (nextError) {
      setError(extractApiErrorMessage(nextError, t("adminCareRequests.errors.exportFailed")));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AdminPortalShell
      eyebrow={t("adminCareRequests.eyebrow")}
      title={t("adminCareRequests.title")}
      description={t("adminCareRequests.description")}
      actions={
        <>
          <Button variant="outlined" onClick={() => void loadItems()} disabled={isLoading}>
            {t("adminCareRequests.actions.refresh")}
          </Button>
          <Button variant="outlined" onClick={handleExport} disabled={isLoading || isExporting}>
            {t("adminCareRequests.actions.export")}
          </Button>
          <Button
            variant="contained"
            onClick={() =>
              navigate(
                `/admin/care-requests/new${createQueryString({
                  ...filters,
                  searchText: filters.searchText,
                  selectedId: null,
                })}`,
              )
            }
          >
            {t("adminCareRequests.actions.createForClient")}
          </Button>
        </>
      }
    >
      <Stack spacing={3} data-testid="admin-care-list-page">
        {error && <Alert severity="error">{error}</Alert>}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(5, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          <AdminMetricCard
            label={t("adminCareRequests.metrics.total")}
            value={summary.total}
          />
          <AdminMetricCard
            label={t("adminCareRequests.metrics.pending")}
            value={summary.pending}
            isSelected={filters.view === "pending"}
            onClick={() => navigateWithFilters({ view: "pending", selectedId: null })}
          />
          <AdminMetricCard
            label={t("adminCareRequests.metrics.unassigned")}
            value={summary.unassigned}
            isSelected={filters.view === "unassigned"}
            onClick={() => navigateWithFilters({ view: "unassigned", selectedId: null })}
          />
          <AdminMetricCard
            label={t("adminCareRequests.metrics.overdue")}
            value={summary.overdue}
            isSelected={filters.view === "overdue"}
            onClick={() => navigateWithFilters({ view: "overdue", selectedId: null })}
          />
          <AdminMetricCard
            label={t("adminCareRequests.metrics.totalValue")}
            value={formatAdminCareRequestCurrency(summary.totalValue)}
          />
        </Box>

        <Paper sx={{ p: 2.5, borderRadius: 3.5 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} flexWrap="wrap">
              {adminCareRequestViewOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={filters.view === option.value ? "contained" : "text"}
                  onClick={() => navigateWithFilters({ view: option.value as AdminCareRequestView, selectedId: null })}
                >
                  {option.label}
                </Button>
              ))}
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", xl: "2fr 1fr 1fr 1fr auto" },
                gap: 1.5,
              }}
            >
              <TextField
                label={t("adminCareRequests.filters.searchLabel")}
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(e) => e.key === "Enter" && navigateWithFilters({ searchText: searchInput, selectedId: null })}
              />
              <TextField
                label={t("adminCareRequests.filters.fromLabel")}
                type="date"
                value={filters.scheduledFrom || ""}
                onChange={(event) => navigateWithFilters({ scheduledFrom: event.target.value, selectedId: null })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label={t("adminCareRequests.filters.toLabel")}
                type="date"
                value={filters.scheduledTo || ""}
                onChange={(event) => navigateWithFilters({ scheduledTo: event.target.value, selectedId: null })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                select
                label={t("adminCareRequests.filters.sortLabel")}
                value={filters.sort}
                onChange={(event) => navigateWithFilters({ sort: event.target.value as AdminCareRequestSort })}
                SelectProps={{ native: true }}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </TextField>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <Button
                  variant="contained"
                  onClick={() => navigateWithFilters({ searchText: searchInput, selectedId: null })}
                >
                  {t("adminCareRequests.filters.searchButton")}
                </Button>
                <Button
                  variant="text"
                  onClick={() => {
                    setSearchInput("");
                    clearFilters();
                  }}
                >
                  {t("adminCareRequests.filters.clearButton")}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>

        <Stack spacing={1.5}>
          {(!isLoading && items.length === 0) && (
            <Alert severity="info" variant="outlined">
              {t("adminCareRequests.list.empty")}
            </Alert>
          )}

          {items.map((item) => {
            const statusStyles = getAdminCareRequestStatusStyles(item.status);
            const selected = item.id === filters.selectedId;

            return (
              <Paper
                key={item.id}
                sx={{
                  p: 3,
                  borderRadius: 3.25,
                  border: selected
                    ? "1px solid rgba(183, 128, 60, 0.3)"
                    : "1px solid rgba(23, 48, 66, 0.08)",
                  bgcolor: selected ? "rgba(246, 234, 215, 0.34)" : "background.paper",
                }}
              >
                <Stack spacing={1.6}>
                  <Stack
                    direction={{ xs: "column", lg: "row" }}
                    spacing={1.5}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", lg: "center" }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h5">{item.careRequestDescription}</Typography>
                      <Typography color="text.secondary" sx={{ mt: 0.8 }}>
                        {item.id}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {selected && (
                        <Chip
                          label={t("adminCareRequests.list.inFocus")}
                          sx={{
                            bgcolor: "rgba(15, 49, 69, 0.1)",
                            color: "#173042",
                            fontWeight: 700,
                          }}
                        />
                      )}
                      <Chip
                        label={getAdminCareRequestStatusLabel(item.status)}
                        sx={{
                          bgcolor: statusStyles.bg,
                          color: statusStyles.color,
                          fontWeight: 700,
                        }}
                      />
                      {item.isOverdueOrStale && (
                        <Chip
                          label={t("adminCareRequests.list.attention")}
                          sx={{
                            bgcolor: "rgba(183, 79, 77, 0.12)",
                            color: "#9a3f3d",
                            fontWeight: 700,
                          }}
                        />
                      )}
                    </Stack>
                  </Stack>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" },
                      gap: 1.5,
                    }}
                  >
                    {[
                      [t("adminCareRequests.list.labels.client"), `${item.clientDisplayName} · ${item.clientEmail}`],
                      [
                        t("adminCareRequests.list.labels.nurse"),
                        item.assignedNurseDisplayName
                          ? `${item.assignedNurseDisplayName} · ${item.assignedNurseEmail ?? t("adminCareRequests.list.noEmail")}`
                          : t("adminCareRequests.list.unassigned"),
                      ],
                      [
                        t("adminCareRequests.list.labels.type"),
                        formatAdminCareRequestTypeLabel(item.careRequestType, catalogDisplayMaps?.careRequestType),
                      ],
                      [t("adminCareRequests.list.labels.total"), formatAdminCareRequestCurrency(item.total)],
                      [t("adminCareRequests.list.labels.scheduled"), item.careRequestDate ?? t("adminCareRequests.list.noDate")],
                      [t("adminCareRequests.list.labels.created"), formatAdminCareRequestDateTime(item.createdAtUtc)],
                      [t("adminCareRequests.list.labels.updated"), formatAdminCareRequestDateTime(item.updatedAtUtc)],
                      [
                        t("adminCareRequests.list.labels.unit"),
                        `${item.unit} ${formatAdminCareRequestUnitTypeLabel(item.unitType, catalogDisplayMaps?.unitType)}`,
                      ],
                    ].map(([label, value]) => (
                      <Box key={label}>
                        <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.12em" }}>
                          {label}
                        </Typography>
                        <Typography sx={{ mt: 0.45 }}>{value}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                    <Button
                      variant="contained"
                      onClick={() =>
                        navigate(`/admin/care-requests/${item.id}${createQueryString({
                          selectedId: item.id,
                        })}`)
                      }
                    >
                      {t("adminCareRequests.list.viewDetail")}
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
