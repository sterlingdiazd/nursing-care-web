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

import {
  getAdminClientDetail,
  updateAdminClient,
  updateAdminClientActiveState,
  type AdminClientDetail,
} from "../api/adminClients";
import AdminPortalShell from "../components/layout/AdminPortalShell";
import AdminClientForm, { emptyAdminClientFormValues, type AdminClientFormValues } from "../components/admin/AdminClientForm";
import { useCareRequestCatalogOptions } from "../hooks/useCareRequestCatalogOptions";
import { buildCatalogDisplayMaps } from "../utils/pricingFromCatalogOptions";
import {
  formatAdminCareRequestCurrency,
  formatAdminCareRequestDateTime,
  formatAdminCareRequestTypeLabel,
  getAdminCareRequestStatusLabel,
  getAdminCareRequestStatusStyles,
} from "../utils/adminCareRequests";
import {
  formatAdminClientCareRequestCount,
  formatAdminClientDateTime,
  formatAdminClientStatusLabel,
  getAdminClientStatusStyles,
} from "../utils/adminClients";
import { designTokens } from "../design-system/tokens";

function toFormValues(detail: AdminClientDetail): AdminClientFormValues {
  return {
    name: detail.name ?? "",
    lastName: detail.lastName ?? "",
    identificationNumber: detail.identificationNumber ?? "",
    phone: detail.phone ?? "",
    email: detail.email,
    password: "",
    confirmPassword: "",
  };
}

