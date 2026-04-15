import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
  getNurseProfileForAdmin,
  setNurseOperationalAccessForAdmin,
  type NurseProfileAdminRecord,
} from "../api/adminNurseProfiles";
import {
  formatNurseDisplayName,
  formatNurseWorkloadSummary,
  getNurseReadinessLabel,
  getNurseStatusLabel,
  getNurseStatusStyles,
} from "../utils/adminNurseProfiles";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminNurseProfileDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [detail, setDetail] = useState<NurseProfileAdminRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listPath = useMemo(
    () => ((location.state as { from?: string } | null)?.from ?? "/admin/nurse-profiles"),
    [location.state],
  );
  const successMessage = (location.state as { successMessage?: string } | null)?.successMessage ?? null;

  const loadDetail = async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getNurseProfileForAdmin(id);
      setDetail(response);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible cargar el perfil.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDetail();
  }, [id]);

  const handleOperationalAccessToggle = async () => {
    if (!id || !detail) {
      return;
    }

    setIsActing(true);
    setError(null);

    try {
      const response = await setNurseOperationalAccessForAdmin(
        id,
        !(detail.userIsActive && detail.nurseProfileIsActive),
      );
      setDetail(response);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible actualizar el acceso operativo.");
    } finally {
      setIsActing(false);
    }
  };

  const statusStyles = detail ? getNurseStatusStyles(detail) : null;

  return (
    <AdminPortalShell
      eyebrow="Administracion de enfermeria"
      title={detail ? formatNurseDisplayName(detail) : "Detalle de enfermeria"}
      description=""
      actions={(
        <>
          <Button variant="outlined" onClick={() => navigate(listPath)}>
            Volver al modulo
          </Button>
          <Button variant="contained" onClick={() => void loadDetail()} disabled={isLoading || isActing}>
            Actualizar detalle
          </Button>
        </>
      )}
    >
      <Stack spacing={3} data-testid="admin-nurse-detail-page">
        {error && <Alert severity="error">{error}</Alert>}
        {successMessage && <Alert severity="success">{successMessage}</Alert>}
        {detail?.hasHistoricalCareRequests && (
          <Alert severity="info">
            Este perfil tiene historial de solicitudes. Si debes retirarlo de operacion, usa la inactivacion y evita tratarlo como un registro eliminable.
          </Alert>
        )}

        {detail && (
          <Stack spacing={3}>
            <Paper sx={{ p: 3.5, borderRadius: 3.5 }}>
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: "column", lg: "row" }}
                  spacing={1.5}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", lg: "center" }}
                >
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {statusStyles && (
                      <Chip label={getNurseStatusLabel(detail)} sx={{ bgcolor: statusStyles.bg, color: statusStyles.color, fontWeight: 700 }} />
                    )}
                    <Chip label={getNurseReadinessLabel(detail)} variant="outlined" />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">ID: {detail.userId}</Typography>
                </Stack>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
                    gap: 2,
                  }}
                >
                  {[
                    ["Correo", detail.email],
                    ["Cedula", detail.identificationNumber ?? "Sin cedula"],
                    ["Telefono", detail.phone ?? "Sin telefono"],
                  ].map(([label, value]) => (
                    <Box key={label}>
                      <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.12em", fontSize: "0.7rem" }}>
                        {label}
                      </Typography>
                      <Typography sx={{ mt: 0.6, fontWeight: 500 }}>{value}</Typography>
                    </Box>
                  ))}
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
                    gap: 2,
                    mt: 1,
                  }}
                >
                  {[
                    ["Especialidad", detail.specialty ?? "Sin especialidad"],
                    ["Categoria", detail.category ?? "Sin categoria"],
                    ["Licencia", detail.licenseId ?? "Sin licencia"],
                  ].map(([label, value]) => (
                    <Box key={label}>
                      <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.12em", fontSize: "0.7rem" }}>
                        {label}
                      </Typography>
                      <Typography sx={{ mt: 0.6, fontSize: "0.9rem" }}>{value}</Typography>
                    </Box>
                  ))}
                </Box>
              </Stack>
            </Paper>

            <Stack spacing={2} direction={{ xs: "column", xl: "row" }}>
              <Paper sx={{ p: 3.5, borderRadius: 3.5, flex: 1 }}>
                <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                  Carga operativa
                </Typography>
                <Stack spacing={1.2} sx={{ mt: 2.2 }}>
                  <Typography variant="h6">{formatNurseWorkloadSummary(detail.workload)}</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: "0.85rem" }}>
                    {detail.workload?.lastCareRequestAtUtc ? formatDateTime(detail.workload.lastCareRequestAtUtc) : "Sin registros de actividad"}
                  </Typography>
                </Stack>
              </Paper>

              <Stack spacing={2} sx={{ flex: 0.8 }}>
                <Paper sx={{ p: 3.5, borderRadius: 3.5 }}>
                  <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                    Acciones
                  </Typography>
                  <Stack spacing={1.5} sx={{ mt: 2.2 }}>
                    {detail.isPendingReview ? (
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => navigate(`/admin/nurse-profiles/${detail.userId}/review`, { state: { from: listPath } })}
                      >
                        Completar revision
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={() => navigate(`/admin/nurse-profiles/${detail.userId}/edit`, { state: { from: listPath } })}
                        >
                          Editar perfil
                        </Button>
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => void handleOperationalAccessToggle()}
                          disabled={isActing}
                        >
                          {detail.userIsActive && detail.nurseProfileIsActive ? "Desactivar" : "Activar"}
                        </Button>
                      </>
                    )}
                  </Stack>
                </Paper>
              </Stack>
            </Stack>
          </Stack>
        )}
      </Stack>
    </AdminPortalShell>
  );
}
