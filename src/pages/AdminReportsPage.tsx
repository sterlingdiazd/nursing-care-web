import { useEffect, useState, useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import AdminPortalShell from "../components/layout/AdminPortalShell";
import {
  getAdminReport,
  getAdminReportExportUrl,
  type AdminReportResponse,
  type CareRequestPipelineReport,
  type AssignmentApprovalBacklogReport,
  type NurseOnboardingReport,
  type ActiveInactiveUsersReport,
  type NurseUtilizationReport,
  type CareRequestCompletionReport,
  type PriceUsageSummaryReport,
  type NotificationVolumeReport,
} from "../api/adminReports";

interface ReportMetadata {
  key: string;
  label: string;
  description: string;
}

const REPORTS: ReportMetadata[] = [
  {
    key: "care-request-pipeline",
    label: "Estado general de solicitudes",
    description: "Distribucion de solicitudes por estado (Pendiente, Aprobada, Completada, etc).",
  },
  {
    key: "assignment-approval-backlog",
    label: "Pendientes de asignacion y aprobacion",
    description: "Mide el retraso en la gestion de solicitudes que esperan enfermera o aprobacion.",
  },
  {
    key: "nurse-onboarding",
    label: "Registro y activacion de enfermeras",
    description: "Seguimiento del embudo de registro de personal clinico.",
  },
  {
    key: "active-inactive-users",
    label: "Usuarios activos e inactivos",
    description: "Conteo de usuarios por rol y estado de cuenta.",
  },
  {
    key: "nurse-utilization",
    label: "Productividad por enfermera",
    description: "Tasa de cumplimiento y carga de trabajo por profesional.",
  },
  {
    key: "care-request-completion",
    label: "Servicios completados",
    description: "Analisis de cierre de servicios y tiempos promedio de atencion.",
  },
  {
    key: "price-usage-summary",
    label: "Resumen de facturacion y servicios",
    description: "Distribucion de ingresos por tipo de servicio y factores de complejidad.",
  },
  {
    key: "notification-volume",
    label: "Volumen de notificaciones y alertas",
    description: "Estadisticas de comunicacion administrativa y acciones pendientes.",
  },
];

export default function AdminReportsPage() {
  const [selectedReportKey, setSelectedReportKey] = useState<string>(REPORTS[0].key);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [data, setData] = useState<AdminReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedReport = useMemo(
    () => REPORTS.find((r) => r.key === selectedReportKey) || REPORTS[0],
    [selectedReportKey]
  );

  const loadReportData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAdminReport(selectedReportKey, {
        from: fromDate || undefined,
        to: toDate || undefined,
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el reporte.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadReportData();
  }, [selectedReportKey]);

  const handleExport = () => {
    const url = getAdminReportExportUrl(selectedReportKey, {
      from: fromDate || undefined,
      to: toDate || undefined,
    });
    window.location.href = url;
  };

  return (
    <AdminPortalShell
      eyebrow="Centro de Reportes"
      title="Analisis operativo y exportacion de datos"
      description="Selecciona un reporte, filtra por fechas y visualiza los indicadores clave del negocio. Puedes exportar los resultados a CSV para analisis externo."
    >
      <Stack spacing={4}>
        {error && <Alert severity="error">{error}</Alert>}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 2.2fr" },
            gap: 3,
          }}
        >
          {/* Report Selection Sidebar */}
          <Box>
            <Stack spacing={2}>
              <Typography variant="h6">Seleccionar reporte</Typography>
              {REPORTS.map((report) => {
                const active = report.key === selectedReportKey;
                return (
                  <Card
                    key={report.key}
                    onClick={() => setSelectedReportKey(report.key)}
                    sx={{
                      cursor: "pointer",
                      border: active ? "2px solid" : "1px solid",
                      borderColor: active ? "primary.main" : "divider",
                      bgcolor: active ? "rgba(25, 118, 210, 0.04)" : "background.paper",
                      transition: "transform 0.2s",
                      "&:hover": { transform: "translateX(4px)" },
                    }}
                  >
                    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                      <Typography variant="subtitle2" color={active ? "primary" : "textPrimary"} sx={{ fontWeight: 700 }}>
                        {report.label}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {report.description}
                      </Typography>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          </Box>

          {/* Filters and Data Display */}
          <Box>
            <Stack spacing={3}>
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Filtros y acciones</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-end">
                  <TextField
                    label="Desde"
                    type="date"
                    size="small"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                  <TextField
                    label="Hasta"
                    type="date"
                    size="small"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                  <Button variant="contained" onClick={() => void loadReportData()} disabled={isLoading} sx={{ py: 1, minWidth: 120 }}>
                    Actualizar
                  </Button>
                  <Button variant="outlined" onClick={handleExport} sx={{ py: 1, minWidth: 120 }}>
                    Exportar CSV
                  </Button>
                </Stack>
              </Paper>

              <Paper sx={{ p: 4, borderRadius: 4, minHeight: 400 }}>
                <Typography variant="h5" sx={{ mb: 1.5 }}>{selectedReport.label}</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
                  {selectedReport.description}
                </Typography>

                {isLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
                    <CircularProgress />
                  </Box>
                ) : data ? (
                  <ReportVisualizer reportKey={selectedReportKey} data={data} />
                ) : (
                  <Alert severity="info" variant="outlined">
                    No hay datos disponibles para el periodo seleccionado.
                  </Alert>
                )}
              </Paper>
            </Stack>
          </Box>
        </Box>
      </Stack>
    </AdminPortalShell>
  );
}

function ReportVisualizer({ reportKey, data }: { reportKey: string; data: AdminReportResponse }) {
  switch (reportKey) {
    case "care-request-pipeline":
      return <PipelineVisualizer data={data as CareRequestPipelineReport} />;
    case "assignment-approval-backlog":
      return <BacklogVisualizer data={data as AssignmentApprovalBacklogReport} />;
    case "nurse-onboarding":
      return <OnboardingVisualizer data={data as NurseOnboardingReport} />;
    case "active-inactive-users":
      return <UsersVisualizer data={data as ActiveInactiveUsersReport} />;
    case "nurse-utilization":
      return <UtilizationVisualizer data={data as NurseUtilizationReport} />;
    case "care-request-completion":
      return <CompletionVisualizer data={data as CareRequestCompletionReport} />;
    case "price-usage-summary":
      return <PriceVisualizer data={data as PriceUsageSummaryReport} />;
    case "notification-volume":
      return <NotificationsVisualizer data={data as NotificationVolumeReport} />;
    default:
      return <Typography>Reporte desconocido</Typography>;
  }
}

function MetricCard({ label, value, color = "primary" }: { label: string; value: string | number; color?: string }) {
  return (
    <Paper sx={{ p: 3, textAlign: "center", borderRadius: 3, bgcolor: "rgba(0,0,0,0.02)", border: "1px solid", borderColor: "divider" }}>
      <Typography variant="overline" color="textSecondary" sx={{ fontWeight: 700 }}>{label}</Typography>
      <Typography variant="h3" color={color} sx={{ mt: 1 }}>{value}</Typography>
    </Paper>
  );
}

function PipelineVisualizer({ data }: { data: CareRequestPipelineReport }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
        gap: 2,
      }}
    >
      {[
        { label: "Pendientes", value: data.pendingCount },
        { label: "Aprobadas", value: data.approvedCount },
        { label: "Completadas", value: data.completedCount, color: "success.main" },
        { label: "Rechazadas", value: data.rejectedCount, color: "error.main" },
        { label: "Sin asignar", value: data.unassignedCount, color: "warning.main" },
        { label: "Vencidas", value: data.overdueCount, color: "error.dark" },
      ].map((m) => (
        <MetricCard key={m.label} label={m.label} value={m.value} color={m.color} />
      ))}
    </Box>
  );
}

