import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
import { extractApiErrorMessage } from "../api/errorMessage";

interface ReportMetadata {
  key: string;
  label: string;
  description: string;
}

export default function AdminReportsPage() {
  const { t } = useTranslation();
  const REPORTS: ReportMetadata[] = useMemo(() => [
    {
      key: "care-request-pipeline",
      label: t("adminReports.list.pipeline.label"),
      description: t("adminReports.list.pipeline.description"),
    },
    {
      key: "assignment-approval-backlog",
      label: t("adminReports.list.backlog.label"),
      description: t("adminReports.list.backlog.description"),
    },
    {
      key: "nurse-onboarding",
      label: t("adminReports.list.onboarding.label"),
      description: t("adminReports.list.onboarding.description"),
    },
    {
      key: "active-inactive-users",
      label: t("adminReports.list.users.label"),
      description: t("adminReports.list.users.description"),
    },
    {
      key: "nurse-utilization",
      label: t("adminReports.list.utilization.label"),
      description: t("adminReports.list.utilization.description"),
    },
    {
      key: "care-request-completion",
      label: t("adminReports.list.completion.label"),
      description: t("adminReports.list.completion.description"),
    },
    {
      key: "price-usage-summary",
      label: t("adminReports.list.pricing.label"),
      description: t("adminReports.list.pricing.description"),
    },
    {
      key: "notification-volume",
      label: t("adminReports.list.notifications.label"),
      description: t("adminReports.list.notifications.description"),
    },
  ], [t]);

  const [selectedReportKey, setSelectedReportKey] = useState<string>(REPORTS[0].key);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [reportResult, setReportResult] = useState<{ key: string; data: AdminReportResponse } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedReport = useMemo(
    () => REPORTS.find((r) => r.key === selectedReportKey) || REPORTS[0],
    [selectedReportKey, REPORTS]
  );

  const loadReportData = async () => {
    setIsLoading(true);
    setError(null);
    setReportResult(null);
    try {
      const result = await getAdminReport(selectedReportKey, {
        from: fromDate || undefined,
        to: toDate || undefined,
      });
      setReportResult({ key: selectedReportKey, data: result });
    } catch (err) {
      setError(extractApiErrorMessage(err, t("adminReports.errors.loadFailed")));
      setReportResult(null);
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
      eyebrow={t("adminReports.eyebrow")}
      title={t("adminReports.title")}
      description={t("adminReports.description")}
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
              <Typography variant="h6">{t("adminReports.actions.selectReport")}</Typography>
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
                <Typography variant="h6" sx={{ mb: 2 }}>{t("adminReports.actions.filtersTitle")}</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-end">
                  <TextField
                    label={t("adminReports.actions.from")}
                    type="date"
                    size="small"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                  <TextField
                    label={t("adminReports.actions.to")}
                    type="date"
                    size="small"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                  <Button variant="contained" onClick={() => void loadReportData()} disabled={isLoading} sx={{ py: 1, minWidth: 120 }}>
                    {t("adminReports.actions.refresh")}
                  </Button>
                  <Button variant="outlined" onClick={handleExport} sx={{ py: 1, minWidth: 120 }}>
                    {t("adminReports.actions.export")}
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
                ) : (reportResult && reportResult.key === selectedReportKey) ? (
                  <ReportVisualizer reportKey={selectedReportKey} data={reportResult.data} />
                ) : (
                  <Alert severity="info" variant="outlined">
                    {t("adminReports.list.empty")}
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
  const { t } = useTranslation();
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
      return <Typography>{t("adminReports.list.unknown")}</Typography>;
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
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
        gap: 2,
      }}
    >
      {[
        { label: t("adminReports.list.pipeline.pending"), value: data.pendingCount },
        { label: t("adminReports.list.pipeline.approved"), value: data.approvedCount },
        { label: t("adminReports.list.pipeline.completed"), value: data.completedCount, color: "success.main" },
        { label: t("adminReports.list.pipeline.rejected"), value: data.rejectedCount, color: "error.main" },
        { label: t("adminReports.list.pipeline.unassigned"), value: data.unassignedCount, color: "warning.main" },
        { label: t("adminReports.list.pipeline.overdue"), value: data.overdueCount, color: "error.dark" },
      ].map((m) => (
        <MetricCard key={m.label} label={m.label} value={m.value} color={m.color} />
      ))}
    </Box>
  );
}

