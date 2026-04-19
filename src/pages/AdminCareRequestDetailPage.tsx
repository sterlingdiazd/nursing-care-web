import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { getActiveNurseProfiles, type ActiveNurseProfileSummary } from "../api/adminNurseProfiles";
import {
  getAdminCareRequestDetail,
  invoiceCareRequest,
  payCareRequest,
  voidCareRequest,
  generateReceipt,
  registerAdminCareRequestShift,
  recordAdminCareRequestShiftChange,
  type AdminCareRequestDetail,
} from "../api/adminCareRequests";
import {
  assignCareRequestNurse,
  transitionCareRequest,
  verifyCareRequestPricing,
  type PricingVerificationResponse,
} from "../api/careRequests";
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
import { designTokens } from "../design-system/tokens";

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
  const [newShiftNurseId, setNewShiftNurseId] = useState("");
  const [newShiftStartLocal, setNewShiftStartLocal] = useState("");
  const [newShiftEndLocal, setNewShiftEndLocal] = useState("");
  const [shiftChangeDrafts, setShiftChangeDrafts] = useState<Record<string, { reason: string; newNurseId: string }>>({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<PricingVerificationResponse | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationOpen, setVerificationOpen] = useState(false);

  // Billing lifecycle state
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [bankReference, setBankReference] = useState("");
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);

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

  const updateShiftChangeDraft = (shiftId: string, patch: Partial<{ reason: string; newNurseId: string }>) => {
    setShiftChangeDrafts((prev) => {
      const current = prev[shiftId] ?? { reason: "", newNurseId: "" };
      return { ...prev, [shiftId]: { ...current, ...patch } };
    });
  };

  const runRegisterShift = async () => {
    if (!id) {
      return;
    }

    setIsActing(true);
    setError(null);

    try {
      await registerAdminCareRequestShift(id, {
        nurseUserId: newShiftNurseId || null,
        scheduledStartUtc: newShiftStartLocal ? new Date(newShiftStartLocal).toISOString() : null,
        scheduledEndUtc: newShiftEndLocal ? new Date(newShiftEndLocal).toISOString() : null,
      });
      setNewShiftNurseId("");
      setNewShiftStartLocal("");
      setNewShiftEndLocal("");
      await loadDetail();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible registrar el turno.");
    } finally {
      setIsActing(false);
    }
  };

  const runRecordShiftChange = async (shiftId: string) => {
    if (!id) {
      return;
    }

    const draft = shiftChangeDrafts[shiftId] ?? { reason: "", newNurseId: "" };
    if (!draft.reason.trim()) {
      setError("Debes indicar el motivo del cambio de turno.");
      return;
    }

    setIsActing(true);
    setError(null);

    try {
      await recordAdminCareRequestShiftChange(id, shiftId, {
        newNurseUserId: draft.newNurseId.trim() ? draft.newNurseId : null,
        reason: draft.reason.trim(),
      });
      updateShiftChangeDraft(shiftId, { reason: "", newNurseId: "" });
      await loadDetail();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible registrar el cambio de turno.");
    } finally {
      setIsActing(false);
    }
  };

  const runVerifyPricing = async () => {
    if (!id) {
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);
    setVerificationResult(null);

    try {
      const result = await verifyCareRequestPricing(id);
      setVerificationResult(result);
      setVerificationOpen(true);
    } catch (nextError) {
      setVerificationError(nextError instanceof Error ? nextError.message : "No fue posible verificar los precios.");
      setVerificationOpen(true);
    } finally {
      setIsVerifying(false);
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

  const runInvoice = async () => {
    if (!id || !invoiceNumber.trim()) return;
    setIsActing(true);
    setError(null);
    try {
      await invoiceCareRequest(id, { invoiceNumber: invoiceNumber.trim() });
      setInvoiceModalOpen(false);
      setInvoiceNumber("");
      await loadDetail();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible facturar la solicitud.");
    } finally {
      setIsActing(false);
    }
  };

  const runPay = async () => {
    if (!id || !bankReference.trim()) return;
    setIsActing(true);
    setError(null);
    try {
      await payCareRequest(id, { bankReference: bankReference.trim() });
      setPayModalOpen(false);
      setBankReference("");
      await loadDetail();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible confirmar el pago.");
    } finally {
      setIsActing(false);
    }
  };

  const runVoid = async () => {
    if (!id || !voidReason.trim()) return;
    setIsActing(true);
    setError(null);
    try {
      await voidCareRequest(id, { voidReason: voidReason.trim() });
      setVoidModalOpen(false);
      setVoidReason("");
      await loadDetail();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible anular la solicitud.");
    } finally {
      setIsActing(false);
    }
  };

  const runGenerateReceipt = async () => {
    if (!id) return;
    setIsGeneratingReceipt(true);
    setError(null);
    try {
      const result = await generateReceipt(id);
      const pdfBytes = Uint8Array.from(atob(result.receiptContentBase64), (c) => c.charCodeAt(0));
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `recibo-${result.receiptNumber}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      await loadDetail();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible generar el recibo.");
    } finally {
      setIsGeneratingReceipt(false);
    }
  };

  const statusStyles = detail ? getAdminCareRequestStatusStyles(detail.status) : null;
  const statusLabel = detail ? getAdminCareRequestStatusLabel(detail.status) : "";
  const canApproveOrReject = detail?.status === "Pending";
  const canApprove = canApproveOrReject && Boolean(detail?.assignedNurseUserId ?? assignedNurseId);
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

  const formatShiftStatusLabel = (status: string) => {
    switch (status) {
      case "Planned":
        return "Planeado";
      case "Completed":
        return "Completado";
      case "Changed":
        return "Modificado";
      case "Cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

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
      <Stack spacing={3} data-testid="admin-care-request-detail-page">
        {error && <Alert severity="error">{error}</Alert>}

        {detail && (
          <Box
            data-testid="care-request-detail-loaded"
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
                          data-testid="care-request-status-badge"
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
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.2 }}>
                  <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                    Desglose de precios
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => void runVerifyPricing()}
                    disabled={isVerifying}
                    data-testid="price-breakdown-verify-button"
                    sx={subduedActionButtonSx}
                  >
                    {isVerifying ? "Verificando..." : "Verificar precios"}
                  </Button>
                </Stack>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                    gap: 1.6,
                  }}
                >
                  {[
                    {
                      key: "category",
                      label: "Categoria",
                      value: formatAdminCareRequestCategoryLabel(
                        detail.pricingBreakdown.category,
                        catalogDisplayMaps?.category,
                      ),
                    },
                    { key: "base-price", label: "Precio base", value: formatAdminCareRequestCurrency(detail.pricingBreakdown.basePrice) },
                    { key: "category-factor", label: "Factor de categoria", value: detail.pricingBreakdown.categoryFactor.toFixed(2) },
                    {
                      key: "distance-factor",
                      label: "Factor de distancia",
                      value: `${formatAdminCareRequestDistanceLabel(detail.pricingBreakdown.distanceFactor, catalogDisplayMaps?.distance)} · ${detail.pricingBreakdown.distanceFactorValue.toFixed(2)}`,
                    },
                    {
                      key: "complexity-factor",
                      label: "Factor de complejidad",
                      value: `${formatAdminCareRequestComplexityLabel(detail.pricingBreakdown.complexityLevel, catalogDisplayMaps?.complexity)} · ${detail.pricingBreakdown.complexityFactorValue.toFixed(2)}`,
                    },
                    { key: "volume-discount", label: "Descuento por volumen", value: `${detail.pricingBreakdown.volumeDiscountPercent.toFixed(2)}%` },
                    {
                      key: "line-before-discount",
                      label: "Linea antes de descuento",
                      value: detail.pricingBreakdown.lineBeforeVolumeDiscount != null
                        ? `RD$ ${detail.pricingBreakdown.lineBeforeVolumeDiscount.toFixed(4)}`
                        : "N/A",
                    },
                    {
                      key: "unit-price-after-discount",
                      label: "Precio unitario tras descuento",
                      value: detail.pricingBreakdown.unitPriceAfterVolumeDiscount != null
                        ? `RD$ ${detail.pricingBreakdown.unitPriceAfterVolumeDiscount.toFixed(4)}`
                        : "N/A",
                    },
                    { key: "subtotal-before-supplies", label: "Subtotal antes de insumos", value: formatAdminCareRequestCurrency(detail.pricingBreakdown.subtotalBeforeSupplies) },
                    { key: "medical-supplies", label: "Insumos medicos", value: formatAdminCareRequestCurrency(detail.pricingBreakdown.medicalSuppliesCost) },
                    { key: "total", label: "Total", value: formatAdminCareRequestCurrency(detail.pricingBreakdown.total) },
                  ].map(({ key, label, value }) => (
                    <Paper
                      key={key}
                      sx={{
                        p: 2.2,
                        borderRadius: 2.5,
                        bgcolor: "rgba(247, 244, 238, 0.72)",
                        boxShadow: "none",
                      }}
                      data-testid={`price-breakdown-${key}`}
                    >
                      <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.12em" }}>
                        {label}
                      </Typography>
                      <Typography sx={{ mt: 0.65, fontWeight: 700 }}>{value}</Typography>
                    </Paper>
                  ))}
                </Box>
              </Paper>

              <Paper sx={{ p: 3.5, borderRadius: 3.5 }}>
                <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                  Snapshot de nomina
                </Typography>
                {detail.payrollCompensation ? (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                      gap: 1.6,
                      mt: 2.2,
                    }}
                  >
                    {[
                      ["Tipo de pago", detail.payrollCompensation.employmentType],
                      ["Variante de servicio", detail.payrollCompensation.serviceVariant],
                      ["Fecha ejecutada", formatAdminCareRequestDateTime(detail.payrollCompensation.executedAtUtc)],
                      ["Base pagable", formatAdminCareRequestCurrency(detail.payrollCompensation.baseCompensation)],
                      ["Incentivo por transporte", formatAdminCareRequestCurrency(detail.payrollCompensation.transportIncentive)],
                      ["Bono por complejidad", formatAdminCareRequestCurrency(detail.payrollCompensation.complexityBonus)],
                      ["Compensacion por insumos", formatAdminCareRequestCurrency(detail.payrollCompensation.medicalSuppliesCompensation)],
                      ["Ajustes", formatAdminCareRequestCurrency(detail.payrollCompensation.adjustmentsTotal)],
                      ["Deducciones", formatAdminCareRequestCurrency(detail.payrollCompensation.deductionsTotal)],
                      ["Bruto", formatAdminCareRequestCurrency(detail.payrollCompensation.grossCompensation)],
                      ["Neto", formatAdminCareRequestCurrency(detail.payrollCompensation.netCompensation)],
                      ["Regla base", `${detail.payrollCompensation.ruleBaseCompensationPercent.toFixed(2)}%`],
                    ].map(([label, value]) => (
                      <Paper
                        key={label}
                        sx={{
                          p: 2.2,
                          borderRadius: 2.5,
                          bgcolor: "rgba(241, 248, 239, 0.82)",
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
                ) : (
                  <Alert severity="info" variant="outlined" sx={{ mt: 2.2 }}>
                    La solicitud todavia no tiene una ejecucion registrada para nomina. El snapshot se genera automaticamente al completar el servicio.
                  </Alert>
                )}
              </Paper>

              {(detail.invoiceNumber || detail.paidAtUtc || detail.voidedAtUtc) && (
                <Paper sx={{ p: 3.5, borderRadius: 3.5 }} data-testid="invoice-details-section">
                  <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                    Informacion de facturacion
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                      gap: 1.6,
                      mt: 2.2,
                    }}
                  >
                    {detail.invoiceNumber && (
                      <Box>
                        <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.12em" }}>
                          Numero de factura
                        </Typography>
                        <Typography sx={{ mt: 0.45, fontWeight: 700 }} data-testid="receipt-number-display">{detail.invoiceNumber}</Typography>
                      </Box>
                    )}
                    {detail.invoicedAtUtc && (
                      <Box>
                        <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.12em" }}>
                          Fecha de factura
                        </Typography>
                        <Typography sx={{ mt: 0.45 }}>{formatAdminCareRequestDateTime(detail.invoicedAtUtc)}</Typography>
                      </Box>
                    )}
                    {detail.paidAtUtc && (
                      <Box data-testid="payment-details-section">
                        <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.12em" }}>
                          Fecha de pago
                        </Typography>
                        <Typography sx={{ mt: 0.45, fontWeight: 700, color: "#1a5e3a" }}>
                          {formatAdminCareRequestDateTime(detail.paidAtUtc)}
                        </Typography>
                      </Box>
                    )}
                    {detail.voidedAtUtc && (
                      <Box data-testid="void-details-section">
                        <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.12em" }}>
                          Anulada
                        </Typography>
                        <Typography sx={{ mt: 0.45, fontWeight: 700, color: "#8b1a1a" }}>
                          {formatAdminCareRequestDateTime(detail.voidedAtUtc)}
                        </Typography>
                      </Box>
                    )}
                    {detail.voidReason && (
                      <Box sx={{ gridColumn: "1 / -1" }}>
                        <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.12em" }}>
                          Motivo de anulacion
                        </Typography>
                        <Typography sx={{ mt: 0.45 }}>{detail.voidReason}</Typography>
                      </Box>
                    )}
                  </Box>
                  {detail.status === "Paid" && (
                    <Box sx={{ mt: 2.2 }} data-testid="receipt-details-section">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => void runGenerateReceipt()}
                        disabled={isGeneratingReceipt}
                        data-testid="generate-receipt-button"
                        sx={subduedActionButtonSx}
                      >
                        {isGeneratingReceipt ? "Generando recibo..." : "Generar / Descargar recibo"}
                      </Button>
                    </Box>
                  )}
                </Paper>
              )}

              <Paper sx={{ p: 3.5, borderRadius: 3.5 }}>
                <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                  Turnos de nomina
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
                  Registra turnos planeados para la solicitud y documenta cambios de enfermera con motivo. Los turnos completados no admiten modificaciones.
                </Typography>

                <Stack spacing={1.5} sx={{ mt: 2.4 }}>
                  <TextField
                    select
                    label="Enfermera del turno (opcional)"
                    value={newShiftNurseId}
                    onChange={(event) => setNewShiftNurseId(event.target.value)}
                    SelectProps={{ native: true }}
                    disabled={isActing}
                    fullWidth
                  >
                    <option value="">Sin asignar en el turno</option>
                    {activeNurses.map((nurse) => (
                      <option key={nurse.userId} value={nurse.userId}>
                        {[nurse.name, nurse.lastName].filter(Boolean).join(" ") || nurse.email}
                      </option>
                    ))}
                  </TextField>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                    <TextField
                      label="Inicio programado (opcional)"
                      type="datetime-local"
                      value={newShiftStartLocal}
                      onChange={(event) => setNewShiftStartLocal(event.target.value)}
                      disabled={isActing}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="Fin programado (opcional)"
                      type="datetime-local"
                      value={newShiftEndLocal}
                      onChange={(event) => setNewShiftEndLocal(event.target.value)}
                      disabled={isActing}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Stack>
                  <Button variant="contained" color="primary" onClick={() => void runRegisterShift()} disabled={isActing}>
                    Registrar turno
                  </Button>
                </Stack>

                <Stack spacing={2.2} sx={{ mt: 3 }}>
                  {detail.shifts.length === 0 ? (
                    <Alert severity="info" variant="outlined">
                      Aun no hay turnos registrados para esta solicitud.
                    </Alert>
                  ) : (
                    detail.shifts.map((shift) => {
                      const draft = shiftChangeDrafts[shift.id] ?? { reason: "", newNurseId: "" };
                      const canEditShift = shift.status !== "Completed";
                      return (
                        <Paper
                          key={shift.id}
                          sx={{
                            p: 2.4,
                            borderRadius: 2.6,
                            bgcolor: "rgba(250, 248, 252, 0.9)",
                            boxShadow: "none",
                          }}
                        >
                          <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                            <Chip label={formatShiftStatusLabel(shift.status)} size="small" sx={{ fontWeight: 700 }} />
                            <Typography variant="body2" color="text.secondary">
                              Turno {shift.id.slice(0, 8)}...
                            </Typography>
                          </Stack>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                              gap: 1,
                              mt: 1.5,
                            }}
                          >
                            <Typography variant="body2">
                              <strong>Enfermera:</strong>{" "}
                              {shift.nurseDisplayName
                                ? `${shift.nurseDisplayName}${shift.nurseEmail ? ` · ${shift.nurseEmail}` : ""}`
                                : "Sin asignar"}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Programado:</strong>{" "}
                              {shift.scheduledStartUtc && shift.scheduledEndUtc
                                ? `${formatAdminCareRequestDateTime(shift.scheduledStartUtc)} – ${formatAdminCareRequestDateTime(shift.scheduledEndUtc)}`
                                : "Sin horario"}
                            </Typography>
                          </Box>
                          {shift.changes.length > 0 && (
                            <Stack spacing={1} sx={{ mt: 1.5 }}>
                              <Typography variant="subtitle2">Historial de cambios</Typography>
                              {shift.changes.map((change) => (
                                <Typography key={change.id} variant="body2" color="text.secondary">
                                  {formatAdminCareRequestDateTime(change.createdAtUtc)} — {change.reason}
                                  <br />
                                  <span style={{ fontSize: "0.85em" }}>
                                    {change.previousNurseDisplayName ?? "Sin asignar"} →{" "}
                                    {change.newNurseDisplayName ?? "Sin asignar"}
                                  </span>
                                </Typography>
                              ))}
                            </Stack>
                          )}
                          {canEditShift && (
                            <Stack spacing={1.25} sx={{ mt: 2 }}>
                              <TextField
                                select
                                label="Nueva enfermera"
                                value={draft.newNurseId}
                                onChange={(event) => updateShiftChangeDraft(shift.id, { newNurseId: event.target.value })}
                                SelectProps={{ native: true }}
                                disabled={isActing}
                                fullWidth
                              >
                                <option value="">Sin asignar en el turno</option>
                                {activeNurses.map((nurse) => (
                                  <option key={nurse.userId} value={nurse.userId}>
                                    {[nurse.name, nurse.lastName].filter(Boolean).join(" ") || nurse.email}
                                  </option>
                                ))}
                              </TextField>
                              <TextField
                                label="Motivo del cambio"
                                value={draft.reason}
                                onChange={(event) => updateShiftChangeDraft(shift.id, { reason: event.target.value })}
                                disabled={isActing}
                                fullWidth
                                multiline
                                minRows={2}
                              />
                              <Button
                                variant="outlined"
                                onClick={() => void runRecordShiftChange(shift.id)}
                                disabled={isActing || !draft.reason.trim()}
                              >
                                Registrar cambio de turno
                              </Button>
                            </Stack>
                          )}
                        </Paper>
                      );
                    })
                  )}
                </Stack>
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

              <Paper sx={{ p: 3.5, borderRadius: 3.5 }}>
                <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                  Acciones administrativas
                </Typography>
                <Stack spacing={1.25} sx={{ mt: 2.2 }}>
                  {canApproveOrReject && (
                    <>
                      <Button
                        variant="outlined"
                        onClick={() => void runTransition("approve")}
                        disabled={isActing || !canApprove}
                        sx={subduedActionButtonSx}
                      >
                        Aprobar solicitud
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => void runTransition("reject")}
                        disabled={isActing}
                        sx={subduedActionButtonSx}
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

                  {detail.status === "Completed" && (
                    <>
                      <Button
                        variant="outlined"
                        onClick={() => setInvoiceModalOpen(true)}
                        disabled={isActing}
                        data-testid="invoice-care-request-button"
                        sx={subduedActionButtonSx}
                      >
                        Facturar servicio
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => setVoidModalOpen(true)}
                        disabled={isActing}
                        data-testid="void-care-request-button"
                        sx={{ ...subduedActionButtonSx, color: "#8b1a1a", borderColor: "rgba(183,79,77,0.4)" }}
                      >
                        Anular servicio
                      </Button>
                    </>
                  )}

                  {detail.status === "Invoiced" && (
                    <>
                      <Button
                        variant="outlined"
                        onClick={() => setPayModalOpen(true)}
                        disabled={isActing}
                        data-testid="pay-care-request-button"
                        sx={{ ...subduedActionButtonSx, color: "#1a5e3a", borderColor: "rgba(44,122,100,0.4)" }}
                      >
                        Confirmar pago
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => setVoidModalOpen(true)}
                        disabled={isActing}
                        data-testid="void-care-request-button"
                        sx={{ ...subduedActionButtonSx, color: "#8b1a1a", borderColor: "rgba(183,79,77,0.4)" }}
                      >
                        Anular servicio
                      </Button>
                    </>
                  )}

                  {(detail.status === "Voided" || detail.status === "Rejected") && (
                    <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      Esta solicitud esta en estado terminal. No hay acciones disponibles.
                    </Typography>
                  )}

                  {!canApproveOrReject && detail.status !== "Approved" &&
                   detail.status !== "Completed" && detail.status !== "Invoiced" &&
                   detail.status !== "Paid" && detail.status !== "Voided" && (
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
      <Dialog
        open={verificationOpen}
        onClose={() => setVerificationOpen(false)}
        maxWidth="md"
        fullWidth
        data-testid="price-verification-modal"
      >
        <DialogTitle>Verificacion de precios</DialogTitle>
        <DialogContent>
          {verificationError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {verificationError}
            </Alert>
          )}
          {verificationResult && (
            <Stack spacing={2}>
              {verificationResult.matches ? (
                <Alert severity="success" data-testid="price-verification-success">
                  Los precios almacenados coinciden con los precios actuales del catalogo (tolerancia: {verificationResult.toleranceUsed}).
                </Alert>
              ) : (
                verificationResult.discrepancies.length > 0 && (
                  <Box data-testid="price-verification-discrepancies">
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Se encontraron {verificationResult.discrepancies.length} diferencia(s) entre los precios almacenados y los actuales.
                    </Alert>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Campo</TableCell>
                          <TableCell align="right">Almacenado</TableCell>
                          <TableCell align="right">Actual</TableCell>
                          <TableCell align="right">Diferencia</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {verificationResult.discrepancies.map((discrepancy) => (
                          <TableRow key={discrepancy.fieldName}>
                            <TableCell>{discrepancy.fieldName}</TableCell>
                            <TableCell align="right">{discrepancy.storedValue.toFixed(4)}</TableCell>
                            <TableCell align="right">{discrepancy.currentValue.toFixed(4)}</TableCell>
                            <TableCell align="right">{discrepancy.difference.toFixed(4)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )
              )}
              {verificationResult.limitationNotes.length > 0 && (
                <Alert severity="info" data-testid="price-verification-limitation">
                  <strong>Nota:</strong> {verificationResult.limitationNotes.join(" ")}
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setVerificationOpen(false)}
            data-testid="price-verification-close-button"
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invoice Modal */}
      <Dialog
        open={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        maxWidth="sm"
        fullWidth
        data-testid="invoice-modal"
      >
        <DialogTitle>Facturar servicio</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Numero de factura"
              value={invoiceNumber}
              onChange={(event) => setInvoiceNumber(event.target.value)}
              disabled={isActing}
              fullWidth
              inputProps={{ "data-testid": "invoice-number-input", "aria-label": "Numero de factura" }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvoiceModalOpen(false)} disabled={isActing}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => void runInvoice()}
            disabled={isActing || !invoiceNumber.trim()}
            data-testid="invoice-submit-button"
          >
            {isActing ? "Procesando..." : "Confirmar factura"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Modal */}
      <Dialog
        open={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        maxWidth="sm"
        fullWidth
        data-testid="payment-modal"
      >
        <DialogTitle>Confirmar pago</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Referencia bancaria"
              value={bankReference}
              onChange={(event) => setBankReference(event.target.value)}
              disabled={isActing}
              fullWidth
              inputProps={{ "data-testid": "bank-reference-input", "aria-label": "Referencia bancaria" }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayModalOpen(false)} disabled={isActing}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => void runPay()}
            disabled={isActing || !bankReference.trim()}
            data-testid="payment-submit-button"
          >
            {isActing ? "Procesando..." : "Confirmar pago"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Void Modal */}
      <Dialog
        open={voidModalOpen}
        onClose={() => setVoidModalOpen(false)}
        maxWidth="sm"
        fullWidth
        data-testid="void-modal"
      >
        <DialogTitle>Anular servicio</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Motivo de anulacion"
              value={voidReason}
              onChange={(event) => setVoidReason(event.target.value)}
              disabled={isActing}
              fullWidth
              multiline
              rows={3}
              inputProps={{ "data-testid": "void-reason-input", "aria-label": "Motivo de anulacion" }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVoidModalOpen(false)} disabled={isActing}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => void runVoid()}
            disabled={isActing || !voidReason.trim()}
            data-testid="void-submit-button"
          >
            {isActing ? "Procesando..." : "Confirmar anulacion"}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminPortalShell>
  );
}