function BacklogVisualizer({ data }: { data: AssignmentApprovalBacklogReport }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
        gap: 2,
      }}
    >
      <MetricCard label="Sin enfermera" value={data.pendingUnassignedCount} color="warning.main" />
      <MetricCard label="Esperando aprobacion" value={data.pendingAssignedAwaitingApprovalCount} color="info.main" />
      <Box sx={{ gridColumn: { sm: "span 2" } }}>
        <MetricCard label="Dias promedio en espera" value={`${data.averageDaysPending.toFixed(1)} dias`} />
      </Box>
    </Box>
  );
}

function OnboardingVisualizer({ data }: { data: NurseOnboardingReport }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
        gap: 2,
      }}
    >
      {[
        { label: "Total registradas", value: data.totalRegisteredCount },
        { label: "Pendientes de revision", value: data.pendingReviewCount, color: "warning.main" },
        { label: "Activas", value: data.activeCount, color: "success.main" },
        { label: "Inactivas", value: data.inactiveCount, color: "text.secondary" },
        { label: "Activadas en periodo", value: data.completedThisPeriodCount },
      ].map((m) => (
        <MetricCard key={m.label} label={m.label} value={m.value} color={m.color} />
      ))}
    </Box>
  );
}

function UsersVisualizer({ data }: { data: ActiveInactiveUsersReport }) {
  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: "grey.50" }}>
            <TableCell sx={{ fontWeight: 700 }}>Perfil</TableCell>
            <TableCell align="center" sx={{ fontWeight: 700 }}>Activas</TableCell>
            <TableCell align="center" sx={{ fontWeight: 700 }}>Inactivas</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[
            { label: "Administrador", active: data.adminActiveCount, inactive: data.adminInactiveCount },
            { label: "Cliente", active: data.clientActiveCount, inactive: data.clientInactiveCount },
            { label: "Enfermera", active: data.nurseActiveCount, inactive: data.nurseInactiveCount },
          ].map((row) => (
            <TableRow key={row.label}>
              <TableCell>{row.label}</TableCell>
              <TableCell align="center" sx={{ color: "success.main", fontWeight: 700 }}>{row.active}</TableCell>
              <TableCell align="center" sx={{ color: "text.secondary" }}>{row.inactive}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function UtilizationVisualizer({ data }: { data: NurseUtilizationReport }) {
  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: "grey.50" }}>
            <TableCell sx={{ fontWeight: 700 }}>Enfermera</TableCell>
            <TableCell align="center" sx={{ fontWeight: 700 }}>Total Asignadas</TableCell>
            <TableCell align="center" sx={{ fontWeight: 700 }}>Completadas</TableCell>
            <TableCell align="center" sx={{ fontWeight: 700 }}>Pendientes</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>Tasa de Cierre</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.rows.map((row) => (
            <TableRow key={row.nurseId}>
              <TableCell sx={{ fontWeight: 500 }}>{row.nurseName}</TableCell>
              <TableCell align="center">{row.totalAssigned}</TableCell>
              <TableCell align="center" sx={{ color: "success.main" }}>{row.completed}</TableCell>
              <TableCell align="center" sx={{ color: "warning.main" }}>{row.pending}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>{(row.completionRate * 100).toFixed(1)}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function CompletionVisualizer({ data }: { data: CareRequestCompletionReport }) {
  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
          gap: 2,
        }}
      >
        <MetricCard label="Total completadas" value={data.totalCompletedCount} color="success.main" />
        <MetricCard label="Cierre promedio" value={`${data.averageDaysToComplete.toFixed(1)} dias`} />
      </Box>
      
      <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 700 }}>Completadas por periodo</Typography>
      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "grey.50" }}>
              <TableCell sx={{ fontWeight: 700 }}>Mes / Periodo</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Completadas</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(data.completionsByRange).map(([range, count]) => (
              <TableRow key={range}>
                <TableCell>{range}</TableCell>
                <TableCell align="right">{count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

function PriceVisualizer({ data }: { data: PriceUsageSummaryReport }) {
  return (
    <Stack spacing={3}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Top tipos de servicio</Typography>
      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "grey.50" }}>
              <TableCell sx={{ fontWeight: 700 }}>Servicio</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Conteo</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Ticket Promedio</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Ingresos Totales</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.topRequestTypes.map((row) => (
              <TableRow key={row.requestType}>
                <TableCell>{row.requestType}</TableCell>
                <TableCell align="center">{row.count}</TableCell>
                <TableCell align="right">${row.averageTotal.toLocaleString()}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>${row.totalRevenue.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
          gap: 3,
        }}
      >
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>Factores de distancia comunes</Typography>
          <Stack spacing={1}>
            {data.topDistanceFactors.map(f => (
              <Chip key={f} label={f} variant="outlined" size="small" sx={{ width: "fit-content" }} />
            ))}
          </Stack>
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>Niveles de complejidad comunes</Typography>
          <Stack spacing={1}>
            {data.topComplexityLevels.map(f => (
              <Chip key={f} label={f} variant="outlined" size="small" sx={{ width: "fit-content" }} />
            ))}
          </Stack>
        </Box>
      </Box>
    </Stack>
  );
}

function NotificationsVisualizer({ data }: { data: NotificationVolumeReport }) {
  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          gap: 2,
        }}
      >
        <MetricCard label="Total notificaciones" value={data.totalNotificationsCount} />
        <MetricCard label="Sin leer" value={data.unreadNotificationsCount} color="warning.main" />
        <MetricCard label="Acciones pendientes" value={data.pendingActionItemsCount} color="error.main" />
      </Box>
      
      <Box>
        <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 700 }}>Volumen por categoria</Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}>
          {Object.entries(data.notificationsByCategory).map(([cat, count]) => (
            <Chip 
              key={cat} 
              label={`${cat}: ${count}`} 
              sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }} 
            />
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}
