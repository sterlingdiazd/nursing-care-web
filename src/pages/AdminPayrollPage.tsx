import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Tab,
  Tabs,
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
  getAdminPayrollPeriods,
  getAdminPayrollPeriodById,
  createAdminPayrollPeriod,
  closeAdminPayrollPeriod,
  getAdminPayrollPeriodExportUrl,
  getAdminCompensationRules,
  getAdminDeductions,
  getAdminAdjustments,
  type AdminPayrollPeriodListResult,
  type AdminPayrollPeriodDetail,
  type AdminCompensationRuleListResult,
  type AdminDeductionListResult,
  type AdminCompensationAdjustmentListResult,
} from "../api/adminPayroll";

function formatDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-DO", { dateStyle: "medium" }).format(
    new Date(value + "T00:00:00")
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(value);
}

export default function AdminPayrollPage() {
  const { t } = useTranslation();

  // List state
  const [periods, setPeriods] = useState<AdminPayrollPeriodListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"Open" | "Closed" | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  // Detail state
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<AdminPayrollPeriodDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Create form state
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formCutoffDate, setFormCutoffDate] = useState("");
  const [formPaymentDate, setFormPaymentDate] = useState("");

  const loadPeriods = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAdminPayrollPeriods({
        pageNumber,
        pageSize: 20,
        status: statusFilter,
      });
      setPeriods(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("adminPayroll.errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [pageNumber, statusFilter, t]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const detail = await getAdminPayrollPeriodById(id);
      setSelectedDetail(detail);
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : t("adminPayroll.errors.detailFailed"));
    } finally {
      setDetailLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadPeriods();
  }, [loadPeriods]);

  useEffect(() => {
    if (selectedPeriodId) {
      void loadDetail(selectedPeriodId);
    }
  }, [selectedPeriodId, loadDetail]);

  const handleViewDetail = (id: string) => {
    setSelectedPeriodId(id);
  };

  const handleBackToList = () => {
    setSelectedPeriodId(null);
    setSelectedDetail(null);
    setDetailError(null);
  };

  const handleClosePeriod = async () => {
    if (!selectedPeriodId) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await closeAdminPayrollPeriod(selectedPeriodId);
      await loadDetail(selectedPeriodId);
      await loadPeriods();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : t("adminPayroll.errors.closeFailed"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreatePeriod = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await createAdminPayrollPeriod({
        startDate: formStartDate,
        endDate: formEndDate,
        cutoffDate: formCutoffDate,
        paymentDate: formPaymentDate,
      });
      setCreateDialogOpen(false);
      setFormStartDate("");
      setFormEndDate("");
      setFormCutoffDate("");
      setFormPaymentDate("");
      await loadPeriods();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : t("adminPayroll.errors.createFailed"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusFilter = (status: "Open" | "Closed" | null) => {
    setStatusFilter(status);
    setPageNumber(1);
  };

  const totalPages = periods ? Math.ceil(periods.totalCount / periods.pageSize) : 0;

  // ──────────── DETAIL VIEW ────────────
  if (selectedPeriodId) {
    return (
      <AdminPortalShell
        eyebrow={t("adminPayroll.eyebrow")}
        title={
          selectedDetail
            ? `${formatDate(selectedDetail.startDate)} – ${formatDate(selectedDetail.endDate)}`
            : t("adminPayroll.eyebrow")
        }
        description={t("adminPayroll.description")}
        actions={
          <>
            <Button variant="outlined" onClick={handleBackToList}>
              {t("adminPayroll.actions.backToList")}
            </Button>
            {selectedDetail?.status === "Open" && (
              <Button
                variant="contained"
                color="warning"
                onClick={() => void handleClosePeriod()}
                disabled={actionLoading}
              >
                {actionLoading ? <CircularProgress size={20} /> : t("adminPayroll.actions.closePeriod")}
              </Button>
            )}
            {selectedDetail && (
              <Button
                variant="contained"
                component="a"
                href={getAdminPayrollPeriodExportUrl(selectedPeriodId)}
                download
              >
                {t("adminPayroll.actions.export")}
              </Button>
            )}
          </>
        }
      >
        <Stack spacing={3} data-testid="admin-payroll-detail">
          {detailError && <Alert severity="error">{detailError}</Alert>}
          {actionError && <Alert severity="error">{actionError}</Alert>}

          {detailLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          )}

          {selectedDetail && !detailLoading && (
            <>
              {/* Period metadata */}
              <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
                  <Chip
                    label={selectedDetail.status === "Open" ? t("adminPayroll.status.open") : t("adminPayroll.status.closed")}
                    color={selectedDetail.status === "Open" ? "success" : "default"}
                    size="small"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {t("adminPayroll.list.cutoff")}: {formatDate(selectedDetail.cutoffDate)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("adminPayroll.list.payment")}: {formatDate(selectedDetail.paymentDate)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("adminPayroll.list.lines")}: {selectedDetail.lines.length}
                  </Typography>
                </Stack>
              </Paper>

              {/* Staff summary */}
              <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
                <Box sx={{ p: 2.5 }}>
                  <Typography variant="h6">{t("adminPayroll.detail.staff")}</Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "grey.50" }}>
                        <TableCell>{t("adminPayroll.detail.nurse")}</TableCell>
                        <TableCell align="right">{t("adminPayroll.detail.lineCount")}</TableCell>
                        <TableCell align="right">{t("adminPayroll.detail.gross")}</TableCell>
                        <TableCell align="right">{t("adminPayroll.detail.transport")}</TableCell>
                        <TableCell align="right">{t("adminPayroll.detail.adjustments")}</TableCell>
                        <TableCell align="right">{t("adminPayroll.detail.deductions")}</TableCell>
                        <TableCell align="right">{t("adminPayroll.detail.net")}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedDetail.staffSummary.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                            {t("adminPayroll.list.empty")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        selectedDetail.staffSummary.map((staff) => (
                          <TableRow key={staff.nurseUserId} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {staff.nurseDisplayName}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">{staff.lineCount}</TableCell>
                            <TableCell align="right">{formatCurrency(staff.grossCompensation)}</TableCell>
                            <TableCell align="right">{formatCurrency(staff.transportIncentives)}</TableCell>
                            <TableCell align="right">{formatCurrency(staff.adjustmentsTotal)}</TableCell>
                            <TableCell align="right">{formatCurrency(staff.deductionsTotal)}</TableCell>
                            <TableCell align="right">
                              <Typography fontWeight={700}>{formatCurrency(staff.netCompensation)}</Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Payroll lines */}
              <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
                <Box sx={{ p: 2.5 }}>
                  <Typography variant="h6">{t("adminPayroll.detail.lines")}</Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "grey.50" }}>
                        <TableCell>{t("adminPayroll.detail.nurse")}</TableCell>
                        <TableCell>{t("adminPayroll.detail.description")}</TableCell>
                        <TableCell align="right">{t("adminPayroll.detail.base")}</TableCell>
                        <TableCell align="right">{t("adminPayroll.detail.transport")}</TableCell>
                        <TableCell align="right">{t("adminPayroll.detail.complexity")}</TableCell>
                        <TableCell align="right">{t("adminPayroll.detail.supplies")}</TableCell>
                        <TableCell align="right">{t("adminPayroll.detail.adjustments")}</TableCell>
                        <TableCell align="right">{t("adminPayroll.detail.deductions")}</TableCell>
                        <TableCell align="right">{t("adminPayroll.detail.net")}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedDetail.lines.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                            {t("adminPayroll.list.empty")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        selectedDetail.lines.map((line) => (
                          <TableRow key={line.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {line.nurseDisplayName}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {line.description}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">{formatCurrency(line.baseCompensation)}</TableCell>
                            <TableCell align="right">{formatCurrency(line.transportIncentive)}</TableCell>
                            <TableCell align="right">{formatCurrency(line.complexityBonus)}</TableCell>
                            <TableCell align="right">{formatCurrency(line.medicalSuppliesCompensation)}</TableCell>
                            <TableCell align="right">{formatCurrency(line.adjustmentsTotal)}</TableCell>
                            <TableCell align="right">{formatCurrency(line.deductionsTotal)}</TableCell>
                            <TableCell align="right">
                              <Typography fontWeight={700}>{formatCurrency(line.netCompensation)}</Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </>
          )}
        </Stack>
      </AdminPortalShell>
    );
  }

  // ──────────── MAIN VIEW ────────────
  return (
    <AdminPortalShell
      eyebrow={t("adminPayroll.eyebrow")}
      title={t("adminPayroll.title")}
      description={t("adminPayroll.description")}
      actions={
        <>
          <Button variant="outlined" onClick={() => void loadPeriods()} disabled={loading}>
            {t("adminPayroll.actions.refresh")}
          </Button>
          <Button variant="contained" onClick={() => setCreateDialogOpen(true)}>
            {t("adminPayroll.actions.createPeriod")}
          </Button>
        </>
      }
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label={t("adminPayroll.tabs.periods", "Períodos")} />
          <Tab label={t("adminPayroll.tabs.rules", "Reglas de Compensación")} />
          <Tab label={t("adminPayroll.tabs.deductions", "Deducciones")} />
          <Tab label={t("adminPayroll.tabs.adjustments", "Ajustes")} />
        </Tabs>
      </Box>
{activeTab === 0 && (
        <>
        <Stack spacing={3} data-testid="admin-payroll-page">
        {error && <Alert severity="error">{error}</Alert>}
        {actionError && <Alert severity="error">{actionError}</Alert>}

        {/* Status filter chips */}
        <Stack direction="row" spacing={1}>
          <Chip
            label={t("adminPayroll.filters.all")}
            variant={statusFilter === null ? "filled" : "outlined"}
            onClick={() => handleStatusFilter(null)}
            sx={{
              fontWeight: statusFilter === null ? 700 : 400,
              bgcolor: statusFilter === null ? "rgba(111, 148, 163, 0.18)" : undefined,
            }}
          />
          <Chip
            label={t("adminPayroll.filters.open")}
            variant={statusFilter === "Open" ? "filled" : "outlined"}
            color={statusFilter === "Open" ? "success" : "default"}
            onClick={() => handleStatusFilter("Open")}
            sx={{ fontWeight: statusFilter === "Open" ? 700 : 400 }}
          />
          <Chip
            label={t("adminPayroll.filters.closed")}
            variant={statusFilter === "Closed" ? "filled" : "outlined"}
            onClick={() => handleStatusFilter("Closed")}
            sx={{ fontWeight: statusFilter === "Closed" ? 700 : 400 }}
          />
        </Stack>

        {/* Periods table */}
        <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.50" }}>
                  <TableCell>{t("adminPayroll.list.period")}</TableCell>
                  <TableCell>{t("adminPayroll.status.open")}/{t("adminPayroll.status.closed")}</TableCell>
                  <TableCell>{t("adminPayroll.list.cutoff")}</TableCell>
                  <TableCell>{t("adminPayroll.list.payment")}</TableCell>
                  <TableCell align="right">{t("adminPayroll.list.lines")}</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={28} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {t("adminPayroll.list.loading")}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : !periods || periods.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {t("adminPayroll.list.empty")}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  periods.items.map((item) => (
                    <TableRow key={item.id} hover data-testid="admin-payroll-period-row">
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {formatDate(item.startDate)} – {formatDate(item.endDate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.status === "Open" ? t("adminPayroll.status.open") : t("adminPayroll.status.closed")}
                          size="small"
                          color={item.status === "Open" ? "success" : "default"}
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>{formatDate(item.cutoffDate)}</TableCell>
                      <TableCell>{formatDate(item.paymentDate)}</TableCell>
                      <TableCell align="right">{item.lineCount}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          onClick={() => handleViewDetail(item.id)}
                          data-testid="admin-payroll-view-detail-button"
                        >
                          {t("adminPayroll.actions.viewDetail")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {periods && totalPages > 1 && (
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ py: 2 }}>
              <Button
                size="small"
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
              >
                ← Anterior
              </Button>
              <Typography variant="body2" sx={{ alignSelf: "center" }}>
                {pageNumber} / {totalPages}
              </Typography>
              <Button
                size="small"
                disabled={pageNumber >= totalPages}
                onClick={() => setPageNumber((prev) => prev + 1)}
              >
                Siguiente →
              </Button>
            </Stack>
          )}
        </Paper>
        </Stack>

        {/* Create Period Dialog */}
        <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        data-testid="admin-payroll-create-dialog"
      >
        <DialogTitle>{t("adminPayroll.createForm.title")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {actionError && <Alert severity="error">{actionError}</Alert>}
            <TextField
              label={t("adminPayroll.createForm.startDate")}
              type="date"
              value={formStartDate}
              onChange={(e) => setFormStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
            />
            <TextField
              label={t("adminPayroll.createForm.endDate")}
              type="date"
              value={formEndDate}
              onChange={(e) => setFormEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
            />
            <TextField
              label={t("adminPayroll.createForm.cutoffDate")}
              type="date"
              value={formCutoffDate}
              onChange={(e) => setFormCutoffDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
            />
            <TextField
              label={t("adminPayroll.createForm.paymentDate")}
              type="date"
              value={formPaymentDate}
              onChange={(e) => setFormPaymentDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            {t("adminPayroll.createForm.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleCreatePeriod()}
            disabled={actionLoading || !formStartDate || !formEndDate || !formCutoffDate || !formPaymentDate}
          >
            {actionLoading ? <CircularProgress size={20} /> : t("adminPayroll.createForm.submit")}
          </Button>
        </DialogActions>
      </Dialog>
      </>
      )}
      {activeTab === 1 && (
        <Box sx={{ p: 3 }}>
          <Typography variant="h6">Reglas de Compensación - Próximamente</Typography>
        </Box>
      )}
      {activeTab === 2 && (
        <Box sx={{ p: 3 }}>
          <Typography variant="h6">Deducciones - Próximamente</Typography>
        </Box>
      )}
      {activeTab === 3 && (
        <Box sx={{ p: 3 }}>
          <Typography variant="h6">Ajustes - Próximamente</Typography>
        </Box>
      )}
    </AdminPortalShell>
  );
}
