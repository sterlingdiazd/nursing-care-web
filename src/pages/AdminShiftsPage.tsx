import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

import AdminPortalShell from "../components/layout/AdminPortalShell";
import {
  getAdminShifts,
  getAdminShiftById,
  type AdminShiftListResult,
  type AdminShiftRecordDetail,
} from "../api/adminPayroll";

function formatDateTime(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-DO", { 
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function getStatusColor(status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" {
  switch (status) {
    case "Planned": return "info";
    case "Completed": return "success";
    case "Changed": return "secondary";
    default: return "default";
  }
}

export default function AdminShiftsPage() {
  const { t } = useTranslation();

  const [shifts, setShifts] = useState<AdminShiftListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<AdminShiftRecordDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    status: "" as "" | "Planned" | "Completed" | "Changed",
    startDate: "",
    endDate: "",
  });

  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    const fetchShifts = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getAdminShifts({
          pageNumber,
          pageSize,
          status: filters.status || null,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        });
        setShifts(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("adminShifts.errors.loadFailed"));
      } finally {
        setLoading(false);
      }
    };
    fetchShifts();
  }, [pageNumber, filters.status, filters.startDate, filters.endDate, t]);

  const handleRefresh = () => {
    setPageNumber(1);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPageNumber(1);
  };

  const handleViewDetail = async (id: string) => {
    setSelectedShiftId(id);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const detail = await getAdminShiftById(id);
      setSelectedDetail(detail);
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : t("adminShifts.errors.detailFailed"));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedShiftId(null);
    setSelectedDetail(null);
    setDetailError(null);
  };

  return (
    <AdminPortalShell
      eyebrow={t("adminShifts.eyebrow")}
      title={t("adminShifts.title")}
      description={t("adminShifts.description")}
      actions={
        <Button variant="outlined" onClick={handleRefresh}>
          {t("adminShifts.actions.refresh")}
        </Button>
      }
    >
      <Box sx={{ p: 2 }}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{t("adminShifts.filters.status")}</InputLabel>
              <Select
                value={filters.status}
                label={t("adminShifts.filters.status")}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <MenuItem value="">{t("adminShifts.filters.all")}</MenuItem>
                <MenuItem value="Planned">{t("adminShifts.status.planned")}</MenuItem>
                <MenuItem value="Completed">{t("adminShifts.status.completed")}</MenuItem>
                <MenuItem value="Changed">{t("adminShifts.status.changed")}</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label={t("adminShifts.filters.startDate")}
              type="date"
              size="small"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label={t("adminShifts.filters.endDate")}
              type="date"
              size="small"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t("adminShifts.list.date")}</TableCell>
                    <TableCell>{t("adminShifts.list.nurse")}</TableCell>
                    <TableCell>{t("adminShifts.list.careRequest")}</TableCell>
                    <TableCell>{t("adminShifts.list.status")}</TableCell>
                    <TableCell>{t("adminShifts.list.actions")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shifts?.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        {t("adminShifts.list.empty")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    shifts?.items.map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell>{formatDateTime(shift.scheduledStartUtc)}</TableCell>
                        <TableCell>{shift.nurseDisplayName}</TableCell>
                        <TableCell>{shift.careRequestId.slice(0, 8)}...</TableCell>
                        <TableCell>
                          <Chip 
                            label={t(`adminShifts.status.${shift.status.toLowerCase()}`)} 
                            color={getStatusColor(shift.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="small" 
                            onClick={() => handleViewDetail(shift.id)}
                          >
                            {t("adminShifts.actions.viewDetail")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
              <Typography variant="body2">
                {shifts ? `${(pageNumber - 1) * pageSize + 1}-${Math.min(pageNumber * pageSize, shifts.totalCount)} de ${shifts.totalCount}` : ""}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  disabled={pageNumber === 1}
                  onClick={() => setPageNumber(p => p - 1)}
                >
                  Anterior
                </Button>
                <Button
                  size="small"
                  disabled={!shifts || pageNumber * pageSize >= shifts.totalCount}
                  onClick={() => setPageNumber(p => p + 1)}
                >
                  Siguiente
                </Button>
              </Stack>
            </Stack>
          </>
        )}
      </Box>

      <Dialog open={!!selectedShiftId} onClose={handleCloseDetail} maxWidth="md" fullWidth>
        <DialogTitle>{t("adminShifts.detail.title")}</DialogTitle>
        <DialogContent>
          {detailLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : detailError ? (
            <Alert severity="error">{detailError}</Alert>
          ) : selectedDetail ? (
            <Box>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2">{t("adminShifts.list.nurse")}</Typography>
                  <Typography>{selectedDetail.nurseDisplayName}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2">{t("adminShifts.list.date")}</Typography>
                  <Typography>
                    {formatDateTime(selectedDetail.scheduledStartUtc)}
                    {selectedDetail.scheduledEndUtc && ` - ${formatDateTime(selectedDetail.scheduledEndUtc)}`}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2">{t("adminShifts.list.status")}</Typography>
                  <Chip 
                    label={t(`adminShifts.status.${selectedDetail.status.toLowerCase()}`)}
                    color={getStatusColor(selectedDetail.status)}
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle2">{t("adminShifts.list.careRequest")}</Typography>
                  <Typography>{selectedDetail.careRequestId}</Typography>
                </Box>

                {selectedDetail.changeHistory.length > 0 && (
                  <Box>
                    <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                      {t("adminShifts.detail.history")}
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>{t("adminShifts.detail.previousNurse")}</TableCell>
                            <TableCell>{t("adminShifts.detail.newNurse")}</TableCell>
                            <TableCell>{t("adminShifts.detail.reason")}</TableCell>
                            <TableCell>{t("adminShifts.detail.effectiveAt")}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedDetail.changeHistory.map((change) => (
                            <TableRow key={change.id}>
                              <TableCell>{change.previousNurseDisplayName || "—"}</TableCell>
                              <TableCell>{change.newNurseDisplayName || "—"}</TableCell>
                              <TableCell>{change.reason}</TableCell>
                              <TableCell>{formatDateTime(change.effectiveAtUtc)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </Stack>
            </Box>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminPortalShell>
  );
}