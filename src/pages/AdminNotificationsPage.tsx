import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

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

function severityLabel(value: string) {
  if (value === "High") return "Alta";
  if (value === "Medium") return "Media";
  return "Baja";
}

export default function AdminNotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AdminNotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listAdminNotifications({ includeArchived, unreadOnly });
      setItems(response);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible cargar las notificaciones.");
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
      setError(nextError instanceof Error ? nextError.message : "No fue posible actualizar la notificacion.");
    }
  };

  return (
    <AdminPortalShell
      eyebrow="Centro de notificaciones"
      title="Unifica avisos operativos y de gobierno en una sola bandeja administrativa."
      description="Incluye severidad, categoria, origen, estado de lectura y enlaces directos a la entidad relacionada para reducir tiempos de respuesta."
      actions={(
        <>
          <Button variant="outlined" onClick={() => navigate("/admin")}>Volver al panel</Button>
          <Button variant="contained" onClick={() => void load()} disabled={isLoading}>Actualizar bandeja</Button>
        </>
      )}
    >
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
          {[["Notificaciones visibles", summary.total], ["Sin leer", summary.unread], ["Alta severidad sin leer", summary.high]]
            .map(([label, value]) => (
              <Paper key={label} sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="overline" sx={{ letterSpacing: "0.14em", color: "secondary.main" }}>{label}</Typography>
                <Typography variant="h3" sx={{ mt: 1 }}>{value}</Typography>
              </Paper>
            ))}
        </Box>

        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
            <Button variant={unreadOnly ? "contained" : "outlined"} onClick={() => setUnreadOnly((current) => !current)}>
              {unreadOnly ? "Mostrando solo no leidas" : "Filtrar no leidas"}
            </Button>
            <Button variant={includeArchived ? "contained" : "outlined"} onClick={() => setIncludeArchived((current) => !current)}>
              {includeArchived ? "Incluyendo archivadas" : "Mostrar archivadas"}
            </Button>
          </Stack>
        </Paper>

        {!isLoading && items.length === 0 && (
          <Alert severity="info" variant="outlined">
            No hay notificaciones para los filtros seleccionados.
          </Alert>
        )}

        <Stack spacing={2}>
          {items.map((item) => (
            <Paper key={item.id} sx={{ p: 2.5, borderRadius: 3 }}>
              <Stack spacing={1.2}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between">
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip label={`Severidad ${severityLabel(item.severity)}`} color={item.severity === "High" ? "error" : item.severity === "Medium" ? "warning" : "info"} />
                    <Chip label={item.readAtUtc ? "Leida" : "No leida"} variant={item.readAtUtc ? "outlined" : "filled"} />
                    <Chip label={item.category} variant="outlined" />
                  </Stack>
                  <Typography color="text.secondary">{formatTimestamp(item.createdAtUtc)}</Typography>
                </Stack>

                <Typography variant="h6">{item.title}</Typography>
                <Typography color="text.secondary">{item.body}</Typography>
                {item.source && <Typography color="text.secondary">Origen: {item.source}</Typography>}

                <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                  {item.deepLinkPath && (
                    <Button variant="contained" onClick={() => navigate(item.deepLinkPath!)}>
                      Abrir entidad relacionada
                    </Button>
                  )}
                  <Button variant="outlined" onClick={() => void handleAction(() => (item.readAtUtc ? markAdminNotificationAsUnread(item.id) : markAdminNotificationAsRead(item.id)))}>
                    {item.readAtUtc ? "Marcar como no leida" : "Marcar como leida"}
                  </Button>
                  <Button variant="text" onClick={() => void handleAction(() => dismissAdminNotification(item.id))}>
                    Descartar
                  </Button>
                  <Button variant="text" color="inherit" onClick={() => void handleAction(() => archiveAdminNotification(item.id))}>
                    Archivar
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
