import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import AdminPortalShell from "../components/layout/AdminPortalShell";
import {
  getAdminNursePayrollDetail,
  type NursePayrollPeriodDetailDto,
} from "../api/adminPayroll";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-DO", { dateStyle: "medium" }).format(
    new Date(value.includes("T") ? value : value + "T00:00:00")
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(value);
}

export default function AdminPayrollNurseDetailPage() {
  const navigate = useNavigate();
  const { periodId, nurseUserId } = useParams<{ periodId: string; nurseUserId: string }>();

  const [detail, setDetail] = useState<NursePayrollPeriodDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    if (!periodId || !nurseUserId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getAdminNursePayrollDetail(periodId, nurseUserId);
      setDetail(result);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No fue posible cargar el detalle de nomina de la enfermera."
      );
    } finally {
      setLoading(false);
    }
  }, [periodId, nurseUserId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const handleBack = () => {
    navigate(`/admin/payroll`);
  };

  const pageTitle = detail
    ? `Detalle de Nomina — ${detail.nurseDisplayName}`
    : "Detalle de Nomina";

  return (
    <AdminPortalShell
      eyebrow="Nomina"
      title={pageTitle}
      description="Desglose de compensacion por servicio y deducciones del periodo."
      actions={
        <Button variant="outlined" onClick={handleBack}>
          Volver al Periodo
        </Button>
      }
    >
      <Stack spacing={3} data-testid="nurse-payroll-detail-panel">
        {error && (
          <Alert severity="error" data-testid="error-toast">
            {error}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {detail && !loading && (
          <Box data-testid="nurse-payroll-detail-loaded">
            {/* Period + nurse header metadata */}
            <Stack spacing={3}>
              <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
                  <Typography variant="h6" fontWeight={700}>
                    {detail.nurseDisplayName}
                  </Typography>
                  <Chip
                    label={detail.periodStatus === "Open" ? "Abierto" : "Cerrado"}
                    color={detail.periodStatus === "Open" ? "success" : "default"}
                    size="small"
                  />
                  <Typography variant="body2" color="text.secondary">
                    Periodo: {formatDate(detail.periodStartDate)} – {formatDate(detail.periodEndDate)}
                  </Typography>
                </Stack>
              </Paper>

              {/* Totals summary */}
              <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Resumen de Compensacion
                </Typography>
                <Stack direction="row" spacing={4} flexWrap="wrap">
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Compensacion Bruta
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {formatCurrency(detail.grossCompensation)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Incentivos de Transporte
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {formatCurrency(detail.transportIncentives)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Ajustes
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {formatCurrency(detail.adjustmentsTotal)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Deducciones
                    </Typography>
                    <Typography variant="body1" fontWeight={600} color="error">
                      {formatCurrency(detail.deductionsTotal)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Compensacion Neta
                    </Typography>
                    <Typography variant="body1" fontWeight={700} color="primary">
                      {formatCurrency(detail.netCompensation)}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              {/* Services breakdown table */}
              <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
                <Box sx={{ p: 2.5 }}>
                  <Typography variant="h6">Desglose por Servicio</Typography>
                </Box>
                <TableContainer>
                  <Table size="small" data-testid="nurse-payroll-services-table">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "grey.50" }}>
                        <TableCell scope="col">Descripcion</TableCell>
                        <TableCell scope="col">Fecha</TableCell>
                        <TableCell scope="col" align="right">Base</TableCell>
                        <TableCell scope="col" align="right">Transporte</TableCell>
                        <TableCell scope="col" align="right">Complejidad</TableCell>
                        <TableCell scope="col" align="right">Insumos</TableCell>
                        <TableCell scope="col" align="right">Ajustes</TableCell>
                        <TableCell scope="col" align="right">Deducciones</TableCell>
                        <TableCell scope="col" align="right">Neto</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detail.services.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                            <Typography color="text.secondary">
                              No hay servicios registrados para este periodo.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        detail.services.map((svc, idx) => (
                          <TableRow key={svc.serviceExecutionId || idx} hover>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{
                                  maxWidth: 200,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {svc.description}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {formatDate(svc.serviceDate)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(svc.baseCompensation)}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(svc.transportIncentive)}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(svc.complexityBonus)}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(svc.medicalSuppliesCompensation)}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(svc.adjustmentsTotal)}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(svc.deductionsTotal)}
                            </TableCell>
                            <TableCell align="right">
                              <Typography fontWeight={700}>
                                {formatCurrency(svc.netCompensation)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Deductions table */}
              <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
                <Box sx={{ p: 2.5 }}>
                  <Typography variant="h6">Deducciones</Typography>
                </Box>
                <TableContainer>
                  <Table size="small" data-testid="nurse-payroll-deductions-table">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "grey.50" }}>
                        <TableCell scope="col">Concepto</TableCell>
                        <TableCell scope="col">Tipo</TableCell>
                        <TableCell scope="col" align="right">Monto</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detail.deductions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                            <Typography color="text.secondary">
                              No hay deducciones registradas para este periodo.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        detail.deductions.map((ded) => (
                          <TableRow key={ded.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {ded.label}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{ded.deductionType}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography fontWeight={600} color="error">
                                {formatCurrency(ded.amount)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Stack>
          </Box>
        )}
      </Stack>
    </AdminPortalShell>
  );
}
