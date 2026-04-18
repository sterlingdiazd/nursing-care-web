import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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

import {
  CareRequest,
  CareRequestTransitionAction,
  PricingVerificationResponse,
  assignCareRequestNurse,
  getCareRequestById,
  transitionCareRequest,
  verifyCareRequestPricing,
} from "../api/careRequests";
import { getActiveNurseProfiles, type ActiveNurseProfileSummary } from "../api/adminNurseProfiles";
import WorkspaceShell from "../components/layout/WorkspaceShell";
import { useAuth } from "../context/AuthContext";
import { careRequestTestIds } from "../testing/careRequestTestIds";
import { designTokens } from "../design-system/tokens";

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
  const { roles, userId } = useAuth();
  const [careRequest, setCareRequest] = useState<CareRequest | null>(null);
  const [activeNurses, setActiveNurses] = useState<ActiveNurseProfileSummary[]>([]);
  const [assignedNurseId, setAssignedNurseId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<PricingVerificationResponse | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationOpen, setVerificationOpen] = useState(false);

  const loadCareRequest = async () => {
    if (!id) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getCareRequestById(id);
      setCareRequest(response);
      setAssignedNurseId(response.assignedNurse ?? "");
    } catch (nextError: any) {
      setError(nextError.message ?? "No fue posible cargar la solicitud.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCareRequest();
  }, [id]);

  useEffect(() => {
    if (!roles.includes("ADMIN")) {
      setActiveNurses([]);
      return;
    }

    void getActiveNurseProfiles()
      .then((response) => setActiveNurses(response))
      .catch(() => setActiveNurses([]));
  }, [roles]);

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
    } catch (nextError: any) {
      setVerificationError(nextError.message ?? "No fue posible verificar los precios.");
      setVerificationOpen(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const runAssignment = async () => {
    if (!id || !assignedNurseId) {
      return;
    }

    setIsActing(true);
    setError(null);

    try {
      const updated = await assignCareRequestNurse(id, { assignedNurse: assignedNurseId });
      setCareRequest(updated);
      setAssignedNurseId(updated.assignedNurse ?? assignedNurseId);
    } catch (nextError: any) {
      setError(nextError.message ?? "No fue posible asignar la enfermera.");
    } finally {
      setIsActing(false);
    }
  };

  const assignedNurseRecord =
    activeNurses.find((nurse) => nurse.userId === (careRequest?.assignedNurse ?? assignedNurseId)) ?? null;
  const assignedNurseLabel = assignedNurseRecord
    ? [assignedNurseRecord.name, assignedNurseRecord.lastName].filter(Boolean).join(" ") || assignedNurseRecord.email
    : careRequest?.assignedNurse ?? "Sin asignar";
  const canManageAssignment = roles.includes("ADMIN");
  const canApproveOrReject = roles.includes("ADMIN") && careRequest?.status === "Pending";
  const canApprove = canApproveOrReject && Boolean(careRequest?.assignedNurse ?? assignedNurseId);
  const canComplete =
    roles.includes("NURSE") &&
    Boolean(userId) &&
    careRequest?.status === "Approved" &&
    careRequest.assignedNurse === userId;
  const statusStyles = careRequest ? getStatusStyles(careRequest.status) : null;
  const statusLabel = careRequest ? getStatusLabel(careRequest.status) : "";
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
    <WorkspaceShell
      eyebrow="Detalle de solicitud"
      title={careRequest?.careRequestDescription ?? "Revisa el estado y el detalle del ciclo de vida de la solicitud."}
      description="Usa esta vista para inspeccionar identificadores, marcas de tiempo y las acciones disponibles segun el rol actual."
      actions={
        <>
          <Button
            variant="outlined"
            onClick={() => navigate("/care-requests")}
            data-testid={careRequestTestIds.detail.backButton}
          >
            Volver a la cola
          </Button>
          <Button
            variant="outlined"
            onClick={loadCareRequest}
            disabled={isLoading || isActing}
            data-testid={careRequestTestIds.detail.refreshButton}
          >
            Actualizar
          </Button>
        </>
      }
    >
      <Stack spacing={3} data-testid={careRequestTestIds.detail.page}>
        {error && <Alert severity="error">{error}</Alert>}

        {careRequest && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", xl: "1.25fr 0.75fr" },
              gap: 3,
            }}
            data-testid={careRequestTestIds.detail.mainGrid}
          >
            <Paper sx={{ p: 4, borderRadius: 3 }} data-testid={careRequestTestIds.detail.infoSection}>
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
                      data-testid={careRequestTestIds.detail.statusChip}
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
                  data-testid={careRequestTestIds.detail.fieldsGrid}
                >
                  {[
                    ["ID de usuario", careRequest.userID],
                    ["Enfermera asignada", assignedNurseLabel],
                    ["Enfermera sugerida", careRequest.suggestedNurse ?? "Sin sugerencia"],
                    ["Fecha del servicio", careRequest.careRequestDate ?? "Sin fecha"],
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

            <Paper sx={{ p: 4, borderRadius: 3 }} data-testid={careRequestTestIds.detail.pricingBreakdown}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.2 }}>
                <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                  Desglose de precios
                </Typography>
                {roles.includes("ADMIN") && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={runVerifyPricing}
                    disabled={isVerifying}
                    data-testid={careRequestTestIds.detail.verifyPricingButton}
                    sx={{
                      color: designTokens.color.ink.secondary,
                      borderColor: designTokens.color.border.strong,
                      bgcolor: designTokens.color.surface.secondary,
                      "&:hover": {
                        borderColor: designTokens.color.border.accent,
                        bgcolor: designTokens.color.surface.accent,
                      },
                    }}
                  >
                    {isVerifying ? "Verificando..." : "Verificar precios"}
                  </Button>
                )}
              </Stack>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                  gap: 2,
                }}
              >
                {[
                  { key: "category", label: "Categoria", value: careRequest.pricingCategoryCode ?? null },
                  { key: "base-price", label: "Precio base", value: careRequest.price != null ? `RD$ ${careRequest.price.toFixed(2)}` : null },
                  { key: "category-factor", label: "Factor de categoria", value: careRequest.categoryFactorSnapshot != null ? careRequest.categoryFactorSnapshot.toFixed(4) : null },
                  { key: "distance-factor", label: "Factor de distancia", value: careRequest.distanceFactorMultiplierSnapshot != null ? careRequest.distanceFactorMultiplierSnapshot.toFixed(4) : null },
                  { key: "complexity-factor", label: "Factor de complejidad", value: careRequest.complexityMultiplierSnapshot != null ? careRequest.complexityMultiplierSnapshot.toFixed(4) : null },
                  { key: "client-base-price", label: "Precio base del cliente", value: careRequest.clientBasePrice != null ? `RD$ ${careRequest.clientBasePrice.toFixed(2)}` : null },
                  { key: "line-before-discount", label: "Linea antes de descuento", value: careRequest.lineBeforeVolumeDiscount != null ? `RD$ ${careRequest.lineBeforeVolumeDiscount.toFixed(4)}` : null },
                  { key: "volume-discount", label: "Descuento por volumen", value: careRequest.volumeDiscountPercentSnapshot != null ? `${careRequest.volumeDiscountPercentSnapshot}%` : null },
                  { key: "unit-price-after-discount", label: "Precio unitario tras descuento", value: careRequest.unitPriceAfterVolumeDiscount != null ? `RD$ ${careRequest.unitPriceAfterVolumeDiscount.toFixed(4)}` : null },
                  { key: "subtotal-before-supplies", label: "Subtotal antes de insumos", value: careRequest.subtotalBeforeSupplies != null ? `RD$ ${careRequest.subtotalBeforeSupplies.toFixed(2)}` : null },
                  { key: "medical-supplies", label: "Insumos medicos", value: careRequest.medicalSuppliesCost != null ? `RD$ ${careRequest.medicalSuppliesCost.toFixed(2)}` : null },
                  { key: "total", label: "Total", value: careRequest.total != null ? `RD$ ${careRequest.total.toFixed(2)}` : null },
                ].map(({ key, label, value }) => (
                  <Paper
                    key={key}
                    sx={{ p: 2.5, borderRadius: 2.5, bgcolor: "rgba(247, 244, 238, 0.72)" }}
                    data-testid={careRequestTestIds.detail.pricingField(key)}
                  >
                    <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                      {label}
                    </Typography>
                    <Typography sx={{ mt: 0.9, fontWeight: 700 }}>{value ?? "N/A"}</Typography>
                  </Paper>
                ))}
              </Box>
            </Paper>

            <Stack spacing={3}>
              <Paper sx={{ p: 3, borderRadius: 2.5 }} data-testid={careRequestTestIds.detail.transitionsSection}>
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

              {canManageAssignment && (
                <Paper sx={{ p: 3, borderRadius: 2.5 }} data-testid={careRequestTestIds.detail.assignmentSection}>
                  <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                    Asignacion de enfermeria
                  </Typography>
                  <Stack spacing={1.5} sx={{ mt: 2 }}>
                    <TextField
                      select
                      fullWidth
                      label="Enfermera asignada"
                      value={assignedNurseId}
                      onChange={(event) => setAssignedNurseId(event.target.value)}
                      SelectProps={{ native: true }}
                      disabled={isActing}
                      helperText="Solo administracion puede asignar o reasignar la solicitud."
                      data-testid={careRequestTestIds.detail.assignmentSelect}
                    >
                      <option value="">Selecciona una enfermera activa</option>
                      {activeNurses.map((nurse) => {
                        const label =
                          [nurse.name, nurse.lastName].filter(Boolean).join(" ") || nurse.email;

                        return (
                          <option key={nurse.userId} value={nurse.userId}>
                            {label}
                          </option>
                        );
                      })}
                    </TextField>
                    <Button
                      variant="contained"
                      onClick={runAssignment}
                      disabled={isActing || !assignedNurseId}
                      data-testid={careRequestTestIds.detail.assignmentButton}
                    >
                      {careRequest?.assignedNurse ? "Reasignar enfermera" : "Asignar enfermera"}
                    </Button>
                  </Stack>
                </Paper>
              )}

              <Paper sx={{ p: 3, borderRadius: 2.5 }} data-testid={careRequestTestIds.detail.actionsPanel}>
                <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                  Acciones disponibles
                </Typography>
                <Stack spacing={1.25} sx={{ mt: 2 }}>
                  {canApproveOrReject && (
                    <>
                      <Button
                        variant="outlined"
                        onClick={() => runAction("approve")}
                        disabled={isActing || !canApprove}
                        data-testid={careRequestTestIds.detail.approveButton}
                        sx={subduedActionButtonSx}
                      >
                        Aprobar solicitud
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => runAction("reject")}
                        disabled={isActing}
                        data-testid={careRequestTestIds.detail.rejectButton}
                        sx={subduedActionButtonSx}
                      >
                        Rechazar solicitud
                      </Button>
                    </>
                  )}

                  {canComplete && (
                    <Button
                      variant="outlined"
                      onClick={() => runAction("complete")}
                      disabled={isActing}
                      data-testid={careRequestTestIds.detail.completeButton}
                      sx={subduedActionButtonSx}
                    >
                      Marcar como completada
                    </Button>
                  )}

                  {canApproveOrReject && !canApprove && (
                    <Alert severity="info" variant="outlined">
                      Debes asignar una enfermera activa antes de aprobar la solicitud.
                    </Alert>
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
      <Dialog
        open={verificationOpen}
        onClose={() => setVerificationOpen(false)}
        maxWidth="md"
        fullWidth
        data-testid={careRequestTestIds.detail.verificationModal}
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
                <Alert severity="success" data-testid={careRequestTestIds.detail.verificationSuccess}>
                  Los precios almacenados coinciden con los precios actuales del catalogo (tolerancia: {verificationResult.toleranceUsed}).
                </Alert>
              ) : (
                verificationResult.discrepancies.length > 0 && (
                  <Box data-testid={careRequestTestIds.detail.verificationDiscrepancies}>
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
                <Alert severity="info" data-testid={careRequestTestIds.detail.verificationLimitation}>
                  <strong>Nota:</strong> {verificationResult.limitationNotes.join(" ")}
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setVerificationOpen(false)}
            data-testid={careRequestTestIds.detail.verificationCloseButton}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </WorkspaceShell>
  );
}
