import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { type CareRequest, getCareRequests } from "../api/careRequests";
import AdminPortalShell from "../components/layout/AdminPortalShell";

type AdminCareRequestView =
  | "all"
  | "unassigned"
  | "pending-approval"
  | "rejected-today"
  | "approved-incomplete"
  | "overdue";

interface ViewOption {
  value: AdminCareRequestView;
  label: string;
}

const viewOptions: ViewOption[] = [
  { value: "all", label: "Todas" },
  { value: "unassigned", label: "Sin asignar" },
  { value: "pending-approval", label: "Listas para aprobacion" },
  { value: "rejected-today", label: "Rechazadas hoy" },
  { value: "approved-incomplete", label: "Aprobadas sin cierre" },
  { value: "overdue", label: "Atrasadas o estancadas" },
];

function getStatusStyles(status: CareRequest["status"]) {
  switch (status) {
    case "Approved":
      return { bg: "rgba(44, 122, 100, 0.12)", color: "#205e4d", label: "Aprobada" };
    case "Rejected":
      return { bg: "rgba(183, 79, 77, 0.12)", color: "#9a3f3d", label: "Rechazada" };
    case "Completed":
      return { bg: "rgba(59, 108, 141, 0.12)", color: "#295774", label: "Completada" };
    default:
      return { bg: "rgba(193, 138, 66, 0.14)", color: "#8a5e22", label: "Pendiente" };
  }
}

function resolveView(search: string): AdminCareRequestView {
  const value = new URLSearchParams(search).get("view");

  return viewOptions.some((item) => item.value === value)
    ? (value as AdminCareRequestView)
    : "all";
}

function resolveSelectedRequestId(search: string) {
  return new URLSearchParams(search).get("selected");
}

function getUtcDateKey(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

function isOverdueOrStale(item: CareRequest) {
  const todayUtc = new Date().toISOString().slice(0, 10);
  const staleCutoff = Date.now() - 48 * 60 * 60 * 1000;

  if (item.status === "Completed") {
    return false;
  }

  if (item.careRequestDate) {
    return item.careRequestDate < todayUtc;
  }

  return item.status === "Pending" && new Date(item.updatedAtUtc).getTime() <= staleCutoff;
}

function matchesView(item: CareRequest, view: AdminCareRequestView) {
  switch (view) {
    case "unassigned":
      return item.status === "Pending" && !item.assignedNurse;
    case "pending-approval":
      return item.status === "Pending" && Boolean(item.assignedNurse);
    case "rejected-today":
      return item.status === "Rejected" && getUtcDateKey(item.rejectedAtUtc) === new Date().toISOString().slice(0, 10);
    case "approved-incomplete":
      return item.status === "Approved";
    case "overdue":
      return isOverdueOrStale(item);
    default:
      return true;
  }
}

function formatAssignedNurse(item: CareRequest) {
  if (!item.assignedNurse) {
    return "Sin asignar";
  }

  return item.assignedNurse;
}

export default function AdminCareRequestsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [careRequests, setCareRequests] = useState<CareRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentView = resolveView(location.search);
  const selectedRequestId = resolveSelectedRequestId(location.search);

  const loadCareRequests = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getCareRequests();
      setCareRequests(response);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible cargar las solicitudes administrativas.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCareRequests();
  }, []);

  const filteredRequests = useMemo(
    () => careRequests.filter((item) => matchesView(item, currentView)),
    [careRequests, currentView],
  );

  const summary = useMemo(
    () => ({
      total: careRequests.length,
      unassigned: careRequests.filter((item) => matchesView(item, "unassigned")).length,
      pendingApproval: careRequests.filter((item) => matchesView(item, "pending-approval")).length,
      overdue: careRequests.filter((item) => matchesView(item, "overdue")).length,
    }),
    [careRequests],
  );

  return (
    <AdminPortalShell
      eyebrow="Solicitudes administrativas"
      title="Una cola inicial para leer el trabajo que exige accion administrativa."
      description="Esta vista base del portal admin concentra las solicitudes necesarias para los KPI del tablero. El modulo completo de gestion administrativa se ampliara en la siguiente entrega sin romper estas rutas."
      actions={
        <>
          <Button variant="outlined" onClick={() => navigate("/admin")}>
            Volver al panel principal
          </Button>
          <Button variant="contained" onClick={() => void loadCareRequests()} disabled={isLoading}>
            Actualizar solicitudes
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
            ["Solicitudes visibles", summary.total],
            ["Sin asignar", summary.unassigned],
            ["Listas para aprobacion", summary.pendingApproval],
            ["Atrasadas o estancadas", summary.overdue],
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
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} flexWrap="wrap">
            {viewOptions.map((option) => (
              <Button
                key={option.value}
                variant={currentView === option.value ? "contained" : "text"}
                onClick={() => navigate(option.value === "all" ? "/admin/care-requests" : `/admin/care-requests?view=${option.value}`)}
              >
                {option.label}
              </Button>
            ))}
          </Stack>
        </Paper>

        <Paper sx={{ p: 2.5, borderRadius: 3.5 }}>
          <Stack spacing={1.5}>
            {!isLoading && filteredRequests.length === 0 && (
              <Alert severity="info" variant="outlined">
                No hay solicitudes para el filtro seleccionado en este momento.
              </Alert>
            )}

            {filteredRequests.map((careRequest) => {
              const status = getStatusStyles(careRequest.status);
              const flagged = isOverdueOrStale(careRequest);
              const selected = careRequest.id === selectedRequestId;

              return (
                <Paper
                  key={careRequest.id}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    boxShadow: selected ? "0 18px 32px rgba(183, 128, 60, 0.14)" : "none",
                    border: selected
                      ? "1px solid rgba(183, 128, 60, 0.32)"
                      : "1px solid rgba(23, 48, 66, 0.08)",
                    bgcolor: selected ? "rgba(246, 234, 215, 0.36)" : "background.paper",
                  }}
                >
                  <Stack spacing={1.5}>
                    <Stack
                      direction={{ xs: "column", lg: "row" }}
                      spacing={1.2}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", lg: "center" }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h5" sx={{ maxWidth: 760 }}>
                          {careRequest.careRequestDescription}
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.8 }}>
                          Solicitud {careRequest.id}
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
                          label={status.label}
                          sx={{
                            bgcolor: status.bg,
                            color: status.color,
                            fontWeight: 700,
                          }}
                        />
                        {flagged && (
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
                        gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
                        gap: 1.5,
                      }}
                    >
                      {[
                        ["Cliente", careRequest.userID],
                        ["Enfermera asignada", formatAssignedNurse(careRequest)],
                        ["Fecha del servicio", careRequest.careRequestDate ?? "Sin fecha"],
                        ["Creada", new Date(careRequest.createdAtUtc).toLocaleString()],
                        ["Actualizada", new Date(careRequest.updatedAtUtc).toLocaleString()],
                        ["Tipo", careRequest.careRequestType ?? "Sin tipo"],
                      ].map(([label, value]) => (
                        <Box key={label}>
                          <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.12em" }}>
                            {label}
                          </Typography>
                          <Typography sx={{ mt: 0.35 }}>{value}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        </Paper>

        <Alert severity="info" variant="outlined">
          Esta base ya recibe los filtros del tablero. El detalle administrativo completo de solicitudes se expandira en la siguiente entrega del portal.
        </Alert>
      </Stack>
    </AdminPortalShell>
  );
}
