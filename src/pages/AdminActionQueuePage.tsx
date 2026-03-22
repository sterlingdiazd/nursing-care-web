import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import AdminActionItemCard from "../components/admin/AdminActionItemCard";
import AdminPortalShell from "../components/layout/AdminPortalShell";

type SeverityFilter = "all" | AdminActionItemSeverity;
type StateFilter = "all" | AdminActionItemState;

const severityOptions: Array<{ value: SeverityFilter; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "High", label: "Alta" },
  { value: "Medium", label: "Media" },
  { value: "Low", label: "Baja" },
];

const stateOptions: Array<{ value: StateFilter; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "Unread", label: "No leidas" },
  { value: "Pending", label: "Pendientes" },
];

export default function AdminActionQueuePage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AdminActionItem[]>([]);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getAdminActionItems();
      setItems(response);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible cargar la cola de acciones.");
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
      eyebrow="Acciones actuales"
      title="Una cola administrativa separada para lo que si requiere intervencion."
      description="Esta bandeja no replica notificaciones generales. Reune solo elementos operativos, cuentas y situaciones del sistema que exigen una accion concreta desde administracion."
      actions={
        <>
          <Button variant="outlined" onClick={() => navigate("/admin")}>
            Volver al panel principal
          </Button>
          <Button variant="contained" onClick={() => void loadItems()} disabled={isLoading}>
            Actualizar cola
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
            ["Elementos visibles", summary.total],
            ["No leidas", summary.unread],
            ["Pendientes", summary.pending],
            ["Alta severidad", summary.high],
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
            <Box>
              <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                Filtrar por severidad
              </Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} sx={{ mt: 1.2 }} flexWrap="wrap">
                {severityOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={severityFilter === option.value ? "contained" : "text"}
                    onClick={() => setSeverityFilter(option.value)}
                    aria-label={`Filtrar por severidad ${option.label.toLowerCase()}`}
                  >
                    {option.label}
                  </Button>
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                Filtrar por estado
              </Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} sx={{ mt: 1.2 }} flexWrap="wrap">
                {stateOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={stateFilter === option.value ? "contained" : "text"}
                    onClick={() => setStateFilter(option.value)}
                    aria-label={`Filtrar por estado ${option.label.toLowerCase()}`}
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
              No hay elementos en la cola para los filtros seleccionados en este momento.
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
