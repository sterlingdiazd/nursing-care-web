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

import { CareRequest, getCareRequests } from "../api/careRequests";
import WorkspaceShell from "../components/layout/WorkspaceShell";
import { useAuth } from "../context/AuthContext";

function getStatusStyles(status: CareRequest["status"]) {
  switch (status) {
    case "Approved":
      return { bg: "rgba(44, 122, 100, 0.12)", color: "#205e4d" };
    case "Rejected":
      return { bg: "rgba(183, 79, 77, 0.12)", color: "#9a3f3d" };
    case "Completed":
      return { bg: "rgba(59, 108, 141, 0.12)", color: "#295774" };
    default:
      return { bg: "rgba(193, 138, 66, 0.14)", color: "#8a5e22" };
  }
}

function getStatusLabel(status: CareRequest["status"]) {
  switch (status) {
    case "Approved":
      return "Aprobada";
    case "Rejected":
      return "Rechazada";
    case "Completed":
      return "Completada";
    default:
      return "Pendiente";
  }
}

export default function CareRequestsListPage() {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const [careRequests, setCareRequests] = useState<CareRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCareRequests = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getCareRequests();
      setCareRequests(response);
    } catch (nextError: any) {
      setError(nextError.message ?? "No fue posible cargar las solicitudes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCareRequests();
  }, []);

  const summary = useMemo(() => {
    return {
      total: careRequests.length,
      pending: careRequests.filter((item) => item.status === "Pending").length,
      approved: careRequests.filter((item) => item.status === "Approved").length,
      completed: careRequests.filter((item) => item.status === "Completed").length,
    };
  }, [careRequests]);

  return (
    <WorkspaceShell
      eyebrow="Cola de solicitudes"
      title="Supervisa captura, revision y cierre desde una sola cola."
      description="La cola permite leer el estado de cada solicitud de un vistazo, mientras el detalle concentra contexto y acciones."
      actions={
        <>
          <Button variant="outlined" onClick={loadCareRequests} disabled={isLoading}>
            Actualizar cola
          </Button>
          {(roles.includes("User") || roles.includes("Nurse") || roles.includes("Admin")) && (
            <Button variant="contained" onClick={() => navigate("/care-request")}>
              Nueva solicitud
            </Button>
          )}
        </>
      }
    >
      <Stack spacing={3}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          {[
            ["Solicitudes totales", String(summary.total)],
            ["Pendientes de revision", String(summary.pending)],
            ["Aprobadas", String(summary.approved)],
            ["Completadas", String(summary.completed)],
          ].map(([label, value]) => (
            <Paper key={label} sx={{ p: 3, borderRadius: 2.5 }}>
              <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                {label}
              </Typography>
              <Typography variant="h3" sx={{ mt: 1.1 }}>
                {value}
              </Typography>
            </Paper>
          ))}
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Stack spacing={1.5}>
            {careRequests.length === 0 && !isLoading ? (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6">Todavia no hay solicitudes</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  Crea la primera solicitud para iniciar el flujo operativo.
                </Typography>
              </Box>
            ) : (
              careRequests.map((careRequest) => {
                const statusStyles = getStatusStyles(careRequest.status);
                const statusLabel = getStatusLabel(careRequest.status);

                return (
                  <Paper
                    key={careRequest.id}
                    sx={{
                      p: 3,
                      borderRadius: 2.5,
                      boxShadow: "none",
                      border: "1px solid rgba(23, 48, 66, 0.08)",
                    }}
                  >
                    <Stack
                      direction={{ xs: "column", xl: "row" }}
                      spacing={2}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", xl: "center" }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1}
                          alignItems={{ xs: "flex-start", sm: "center" }}
                          sx={{ mb: 1.1 }}
                        >
                          <Typography variant="h5" sx={{ maxWidth: 640 }}>
                            {careRequest.careRequestDescription}
                          </Typography>
                          <Chip
                            label={statusLabel}
                            sx={{
                              bgcolor: statusStyles.bg,
                              color: statusStyles.color,
                              fontWeight: 700,
                            }}
                          />
                        </Stack>
                        <Typography color="text.secondary">
                          Usuario {careRequest.userID}
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.8 }}>
                          Creada {new Date(careRequest.createdAtUtc).toLocaleString()}
                        </Typography>
                      </Box>

                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                        <Button
                          variant="outlined"
                          onClick={() => navigate(`/care-requests/${careRequest.id}`)}
                        >
                          Ver detalle
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })
            )}
          </Stack>
        </Paper>
      </Stack>
    </WorkspaceShell>
  );
}