function BacklogVisualizer({ data }: { data: AssignmentApprovalBacklogReport }) {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
        gap: 2,
      }}
    >
      <MetricCard label={t("adminReports.list.backlog.unassigned")} value={data.pendingUnassignedCount} color="warning.main" />
      <MetricCard label={t("adminReports.list.backlog.awaitingApproval")} value={data.pendingAssignedAwaitingApprovalCount} color="info.main" />
      <Box sx={{ gridColumn: { sm: "span 2" } }}>
        <MetricCard label={t("adminReports.list.backlog.avgWaitDays")} value={`${data.averageDaysPending.toFixed(1)} dias`} />
      </Box>
    </Box>
  );
}

function OnboardingVisualizer({ data }: { data: NurseOnboardingReport }) {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
        gap: 2,
      }}
    >
      {[
        { label: t("adminReports.list.onboarding.total"), value: data.totalRegisteredCount },
        { label: t("adminReports.list.onboarding.pending"), value: data.pendingReviewCount, color: "warning.main" },
        { label: t("adminReports.list.onboarding.active"), value: data.activeCount, color: "success.main" },
        { label: t("adminReports.list.onboarding.inactive"), value: data.inactiveCount, color: "text.secondary" },
        { label: t("adminReports.list.onboarding.period"), value: data.completedThisPeriodCount },
      ].map((m) => (
        <MetricCard key={m.label} label={m.label} value={m.value} color={m.color} />
      ))}
    </Box>
  );
}

function UsersVisualizer({ data }: { data: ActiveInactiveUsersReport }) {
  const { t } = useTranslation();
  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: "grey.50" }}>
            <TableCell sx={{ fontWeight: 700 }}>{t("adminReports.list.users.profile")}</TableCell>
            <TableCell align="center" sx={{ fontWeight: 700 }}>{t("adminReports.list.users.active")}</TableCell>
            <TableCell align="center" sx={{ fontWeight: 700 }}>{t("adminReports.list.users.inactive")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[
            { label: t("adminAuditLog.roles.admin"), active: data.adminActiveCount, inactive: data.adminInactiveCount },
            { label: t("adminAuditLog.roles.client"), active: data.clientActiveCount, inactive: data.clientInactiveCount },
            { label: t("adminAuditLog.roles.nurse"), active: data.nurseActiveCount, inactive: data.nurseInactiveCount },
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
  const { t } = useTranslation();
  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: "grey.50" }}>
            <TableCell sx={{ fontWeight: 700 }}>{t("adminReports.list.utilization.nurse")}</TableCell>
            <TableCell align="center" sx={{ fontWeight: 700 }}>{t("adminReports.list.utilization.totalAssigned")}</TableCell>
            <TableCell align="center" sx={{ fontWeight: 700 }}>{t("adminReports.list.utilization.completed")}</TableCell>
            <TableCell align="center" sx={{ fontWeight: 700 }}>{t("adminReports.list.utilization.pending")}</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>{t("adminReports.list.utilization.completionRate")}</TableCell>
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
  const { t } = useTranslation();
  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
          gap: 2,
        }}
      >
        <MetricCard label={t("adminReports.list.completion.total")} value={data.totalCompletedCount} color="success.main" />
        <MetricCard label={t("adminReports.list.completion.avgDays")} value={`${data.averageDaysToComplete.toFixed(1)} dias`} />
      </Box>
      
      <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 700 }}>{t("adminReports.list.completion.periodTitle")}</Typography>
      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "grey.50" }}>
              <TableCell sx={{ fontWeight: 700 }}>{t("adminReports.list.completion.range")}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>{t("adminReports.list.completion.total")}</TableCell>
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
  const { t } = useTranslation();
  return (
    <Stack spacing={3}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{t("adminReports.list.pricing.topServices")}</Typography>
      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "grey.50" }}>
              <TableCell sx={{ fontWeight: 700 }}>{t("adminReports.list.pricing.service")}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>{t("adminReports.list.pricing.count")}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>{t("adminReports.list.pricing.avgTicket")}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>{t("adminReports.list.pricing.totalRevenue")}</TableCell>
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
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>{t("adminReports.list.pricing.distanceFactors")}</Typography>
          <Stack spacing={1}>
            {data.topDistanceFactors.map(f => (
              <Chip key={f} label={f} variant="outlined" size="small" sx={{ width: "fit-content" }} />
            ))}
          </Stack>
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>{t("adminReports.list.pricing.complexityLevels")}</Typography>
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
  const { t } = useTranslation();
  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          gap: 2,
        }}
      >
        <MetricCard label={t("adminReports.list.notifications.total")} value={data.totalNotificationsCount} />
        <MetricCard label={t("adminReports.list.notifications.unread")} value={data.unreadNotificationsCount} color="warning.main" />
        <MetricCard label={t("adminReports.list.notifications.pendingActions")} value={data.pendingActionItemsCount} color="error.main" />
      </Box>
      
      <Box>
        <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 700 }}>{t("adminReports.list.notifications.byCategory")}</Typography>
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
