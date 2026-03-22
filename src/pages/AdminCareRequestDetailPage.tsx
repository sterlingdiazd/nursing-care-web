import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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

import { getActiveNurseProfiles, type ActiveNurseProfileSummary } from "../api/adminNurseProfiles";
import { getAdminCareRequestDetail, type AdminCareRequestDetail } from "../api/adminCareRequests";
import { assignCareRequestNurse, transitionCareRequest } from "../api/careRequests";
import AdminPortalShell from "../components/layout/AdminPortalShell";
import { useCareRequestCatalogOptions } from "../hooks/useCareRequestCatalogOptions";
import { buildCatalogDisplayMaps } from "../utils/pricingFromCatalogOptions";
import {
  formatAdminCareRequestCategoryLabel,
  formatAdminCareRequestComplexityLabel,
  formatAdminCareRequestCurrency,
  formatAdminCareRequestDateTime,
  formatAdminCareRequestDistanceLabel,
  formatAdminCareRequestTypeLabel,
  formatAdminCareRequestUnitTypeLabel,
  getAdminCareRequestStatusLabel,
  getAdminCareRequestStatusStyles,
} from "../utils/adminCareRequests";

export default function AdminCareRequestDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { data: catalogOptions } = useCareRequestCatalogOptions();
  const catalogDisplayMaps = useMemo(
    () => (catalogOptions ? buildCatalogDisplayMaps(catalogOptions) : null),
    [catalogOptions],
  );
  const [detail, setDetail] = useState<AdminCareRequestDetail | null>(null);
  const [activeNurses, setActiveNurses] = useState<ActiveNurseProfileSummary[]>([]);
  const [assignedNurseId, setAssignedNurseId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listPath = `/admin/care-requests${location.search}`;

  const loadDetail = async () => {
    if (!id) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [detailResponse, nurseResponse] = await Promise.all([
        getAdminCareRequestDetail(id),
        getActiveNurseProfiles(),
      ]);

      setDetail(detailResponse);
      setAssignedNurseId(detailResponse.assignedNurseUserId ?? "");
      setActiveNurses(nurseResponse);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible cargar el detalle administrativo.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDetail();
  }, [id]);

  const runAssignment = async () => {
    if (!id || !assignedNurseId) {
      return;
    }

    setIsActing(true);
    setError(null);

    try {
      await assignCareRequestNurse(id, { assignedNurse: assignedNurseId });
      await loadDetail();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible asignar la enfermera.");
    } finally {
      setIsActing(false);
    }
  };

  const runTransition = async (action: "approve" | "reject") => {
    if (!id) {
      return;
    }

    setIsActing(true);
    setError(null);

    try {
      await transitionCareRequest(id, action);
      await loadDetail();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible actualizar la solicitud.");
    } finally {
      setIsActing(false);
    }
  };

  const statusStyles = detail ? getAdminCareRequestStatusStyles(detail.status) : null;
  const statusLabel = detail ? getAdminCareRequestStatusLabel(detail.status) : "";
  const canApproveOrReject = detail?.status === "Pending";
  const canApprove = canApproveOrReject && Boolean(detail?.assignedNurseUserId ?? assignedNurseId);

  return (
    <AdminPortalShell
      eyebrow="Detalle administrativo"
      title={detail?.careRequestDescription ?? "Detalle de solicitud administrativa"}
      description="Revisa la informacion comercial y operativa de la solicitud, junto con la linea de tiempo actualmente persistida y las acciones administrativas disponibles."
      actions={
        <>
          <Button variant="outlined" onClick={() => navigate(listPath)}>
            Volver al modulo
          </Button>
          <Button variant="contained" onClick={() => void loadDetail()} disabled={isLoading || isActing}>
            Actualizar detalle
          </Button>
        </>
      }
    >
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        {detail && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", xl: "1.1fr 0.9fr" },
              gap: 3,
            }}
          >
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
                          label={statusLabel}
                          sx={{
                            bgcolor: statusStyles.bg,
                            color: statusStyles.color,
                            fontWeight: 700,
                          }}
                        />
                      )}
                      {detail.isOverdueOrStale && (
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
                    <Typography color="text.secondary">Solicitud {detail.id}</Typography>
                  </Stack>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                      gap: 1.8,
                    }}
                  >
                    {[
                      ["Cliente", `${detail.clientDisplayName} · ${detail.clientEmail}`],
                      [
                        "Enfermera asignada",
                        detail.assignedNurseDisplayName
                          ? `${detail.assignedNurseDisplayName} · ${detail.assignedNurseEmail ?? "Sin correo"}`
                          : "Sin asignar",
                      ],
                      ["Cedula del cliente", detail.clientIdentificationNumber ?? "Sin cedula"],
                      ["Enfermera sugerida", detail.suggestedNurse ?? "Sin sugerencia"],
                      [
                        "Tipo",
                        formatAdminCareRequestTypeLabel(detail.careRequestType, catalogDisplayMaps?.careRequestType),
                      ],
                      [
                        "Unidad",
                        `${detail.unit} ${formatAdminCareRequestUnitTypeLabel(detail.unitType, catalogDisplayMaps?.unitType)}`,
                      ],
                      ["Fecha del servicio", detail.careRequestDate ?? "Sin fecha"],
                      ["Creada", formatAdminCareRequestDateTime(detail.createdAtUtc)],
                    ].map(([label, value]) => (
                      <Box key={label}>
                        <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.12em" }}>
                          {label}
                        </Typography>
                        <Typography sx={{ mt: 0.45 }}>{value}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Stack>
              </Paper>

              <Paper sx={{ p: 3.5, borderRadius: 3.5 }}>
                <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                  Desglose de precios
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                    gap: 1.6,
                    mt: 2.2,
                  }}
                >
                  {[
                    [
                      "Categoria",
                      formatAdminCareRequestCategoryLabel(
                        detail.pricingBreakdown.category,
                        catalogDisplayMaps?.category,
                      ),
                    ],
                    ["Precio base", formatAdminCareRequestCurrency(detail.pricingBreakdown.basePrice)],
                    ["Factor de categoria", detail.pricingBreakdown.categoryFactor.toFixed(2)],
                    [
                      "Factor de distancia",
                      `${formatAdminCareRequestDistanceLabel(detail.pricingBreakdown.distanceFactor, catalogDisplayMaps?.distance)} · ${detail.pricingBreakdown.distanceFactorValue.toFixed(2)}`,
                    ],
                    [
                      "Factor de complejidad",
                      `${formatAdminCareRequestComplexityLabel(detail.pricingBreakdown.complexityLevel, catalogDisplayMaps?.complexity)} · ${detail.pricingBreakdown.complexityFactorValue.toFixed(2)}`,
                    ],
                    ["Descuento por volumen", `${detail.pricingBreakdown.volumeDiscountPercent.toFixed(2)}%`],
                    ["Subtotal antes de insumos", formatAdminCareRequestCurrency(detail.pricingBreakdown.subtotalBeforeSupplies)],
                    ["Insumos medicos", formatAdminCareRequestCurrency(detail.pricingBreakdown.medicalSuppliesCost)],
                    ["Total", formatAdminCareRequestCurrency(detail.pricingBreakdown.total)],
                  ].map(([label, value]) => (
                    <Paper
                      key={label}
                      sx={{
                        p: 2.2,
                        borderRadius: 2.5,
                        bgcolor: "rgba(247, 244, 238, 0.72)",
                        boxShadow: "none",
                      }}
                    >
                      <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.12em" }}>
                        {label}
                      </Typography>
                      <Typography sx={{ mt: 0.65, fontWeight: 700 }}>{value}</Typography>
                    </Paper>
                  ))}
                </Box>
              </Paper>
            </Stack>

            <Stack spacing={3}>
              <Paper sx={{ p: 3.5, borderRadius: 3.5 }}>
                <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                  Linea de tiempo actual
                </Typography>
                <Stack spacing={1.6} sx={{ mt: 2.2 }}>
                  {detail.timeline.map((event) => (
                    <Paper
                      key={event.id}
                      sx={{
                        p: 2.4,
                        borderRadius: 2.6,
                        bgcolor: "rgba(240, 247, 250, 0.84)",
                        boxShadow: "none",
                      }}
                    >
                      <Typography variant="h6">{event.title}</Typography>
                      <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.7 }}>
                        {event.description}
                      </Typography>
                      <Typography sx={{ mt: 1.1, color: "#295774", fontWeight: 700 }}>
                        {formatAdminCareRequestDateTime(event.occurredAtUtc)}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              </Paper>

              <Paper sx={{ p: 3.5, borderRadius: 3.5 }}>
                <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                  Asignacion de enfermeria
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 2.2 }}>
                  <TextField
                    select
                    label="Enfermera asignada"
                    value={assignedNurseId}
                    onChange={(event) => setAssignedNurseId(event.target.value)}
                    SelectProps={{ native: true }}
                    disabled={isActing}
                  >
                    <option value="">Selecciona una enfermera activa</option>
                    {activeNurses.map((nurse) => (
                      <option key={nurse.userId} value={nurse.userId}>
                        {[nurse.name, nurse.lastName].filter(Boolean).join(" ") || nurse.email}
                      </option>
                    ))}
                  </TextField>
                  <Button variant="contained" onClick={runAssignment} disabled={isActing || !assignedNurseId}>
                    {detail.assignedNurseUserId ? "Reasignar enfermera" : "Asignar enfermera"}
                  </Button>
                </Stack>
              </Paper>

              <Paper sx={{ p: 3.5, borderRadius: 3.5, bgcolor: "#f3ede0" }}>
                <Typography variant="overline" sx={{ color: "#8c6430", letterSpacing: "0.16em" }}>
                  Acciones administrativas
                </Typography>
                <Stack spacing={1.25} sx={{ mt: 2.2 }}>
                  {canApproveOrReject && (
                    <>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => void runTransition("approve")}
                        disabled={isActing || !canApprove}
                      >
                        Aprobar solicitud
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => void runTransition("reject")}
                        disabled={isActing}
                      >
                        Rechazar solicitud
                      </Button>
                    </>
                  )}

                  {canApproveOrReject && !canApprove && (
                    <Alert severity="info" variant="outlined">
                      Debes asignar una enfermera activa antes de aprobar la solicitud.
                    </Alert>
                  )}

                  {detail.status === "Approved" && (
                    <Alert severity="info" variant="outlined">
                      La completacion corresponde exclusivamente a la enfermera asignada.
                    </Alert>
                  )}

                  {!canApproveOrReject && detail.status !== "Approved" && (
                    <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      No hay acciones administrativas disponibles para el estado actual.
                    </Typography>
                  )}
                </Stack>
              </Paper>
            </Stack>
          </Box>
        )}
      </Stack>
    </AdminPortalShell>
  );
}
