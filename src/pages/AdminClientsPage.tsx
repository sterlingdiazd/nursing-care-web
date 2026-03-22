import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import AdminPortalShell from "../components/layout/AdminPortalShell";
import {
  formatAdminClientCareRequestCount,
  formatAdminClientDateTime,
  formatAdminClientStatusLabel,
  getAdminClientStatusStyles,
} from "../utils/adminClients";

type StatusFilter = "all" | AdminClientListStatus;

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Todos los estados" },
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" },
];

function resolveFilters(search: string) {
  const params = new URLSearchParams(search);
  const status = params.get("status");

  return {
    searchText: params.get("search") ?? "",
    status: statusOptions.some((option) => option.value === status) ? (status as StatusFilter) : "all",
  };
}

function createQueryString(filters: { searchText: string; status: StatusFilter }) {
  const params = new URLSearchParams();

  if (filters.searchText.trim()) {
    params.set("search", filters.searchText.trim());
  }

  if (filters.status !== "all") {
    params.set("status", filters.status);
  }

  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

export default function AdminClientsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const filters = useMemo(() => resolveFilters(location.search), [location.search]);
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
      setError(nextError instanceof Error ? nextError.message : "No fue posible cargar los clientes.");
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

  const navigateWithFilters = (next: Partial<typeof filters>) => {
    const query = createQueryString({
      searchText: next.searchText ?? filters.searchText,
      status: next.status ?? filters.status,
    });

    navigate(`/admin/clients${query}`);
  };

  return (
    <AdminPortalShell
      eyebrow="Clientes"
      title="Administra la base de clientes desde un modulo propio del portal."
      description="Esta vista centraliza busqueda, alta manual, activacion comercial y acceso al historial basico de solicitudes sin mezclar el seguimiento de clientes con la gobernanza general de usuarios."
      actions={(
        <>
          <Button variant="contained" onClick={() => navigate("/admin/clients/new")}>
            Crear cliente
          </Button>
          <Button variant="outlined" onClick={() => void loadItems()} disabled={isLoading}>
            Actualizar modulo
          </Button>
        </>
      )}
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
          {[
            ["Clientes visibles", String(summary.total)],
            ["Activos", String(summary.active)],
            ["Inactivos", String(summary.inactive)],
            ["Con historial", String(summary.withHistory)],
          ].map(([label, value]) => (
            <Paper key={label} sx={{ p: 3, borderRadius: 3.5 }}>
              <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                {label}
              </Typography>
              <Typography variant="h3" sx={{ mt: 1.1 }}>
                {value}
              </Typography>
            </Paper>
          ))}
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
                label="Buscar por correo, nombre, cedula o telefono"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                fullWidth
              />
              <TextField
                select
                label="Estado"
                value={filters.status}
                onChange={(event) => navigateWithFilters({ status: event.target.value as StatusFilter })}
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <Button variant="contained" onClick={() => navigateWithFilters({ searchText: searchInput })}>
                Buscar
              </Button>
              <Button
                variant="text"
                onClick={() => {
                  setSearchInput("");
                  navigate("/admin/clients");
                }}
              >
                Limpiar filtros
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
              <Typography variant="h5">No hay clientes para los filtros actuales.</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Ajusta la busqueda o crea un cliente manual para iniciar la base administrativa.
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
                      ["Cedula", item.identificationNumber ?? "Sin cedula"],
                      ["Telefono", item.phone ?? "Sin telefono"],
                      ["Ultima actividad", formatAdminClientDateTime(item.lastCareRequestAtUtc)],
                      ["Creado", formatAdminClientDateTime(item.createdAtUtc)],
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
                      Ver cliente
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
