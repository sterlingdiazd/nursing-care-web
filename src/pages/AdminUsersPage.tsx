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
  getAdminUsers,
  type AdminUserAccountStatus,
  type AdminUserListItem,
  type AdminUserListParams,
  type AdminUserProfileType,
  type AdminUserRoleName,
} from "../api/adminUsers";
import AdminPortalShell from "../components/layout/AdminPortalShell";
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

function resolveFilters(search: string) {
  const params = new URLSearchParams(search);
  const role = params.get("role");
  const profileType = params.get("profileType");
  const status = params.get("status");

  return {
    searchText: params.get("search") ?? "",
    role: adminUserRoleOptions.some((option) => option.value === role) ? (role as RoleFilter) : "all",
    profileType: adminUserProfileTypeOptions.some((option) => option.value === profileType)
      ? (profileType as ProfileTypeFilter)
      : "all",
    status: adminUserStatusOptions.some((option) => option.value === status) ? (status as StatusFilter) : "all",
  };
}

function createQueryString(filters: {
  searchText: string;
  role: RoleFilter;
  profileType: ProfileTypeFilter;
  status: StatusFilter;
}) {
  const params = new URLSearchParams();

  if (filters.searchText.trim()) {
    params.set("search", filters.searchText.trim());
  }

  if (filters.role !== "all") {
    params.set("role", filters.role);
  }

  if (filters.profileType !== "all") {
    params.set("profileType", filters.profileType);
  }

  if (filters.status !== "all") {
    params.set("status", filters.status);
  }

  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const filters = useMemo(() => resolveFilters(location.search), [location.search]);
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
      setError(nextError instanceof Error ? nextError.message : "No fue posible cargar los usuarios administrativos.");
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

  const navigateWithFilters = (next: Partial<typeof filters>) => {
    const query = createQueryString({
      searchText: next.searchText ?? filters.searchText,
      role: next.role ?? filters.role,
      profileType: next.profileType ?? filters.profileType,
      status: next.status ?? filters.status,
    });

    navigate(`/admin/users${query}`);
  };

  return (
    <AdminPortalShell
      eyebrow="Usuarios y acceso"
      title="Gobierna cuentas, roles y estados de acceso desde un modulo administrativo completo."
      description="Esta vista centraliza la busqueda de usuarios, el seguimiento del onboarding y el acceso al detalle completo de cada cuenta sin mezclar la consola administrativa con los flujos operativos."
      actions={
        <>
          <Button variant="outlined" onClick={() => void loadItems()} disabled={isLoading}>
            Actualizar modulo
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
          {[
            ["Usuarios visibles", String(summary.total)],
            ["Cuentas activas", String(summary.active)],
            ["En revision administrativa", String(summary.review)],
            ["Intervencion manual", String(summary.manual)],
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
                gridTemplateColumns: { xs: "1fr", md: "2.2fr repeat(3, minmax(0, 1fr))" },
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
                label="Rol"
                value={filters.role}
                onChange={(event) => navigateWithFilters({ role: event.target.value as RoleFilter })}
              >
                <MenuItem value="all">Todos los roles</MenuItem>
                {adminUserRoleOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Tipo de perfil"
                value={filters.profileType}
                onChange={(event) => navigateWithFilters({ profileType: event.target.value as ProfileTypeFilter })}
              >
                <MenuItem value="all">Todos los perfiles</MenuItem>
                {adminUserProfileTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Estado"
                value={filters.status}
                onChange={(event) => navigateWithFilters({ status: event.target.value as StatusFilter })}
              >
                <MenuItem value="all">Todos los estados</MenuItem>
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
                Buscar
              </Button>
              <Button
                variant="text"
                onClick={() => {
                  setSearchInput("");
                  navigate("/admin/users");
                }}
              >
                Limpiar filtros
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
              No hay cuentas que coincidan con los filtros seleccionados en este momento.
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
                      Ver cuenta
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
                      ["Cedula", item.identificationNumber ?? "Sin cedula"],
                      ["Telefono", item.phone ?? "Sin telefono"],
                      ["Roles", formatRoleLabels(item.roleNames)],
                      ["Creada", formatAdminUserDateTime(item.createdAtUtc)],
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
                      <Chip label="Perfil incompleto" variant="outlined" />
                    )}
                    {item.requiresAdminReview && (
                      <Chip label="Requiere revision" variant="outlined" />
                    )}
                    {item.requiresManualIntervention && (
                      <Chip
                        label="Requiere intervencion"
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
