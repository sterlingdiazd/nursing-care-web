import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import AdminPortalShell from "../components/layout/AdminPortalShell";
import {
  adminCareRequestViewOptions,
  formatAdminCareRequestCurrency,
  formatAdminCareRequestDateTime,
  formatAdminCareRequestTypeLabel,
  formatAdminCareRequestUnitTypeLabel,
  getAdminCareRequestStatusLabel,
  getAdminCareRequestStatusStyles,
} from "../utils/adminCareRequests";

const sortOptions: Array<{ value: AdminCareRequestSort; label: string }> = [
  { value: "newest", label: "Mas recientes" },
  { value: "oldest", label: "Mas antiguas" },
  { value: "scheduled", label: "Fecha del servicio" },
  { value: "status", label: "Estado" },
  { value: "value", label: "Mayor valor" },
];

function resolveView(search: string): AdminCareRequestView {
  const value = new URLSearchParams(search).get("view");
  const availableValues = new Set<AdminCareRequestView>([
    "all",
    "pending",
    "approved",
    "rejected",
    "completed",
    "unassigned",
    "pending-approval",
    "rejected-today",
    "approved-incomplete",
    "overdue",
  ]);

  return value && availableValues.has(value as AdminCareRequestView)
    ? (value as AdminCareRequestView)
    : "all";
}

function resolveSort(search: string): AdminCareRequestSort {
  const value = new URLSearchParams(search).get("sort");
  return sortOptions.some((option) => option.value === value)
    ? (value as AdminCareRequestSort)
    : "newest";
}

function resolveFilterState(search: string) {
  const params = new URLSearchParams(search);
  return {
    view: resolveView(search),
    sort: resolveSort(search),
    searchText: params.get("search") ?? "",
    scheduledFrom: params.get("scheduledFrom") ?? "",
    scheduledTo: params.get("scheduledTo") ?? "",
    selectedId: params.get("selected"),
  };
}

function createQueryString({
  view,
  sort,
  searchText,
  scheduledFrom,
  scheduledTo,
  selectedId,
}: {
  view: AdminCareRequestView;
  sort: AdminCareRequestSort;
  searchText: string;
  scheduledFrom: string;
  scheduledTo: string;
  selectedId?: string | null;
}) {
  const params = new URLSearchParams();

  if (view !== "all") {
    params.set("view", view);
  }

  if (sort !== "newest") {
    params.set("sort", sort);
  }

  if (searchText.trim()) {
    params.set("search", searchText.trim());
  }

  if (scheduledFrom) {
    params.set("scheduledFrom", scheduledFrom);
  }

  if (scheduledTo) {
    params.set("scheduledTo", scheduledTo);
  }

  if (selectedId) {
    params.set("selected", selectedId);
  }

  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

export default function AdminCareRequestsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState<AdminCareRequestListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filters = useMemo(() => resolveFilterState(location.search), [location.search]);
  const [searchInput, setSearchInput] = useState(filters.searchText);

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
      setError(nextError instanceof Error ? nextError.message : "No fue posible cargar las solicitudes administrativas.");
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

  const navigateWithFilters = (next: Partial<typeof filters>) => {
    const query = createQueryString({
      view: next.view ?? filters.view,
      sort: next.sort ?? filters.sort,
      searchText: next.searchText ?? filters.searchText,
      scheduledFrom: next.scheduledFrom ?? filters.scheduledFrom,
      scheduledTo: next.scheduledTo ?? filters.scheduledTo,
      selectedId: next.selectedId !== undefined ? next.selectedId : filters.selectedId,
    });

    navigate(`/admin/care-requests${query}`);
  };

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
      setError(nextError instanceof Error ? nextError.message : "No fue posible exportar las solicitudes.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AdminPortalShell
      eyebrow="Gestion administrativa de solicitudes"
      title="Un modulo completo para leer, crear, asignar y decidir solicitudes desde administracion."
      description="Esta vista amplia la cola inicial del portal hacia un modulo operativo completo, con filtros, exportacion, acceso al detalle y una ruta dedicada para crear solicitudes en nombre de clientes."
      actions={
        <>
          <Button variant="outlined" onClick={() => void loadItems()} disabled={isLoading}>
            Actualizar modulo
          </Button>
          <Button variant="outlined" onClick={handleExport} disabled={isLoading || isExporting}>
            Exportar CSV
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
            Crear solicitud para cliente
          </Button>
        </>
      }
    >
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(5, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          {[
            ["Solicitudes visibles", String(summary.total)],
            ["Pendientes", String(summary.pending)],
            ["Sin asignar", String(summary.unassigned)],
            ["Atrasadas o estancadas", String(summary.overdue)],
            ["Valor visible", formatAdminCareRequestCurrency(summary.totalValue)],
          ].map(([label, value]) => (
            <Paper key={label} sx={{ p: 3, borderRadius: 3.5 }}>
              <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                {label}
              </Typography>
              <Typography variant="h4" sx={{ mt: 1.1 }}>
                {value}
              </Typography>
            </Paper>
          ))}
        </Box>

        <Paper sx={{ p: 2.5, borderRadius: 3.5 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} flexWrap="wrap">
              {adminCareRequestViewOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={filters.view === option.value ? "contained" : "text"}
                  onClick={() => navigateWithFilters({ view: option.value, selectedId: null })}
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
                label="Buscar por id, cliente, enfermera, tipo o texto"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
              <TextField
                label="Desde fecha del servicio"
                type="date"
                value={filters.scheduledFrom}
                onChange={(event) => navigateWithFilters({ scheduledFrom: event.target.value, selectedId: null })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Hasta fecha del servicio"
                type="date"
                value={filters.scheduledTo}
                onChange={(event) => navigateWithFilters({ scheduledTo: event.target.value, selectedId: null })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                select
                label="Ordenar por"
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
                  Buscar
                </Button>
                <Button
                  variant="text"
                  onClick={() => {
                    setSearchInput("");
                    navigate("/admin/care-requests");
                  }}
                >
                  Limpiar
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>

        <Stack spacing={1.5}>
          {!isLoading && items.length === 0 && (
            <Alert severity="info" variant="outlined">
              No hay solicitudes para los filtros actuales.
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
                        Solicitud {item.id}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {selected && (
                        <Chip
                          label="En foco"
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
                          label="Requiere atencion"
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
                      ["Cliente", `${item.clientDisplayName} · ${item.clientEmail}`],
                      [
                        "Enfermera asignada",
                        item.assignedNurseDisplayName
                          ? `${item.assignedNurseDisplayName} · ${item.assignedNurseEmail ?? "Sin correo"}`
                          : "Sin asignar",
                      ],
                      ["Tipo", formatAdminCareRequestTypeLabel(item.careRequestType)],
                      ["Total", formatAdminCareRequestCurrency(item.total)],
                      ["Fecha del servicio", item.careRequestDate ?? "Sin fecha"],
                      ["Creada", formatAdminCareRequestDateTime(item.createdAtUtc)],
                      ["Actualizada", formatAdminCareRequestDateTime(item.updatedAtUtc)],
                      ["Unidad", `${item.unit} ${formatAdminCareRequestUnitTypeLabel(item.unitType)}`],
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
                          ...filters,
                          searchText: filters.searchText,
                          selectedId: item.id,
                        })}`)
                      }
                    >
                      Ver detalle
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
