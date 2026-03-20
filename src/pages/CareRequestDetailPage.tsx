import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  CareRequest,
  CareRequestTransitionAction,
  getCareRequestById,
  transitionCareRequest,
} from "../api/careRequests";
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

export default function CareRequestDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { roles } = useAuth();
  const [careRequest, setCareRequest] = useState<CareRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCareRequest = async () => {
    if (!id) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getCareRequestById(id);
      setCareRequest(response);
    } catch (nextError: any) {
      setError(nextError.message ?? "No fue posible cargar la solicitud.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCareRequest();
  }, [id]);

  const runAction = async (action: CareRequestTransitionAction) => {
    if (!id) {
      return;
    }

    setIsActing(true);
    setError(null);

    try {
      const updated = await transitionCareRequest(id, action);
      setCareRequest(updated);
    } catch (nextError: any) {
      setError(nextError.message ?? "No fue posible actualizar la solicitud.");
    } finally {
      setIsActing(false);
    }
  };

  const canApproveOrReject = roles.includes("Admin") && careRequest?.status === "Pending";
  const canComplete =
    (roles.includes("Admin") || roles.includes("Nurse")) && careRequest?.status === "Approved";
  const statusStyles = careRequest ? getStatusStyles(careRequest.status) : null;
  const statusLabel = careRequest ? getStatusLabel(careRequest.status) : "";

  return (
    <WorkspaceShell
      eyebrow="Detalle de solicitud"
      title={careRequest?.careRequestDescription ?? "Revisa el estado y el detalle del ciclo de vida de la solicitud."}
      description="Usa esta vista para inspeccionar identificadores, marcas de tiempo y las acciones disponibles segun el rol actual."
      actions={
        <>
          <Button variant="outlined" onClick={() => navigate("/care-requests")}>
            Volver a la cola
          </Button>
          <Button variant="outlined" onClick={loadCareRequest} disabled={isLoading || isActing}>
            Actualizar
          </Button>
        </>
      }
    >
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        {careRequest && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", xl: "1.25fr 0.75fr" },
              gap: 3,
            }}
          >
            <Paper sx={{ p: 4, borderRadius: 3 }}>
              <Stack spacing={3}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.25}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                >
                  {statusStyles && (
                    <Chip
                      label={statusLabel}
                      sx={{
                        bgcolor: statusStyles.bg,
                        color: statusStyles.color,
                        fontWeight: 700,
                      }}
                    />
                  )}
                  <Typography color="text.secondary">
                    ID de solicitud {careRequest.id}
                  </Typography>
                </Stack>

                <Divider />

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                    gap: 2,
                  }}
                >
                  {[
                    ["ID de usuario", careRequest.userID],
                    ["Creada", new Date(careRequest.createdAtUtc).toLocaleString()],
                    ["Actualizada", new Date(careRequest.updatedAtUtc).toLocaleString()],
                    ["Estado actual", statusLabel],
                  ].map(([label, value]) => (
                    <Paper
                      key={label}
                      sx={{ p: 2.5, borderRadius: 2.5, bgcolor: "rgba(247, 244, 238, 0.72)" }}
                    >
                      <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                        {label}
                      </Typography>
                      <Typography sx={{ mt: 0.9, fontWeight: 700 }}>{value}</Typography>
                    </Paper>
                  ))}
                </Box>
              </Stack>
            </Paper>

            <Stack spacing={3}>
              <Paper sx={{ p: 3, borderRadius: 2.5 }}>
                <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                  Historial de transiciones
                </Typography>
                <Stack spacing={1.3} sx={{ mt: 2 }}>
                  {[
                    ["Aprobada", careRequest.approvedAtUtc],
                    ["Rechazada", careRequest.rejectedAtUtc],
                    ["Completada", careRequest.completedAtUtc],
                  ].map(([label, value]) => (
                    <Box key={label} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                      <Typography sx={{ fontWeight: 700 }}>{label}</Typography>
                      <Typography color="text.secondary">
                        {value ? new Date(value).toLocaleString() : "Sin registro"}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>

              <Paper sx={{ p: 3, borderRadius: 2.5, bgcolor: "#f3ede0" }}>
                <Typography variant="overline" sx={{ color: "#8c6430", letterSpacing: "0.16em" }}>
                  Acciones disponibles
                </Typography>
                <Stack spacing={1.25} sx={{ mt: 2 }}>
                  {canApproveOrReject && (
                    <>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => runAction("approve")}
                        disabled={isActing}
                      >
                        Aprobar solicitud
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => runAction("reject")}
                        disabled={isActing}
                      >
                        Rechazar solicitud
                      </Button>
                    </>
                  )}

                  {canComplete && (
                    <Button
                      variant="contained"
                      onClick={() => runAction("complete")}
                      disabled={isActing}
                    >
                      Marcar como completada
                    </Button>
                  )}

                  {!canApproveOrReject && !canComplete && (
                    <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      No hay transiciones disponibles para esta combinacion de solicitud y rol.
                    </Typography>
                  )}
                </Stack>
              </Paper>
            </Stack>
          </Box>
        )}
      </Stack>
    </WorkspaceShell>
  );
}