export default function AdminClientDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { data: catalogOptions } = useCareRequestCatalogOptions();
  const catalogDisplayMaps = useMemo(
    () => (catalogOptions ? buildCatalogDisplayMaps(catalogOptions) : null),
    [catalogOptions],
  );
  const [detail, setDetail] = useState<AdminClientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    (location.state as { successMessage?: string } | null)?.successMessage ?? null,
  );
  
  const initialFormValues = useMemo(() => {
    return detail ? toFormValues(detail) : emptyAdminClientFormValues;
  }, [detail]);

  const listPath = useMemo(
    () => ((location.state as { from?: string } | null)?.from ?? "/admin/clients"),
    [location.state],
  );

  const loadDetail = async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getAdminClientDetail(id);
      setDetail(response);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible cargar el detalle del cliente.");
      setDetail(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDetail();
  }, [id]);

  const handleSave = async (values: AdminClientFormValues) => {
    if (!id) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await updateAdminClient(id, {
        name: values.name,
        lastName: values.lastName,
        identificationNumber: values.identificationNumber,
        phone: values.phone,
        email: values.email,
      });
      setDetail(response);
      setSuccessMessage("La informacion del cliente se actualizo correctamente.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible actualizar el cliente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActiveState = async () => {
    if (!id || !detail) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await updateAdminClientActiveState(id, !detail.isActive);
      setDetail(response);
      setSuccessMessage(
        response.isActive
          ? "El cliente se activo correctamente."
          : "El cliente se desactivo y quedo fuera del flujo operativo.",
      );
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible actualizar el estado del cliente.");
    } finally {
      setIsSaving(false);
    }
  };

  const statusStyles = detail ? getAdminClientStatusStyles(detail.isActive) : null;
  const subduedActionButtonSx = {
    justifyContent: "flex-start",
    color: designTokens.color.ink.secondary,
    borderColor: designTokens.color.border.strong,
    bgcolor: designTokens.color.surface.secondary,
    "&:hover": {
      borderColor: designTokens.color.border.accent,
      bgcolor: designTokens.color.surface.accent,
    },
  } as const;

  return (
    <AdminPortalShell
      eyebrow="Detalle de cliente"
      title={detail?.displayName ?? "Cliente administrativo"}
      description="Consulta identidad, estado de acceso, historial basico de solicitudes y acciones administrativas desde una sola vista enfocada en clientes."
      actions={(
        <>
          <Button variant="outlined" onClick={() => navigate(listPath)}>
            Volver al modulo
          </Button>
          <Button variant="contained" onClick={() => void loadDetail()} disabled={isLoading || isSaving}>
            Actualizar detalle
          </Button>
        </>
      )}
    >
      <Stack spacing={3} data-testid="admin-client-detail-page">
        {error && <Alert severity="error">{error}</Alert>}
        {successMessage && <Alert severity="success">{successMessage}</Alert>}
        {detail?.hasHistoricalCareRequests && (
          <Alert severity="info">
            Este cliente tiene historial de solicitudes. Si necesitas retirarlo del flujo operativo, usa la inactivacion en lugar de cualquier eliminacion manual.
          </Alert>
        )}

        {!isLoading && !detail && (
          <Alert severity="info" variant="outlined">
            No fue posible cargar el cliente solicitado.
          </Alert>
        )}

        {detail && (
          <Stack spacing={3}>
            <Paper sx={{ p: 3.5, borderRadius: 3.5 }}>
              <Stack spacing={2.2}>
                <Stack
                  direction={{ xs: "column", lg: "row" }}
                  spacing={1.5}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", lg: "center" }}
                >
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {statusStyles && (
                      <Chip
                        label={formatAdminClientStatusLabel(detail.isActive)}
                        sx={{ bgcolor: statusStyles.bg, color: statusStyles.color, fontWeight: 700 }}
                      />
                    )}
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
                    ["Solicitudes", formatAdminClientCareRequestCount(detail.ownedCareRequestsCount)],
                    ["Ultima actividad", formatAdminClientDateTime(detail.lastCareRequestAtUtc)],
                    ["Cliente desde", formatAdminClientDateTime(detail.createdAtUtc)],
                  ].map(([label, value]) => (
                    <Box key={label}>
                      <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.12em", fontSize: "0.7rem" }}>
                        {label}
                      </Typography>
                      <Typography sx={{ mt: 0.6, fontSize: "0.9rem", color: "text.secondary" }}>{value}</Typography>
                    </Box>
                  ))}
                </Box>
              </Stack>
            </Paper>

            <Stack spacing={2} direction={{ xs: "column", xl: "row" }}>
              <Paper sx={{ p: 3.5, borderRadius: 3.5, flex: 1 }}>
                <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                  Editar informacion
                </Typography>
                <Box sx={{ mt: 2.2 }}>
                  <AdminClientForm
                    mode="edit"
                    initialValues={initialFormValues}
                    isSubmitting={isSaving}
                    submitLabel="Guardar cambios"
                    onSubmit={handleSave}
                    onCancel={() => navigate(listPath)}
                  />
                </Box>
              </Paper>

              <Stack spacing={2} sx={{ flex: 0.8 }}>
                <Paper sx={{ p: 3.5, borderRadius: 3.5 }}>
                  <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                    Acciones
                  </Typography>
                  <Stack spacing={1.5} sx={{ mt: 2.2 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => navigate("/admin/care-requests/new", {
                        state: {
                          presetClientUserId: detail.userId,
                          backPath: `/admin/clients/${detail.userId}`,
                        },
                      })}
                      disabled={!detail.canAdminCreateCareRequest}
                      sx={subduedActionButtonSx}
                    >
                      Crear solicitud para este cliente
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => void handleToggleActiveState()}
                      disabled={isSaving}
                      sx={subduedActionButtonSx}
                    >
                      {detail.isActive ? "Desactivar cliente" : "Activar cliente"}
                    </Button>
                  </Stack>
                </Paper>
              </Stack>
            </Stack>

            {detail.careRequestHistory.length > 0 && (
              <Paper sx={{ p: 3.5, borderRadius: 3.5 }}>
                <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                  Historial de solicitudes ({detail.careRequestHistory.length})
                </Typography>

                <Stack spacing={2} sx={{ mt: 2.2 }}>
                  {detail.careRequestHistory.map((item) => {
                    const statusChip = getAdminCareRequestStatusStyles(item.status);

                    return (
                      <Paper key={item.careRequestId} sx={{ p: 2.4, borderRadius: 3, bgcolor: "rgba(255,255,255,0.68)" }}>
                        <Stack spacing={1.4}>
                          <Stack
                            direction={{ xs: "column", lg: "row" }}
                            spacing={1.2}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", lg: "center" }}
                          >
                            <Box>
                              <Typography sx={{ fontWeight: 700 }}>{item.careRequestDescription}</Typography>
                              <Typography color="text.secondary" sx={{ mt: 0.4, fontSize: "0.85rem" }}>
                                {formatAdminCareRequestTypeLabel(item.careRequestType, catalogDisplayMaps?.careRequestType)}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                              <Chip
                                label={getAdminCareRequestStatusLabel(item.status)}
                                sx={{ bgcolor: statusChip.bg, color: statusChip.color, fontWeight: 700 }}
                              />
                              <Chip label={formatAdminCareRequestCurrency(item.total)} variant="outlined" />
                            </Stack>
                          </Stack>

                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
                              gap: 1.6,
                            }}
                          >
                            {[
                              ["Fecha", item.careRequestDate ?? "Sin fecha"],
                              ["Actualizada", formatAdminCareRequestDateTime(item.updatedAtUtc)],
                              [
                                "Enfermera",
                                item.assignedNurseDisplayName
                                  ? `${item.assignedNurseDisplayName} · ${item.assignedNurseEmail ?? "Sin correo"}`
                                  : "Sin asignar",
                              ],
                            ].map(([label, value]) => (
                              <Box key={label}>
                                <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.12em", fontSize: "0.65rem" }}>
                                  {label}
                                </Typography>
                                <Typography sx={{ mt: 0.45, fontSize: "0.85rem" }}>{value}</Typography>
                              </Box>
                            ))}
                          </Box>

                          <Button
                            variant="text"
                            size="small"
                            onClick={() => navigate(`/admin/care-requests/${item.careRequestId}`)}
                          >
                            Ver detalles
                          </Button>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              </Paper>
            )}
          </Stack>
        )}
      </Stack>
    </AdminPortalShell>
  );
}
